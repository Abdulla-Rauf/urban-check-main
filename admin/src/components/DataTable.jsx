import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Pagination } from './Pagination';

export const DataTable = ({
  title,
  description,
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Filter records...',
  searchValue,
  onSearchChange,
  actionButton,
  filters,
  pagination,
  emptyMessage = 'No records match the current filter criteria.',
}) => {
  const [internalSearch, setInternalSearch] = useState('');

  // Handle controlled vs uncontrolled search
  const isControlledSearch = onSearchChange !== undefined;
  const currentSearch = isControlledSearch ? searchValue || '' : internalSearch;

  const handleSearchChange = (e) => {
    if (isControlledSearch) {
      onSearchChange(e.target.value);
    } else {
      setInternalSearch(e.target.value);
    }
  };

  const displayedData = isControlledSearch
    ? data
    : data.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(currentSearch.toLowerCase())
        )
      );

  return (
    <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {filters}

          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={currentSearch}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-admin-accent w-48 text-slate-700"
            />
          </div>

          {actionButton}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-admin-accent font-medium text-xs">
              <Loader2 size={18} className="animate-spin" />
              <span>Fetching telemetry...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-slate-400"
                >
                  <p className="font-medium text-slate-500">{emptyMessage}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try adjusting your search query or reset filter options.
                  </p>
                </td>
              </tr>
            ) : (
              displayedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-5 py-3.5 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination ? (
        <Pagination {...pagination} />
      ) : (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Showing {displayedData.length} of {data.length} total entries
          </span>
          <span className="font-mono">Real-time DB synced</span>
        </div>
      )}
    </div>
  );
};
