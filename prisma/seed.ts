import { PrismaClient, Role, FlagState } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();

async function upsertEnvironments() {
  const envs = [
    { key: 'dev', name: 'Development' },
    { key: 'staging', name: 'Staging' },
    { key: 'prod', name: 'Production' },
  ];
  return Promise.all(
    envs.map((e) =>
      db.environment.upsert({
        where: { key: e.key },
        update: { name: e.name },
        create: e,
      }),
    ),
  );
}

async function upsertUsers() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const viewerHash = await bcrypt.hash('viewer123', 10);

  const admin = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', passwordHash: adminHash, role: Role.ADMIN },
  });

  const viewer = await db.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: { email: 'viewer@example.com', passwordHash: viewerHash, role: Role.VIEWER },
  });

  return { admin, viewer };
}

async function upsertFeatures() {
  const features = [
    { key: 'new-ui', name: 'New UI', description: 'Shiny redesign' },
    { key: 'fast-checkout', name: 'Fast Checkout', description: 'Streamlined checkout path' },
  ];
  const created = [];
  for (const f of features) {
    const rec = await db.feature.upsert({
      where: { key: f.key },
      update: { name: f.name, description: f.description ?? null },
      create: f,
    });
    created.push(rec);
  }
  return created;
}

async function ensureFlagAssignments(featureKeys: string[], envKeys: string[]) {
  const envs = await db.environment.findMany({ where: { key: { in: envKeys } } });
  const feats = await db.feature.findMany({ where: { key: { in: featureKeys } } });

  // Helper to resolve ids
  const envByKey = Object.fromEntries(envs.map((e) => [e.key, e]));
  const featByKey = Object.fromEntries(feats.map((f) => [f.key, f]));

  // Defaults:
  // - new-ui: OFF in prod, PERCENTAGE 25 in staging, ON in dev
  // - fast-checkout: OFF in prod, OFF in staging, ON in dev
  const plans: Array<{
    featureKey: string;
    envKey: string;
    state: FlagState;
    rolloutPct?: number;
  }> = [
    { featureKey: 'new-ui', envKey: 'dev', state: FlagState.ON },
    { featureKey: 'new-ui', envKey: 'staging', state: FlagState.PERCENTAGE, rolloutPct: 25 },
    { featureKey: 'new-ui', envKey: 'prod', state: FlagState.OFF },

    { featureKey: 'fast-checkout', envKey: 'dev', state: FlagState.ON },
    { featureKey: 'fast-checkout', envKey: 'staging', state: FlagState.OFF },
    { featureKey: 'fast-checkout', envKey: 'prod', state: FlagState.OFF },
  ];

  for (const p of plans) {
    const feature = featByKey[p.featureKey];
    const env = envByKey[p.envKey];
    if (!feature || !env) continue;

    await db.flagAssignment.upsert({
      where: { feature_env_unique: { featureId: feature.id, environmentId: env.id } },
      update: { state: p.state, rolloutPct: p.rolloutPct ?? null },
      create: {
        featureId: feature.id,
        environmentId: env.id,
        state: p.state,
        rolloutPct: p.rolloutPct ?? null,
      },
    });
  }
}

async function main() {
  const [envs, users, features] = await Promise.all([
    upsertEnvironments(),
    upsertUsers(),
    upsertFeatures(),
  ]);

  await ensureFlagAssignments(
    features.map((f) => f.key),
    envs.map((e) => e.key),
  );

  console.warn('Seed complete:', {
    environments: envs.map((e) => e.key),
    users: [users.admin.email, users.viewer.email],
    features: features.map((f) => f.key),
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
