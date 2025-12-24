"use client";

/**
 * Responsive Table Component
 * Displays as a table on desktop and cards on mobile
 */

import { ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  renderMobileCard: (row: T) => ReactNode;
  keyExtractor: (row: T) => string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  renderMobileCard,
  keyExtractor,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.className || ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">{data.map((row) => renderMobileCard(row))}</div>
    </>
  );
}
