import type { ParsedQs } from 'qs';

export type SortDirection = 'asc' | 'desc';
export type AllowedSort<T extends string> = Record<T, true>;

/**
 * Accepts Express' req.query (ParsedQs) OR any plain record of unknown values.
 */
export function getPaginationParams(reqQuery: ParsedQs | Record<string, unknown>) {
  const pageRaw = getNumber(reqQuery.page, 1);
  const pageSizeRaw = getNumber(reqQuery.pageSize, 20);

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(pageSizeRaw) ? clamp(pageSizeRaw, 1, 100) : 20;

  const q = getString(reqQuery.q);
  const sort = getString(reqQuery.sort);

  return { page, pageSize, q, sort };
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getString(v: unknown): string | undefined {
  return typeof v === 'string' ? v.trim() : undefined;
}

function getNumber(v: unknown, fallback: number): number {
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof v === 'number') return v;
  return fallback;
}

/**
 * Parses a comma-separated sort string like "createdAt:desc,name:asc"
 * and returns a plain array. Only fields in `allowed` are included.
 */
export function buildOrderBy<T extends string>(
  sort: string | undefined,
  allowed: AllowedSort<T>,
): Array<Record<T, SortDirection>> {
  const orderBy: Record<T, SortDirection>[] = [];
  if (!sort) return orderBy;

  for (const part of sort.split(',')) {
    const [rawField, rawDir] = part.split(':').map((s) => s?.trim());
    const field = rawField as T;
    const dir = (rawDir?.toLowerCase() === 'desc' ? 'desc' : 'asc') as SortDirection;
    if (field && allowed[field]) {
      orderBy.push({ [field]: dir } as Record<T, SortDirection>);
    }
  }
  return orderBy;
}

/**
 * A generic paginator that avoids `any` by using `unknown` + constraints.
 * Works with Prisma delegates that expose findMany/count.
 */
type FindManyFn<TArgs, TItem> = (args: TArgs) => Promise<TItem[]>;
type CountFn<TArgs> = (args: TArgs) => Promise<number>;

type ArgsWithCommonPaging = {
  skip?: number;
  take?: number;
  orderBy?: unknown;
  where?: unknown;
  select?: unknown;
  include?: unknown;
};

type CountArgsShape = { where?: unknown };

export type Delegate<TFindManyArgs, TCountArgs, TItem> = {
  findMany: FindManyFn<TFindManyArgs, TItem>;
  count: CountFn<TCountArgs>;
};

/**
 * paginate() is generic over the model's findMany/count args.
 * You pass your model delegate (e.g., prisma.user) and the paging params.
 */
export async function paginate<
  TItem,
  TFindManyArgs extends ArgsWithCommonPaging,
  TCountArgs extends CountArgsShape,
>(
  model: Delegate<TFindManyArgs, TCountArgs, TItem>,
  params: {
    page: number;
    pageSize: number;
    orderBy: TFindManyArgs['orderBy'];
    where?: TFindManyArgs['where'];
    select?: TFindManyArgs['select'];
    include?: TFindManyArgs['include'];
  },
) {
  const { page, pageSize, orderBy, where, select, include } = params;

  const [items, total] = await Promise.all([
    model.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      ...(where ? { where } : {}),
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
    } as TFindManyArgs),
    model.count({ ...(where ? { where } : {}) } as TCountArgs),
  ]);

  return { items, total };
}
