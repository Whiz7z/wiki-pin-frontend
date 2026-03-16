/** Paginated response from list endpoints (count, next, previous, results) */
export type WithPagination<T, AdditionalFields = {}> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
} & AdditionalFields;

/** Pagination meta only (for updating store after fetchNextPage) */
export type PaginationMeta = Pick<WithPagination<unknown>, 'count' | 'next' | 'previous'>;

/** Empty pagination state; cast to WithPagination<YourItem[]> in stores */
export const emptyPaginationState: WithPagination<unknown[]> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};