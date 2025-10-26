import dotenv from 'dotenv';
dotenv.config({
  path: ['.env'],
  override: true,
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
};
