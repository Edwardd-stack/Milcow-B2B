import type { Paginated } from '@milcow/shared';

/** page/limit → Prisma's skip/take */
export function toSkipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export function toPaginated<T>(
  list: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { list, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
