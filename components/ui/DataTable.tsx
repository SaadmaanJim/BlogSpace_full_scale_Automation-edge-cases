import type { ReactNode } from 'react';

export interface Column<T> { key: string; header: string; render: (row: T) => ReactNode }
interface DataTableProps<T> { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; testId?: string }

export function DataTable<T>({ columns, rows, rowKey, testId }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table data-testid={testId} className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className="px-4 py-3 font-medium">{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)}>{columns.map((c) => <td key={c.key} className="px-4 py-3 align-middle">{c.render(row)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
