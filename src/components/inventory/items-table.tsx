import { DataTable, type Column } from "@/components/ui/table";

/** Read-only line items of a document (PO, transfer, BOM). */
export function ItemsTable<T>({
  rows,
  columns,
  caption,
  empty = "No lines.",
}: {
  rows: T[];
  columns: Column<T>[];
  caption: string;
  empty?: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-drs-green">{caption}</h2>
      <DataTable
        caption={caption}
        columns={columns}
        rows={rows}
        rowKey={(r) => JSON.stringify(r)}
        empty={empty}
      />
    </section>
  );
}
