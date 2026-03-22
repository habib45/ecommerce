import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Row,
} from "@tanstack/react-table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  /** Pass search value + setter from outside (for server-side search) */
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  /** Show internal client-side search input */
  clientSearch?: boolean;
  pageSize?: number;
  toolbar?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyMessage = "No data found",
  onRowClick,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  clientSearch,
  pageSize = 20,
  toolbar,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Use external search if provided, else internal
  const isExternalSearch = searchValue !== undefined && onSearchChange !== undefined;
  const searchVal = isExternalSearch ? searchValue : globalFilter;
  const setSearch = isExternalSearch ? onSearchChange : setGlobalFilter;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: clientSearch ? globalFilter : undefined,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const showSearch = clientSearch || isExternalSearch;

  return (
    <div>
      {/* Toolbar row */}
      {(showSearch || toolbar) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {showSearch && (
            <div className="relative max-w-sm flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchVal}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchVal && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2 ml-auto">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">{emptyMessage}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={`px-4 py-3 font-medium text-left select-none ${canSort ? "cursor-pointer hover:bg-gray-100" : ""} ${(header.column.columnDef.meta as any)?.className ?? ""}`}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-gray-400">
                              {sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : "↕"}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={`${onRowClick ? "cursor-pointer" : ""} hover:bg-gray-50 transition-colors`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-4 py-3 ${(cell.column.columnDef.meta as any)?.className ?? ""}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!isLoading && table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-500">
              Showing {table.getState().pagination.pageIndex * pageSize + 1}–
              {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, table.getFilteredRowModel().rows.length)} of{" "}
              {table.getFilteredRowModel().rows.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: table.getPageCount() }, (_, i) => i)
                .filter((i) => Math.abs(i - table.getState().pagination.pageIndex) <= 2)
                .map((i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`w-8 h-8 rounded border text-xs font-medium ${
                      i === table.getState().pagination.pageIndex
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
