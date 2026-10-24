"use client";

import { useTable, type BaseRecord, type CrudFilter } from "@refinedev/core";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable, Pager, type Column } from "@/components/ui/table";
import { FilterBar, type FilterDef } from "./filter-bar";

export type ResourceListProps<T extends BaseRecord> = {
  resource: string;
  title: string;
  description?: string;
  columns: Column<T>[];
  filters?: FilterDef[];
  initialFilters?: CrudFilter[];
  permanentFilters?: CrudFilter[];
  createHref?: string;
  createLabel?: string;
  actions?: React.ReactNode;
  pageSize?: number;
  paginate?: boolean;
  meta?: Record<string, unknown>;
  empty?: React.ReactNode;
  rowKey?: (row: T) => string | number;
  /** Render without the page header (embedded in another page). */
  embedded?: boolean;
  caption?: string;
  children?: React.ReactNode;
};

export function ResourceList<T extends BaseRecord>({
  resource,
  title,
  description,
  columns,
  filters: filterDefs = [],
  initialFilters,
  permanentFilters,
  createHref,
  createLabel,
  actions,
  pageSize = 20,
  paginate = true,
  meta,
  empty,
  rowKey = (r) => r.id as string | number,
  embedded,
  caption,
  children,
}: ResourceListProps<T>) {
  const { result, tableQuery, currentPage, setCurrentPage, pageCount, filters, setFilters } = useTable<T>({
    resource,
    pagination: paginate ? { pageSize } : { mode: "off" },
    filters: { initial: initialFilters, permanent: permanentFilters },
    syncWithLocation: !embedded,
    meta,
  });

  const onFilter = (field: string, value: string | undefined) =>
    setFilters((prev) => [
      ...prev.filter((f) => !("field" in f && f.field === field)),
      { field, operator: "eq", value },
    ]);

  return (
    <>
      {!embedded && (
        <PageHeader
          title={title}
          description={description}
          actions={
            (createHref || actions) && (
              <>
                {actions}
                {createHref && <ButtonLink href={createHref}>{createLabel ?? "Create"}</ButtonLink>}
              </>
            )
          }
        />
      )}
      {children}
      {filterDefs.length > 0 && <FilterBar defs={filterDefs} filters={filters} onChange={onFilter} />}
      <DataTable
        caption={caption ?? title}
        columns={columns}
        rows={result.data}
        rowKey={rowKey}
        loading={tableQuery.isLoading}
        error={tableQuery.error?.message}
        empty={empty}
      />
      {paginate && (result.total ?? 0) > pageSize && (
        <Pager
          page={currentPage}
          pageCount={pageCount}
          total={result.total}
          hasNext={currentPage < pageCount}
          onPage={setCurrentPage}
        />
      )}
    </>
  );
}
