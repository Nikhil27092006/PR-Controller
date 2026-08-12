import React, { useState, useMemo } from 'react'

export default function DataTable({
  columns,
  data = [],
  loading = false,
  error = null,
  emptyMessage = 'No records found.',
  searchPlaceholder = 'Filter rows...',
  searchKey = '',
  filterComponent = null,
  pageSize = 10,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  const processedData = useMemo(() => {
    let result = [...data]
    if (searchQuery && searchKey) {
      result = result.filter((item) => {
        const value = item[searchKey]
        return value ? String(value).toLowerCase().includes(searchQuery.toLowerCase()) : false
      })
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key]
        let valB = b[sortConfig.key]
        if (typeof valA === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        } else {
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
          return 0
        }
      })
    }
    return result
  }, [data, searchQuery, searchKey, sortConfig])

  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return processedData.slice(startIdx, startIdx + pageSize)
  }, [processedData, currentPage, pageSize])

  const totalPages = Math.ceil(processedData.length / pageSize)

  return (
    <div className="datatable-wrap">
      {/* Toolbar */}
      <div className="datatable-toolbar">
        {searchKey && (
          <div className="datatable-search-wrap">
            <svg className="datatable-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="datatable-search"
              aria-label="Filter rows"
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {filterComponent}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="table-el" role="grid">
          <thead className="table-thead">
            <tr>
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key
                return (
                  <th
                    key={col.key}
                    className="table-th"
                    onClick={() => col.sortable && requestSort(col.key)}
                    style={{
                      cursor: col.sortable ? 'pointer' : 'default',
                      width: col.width || 'auto',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                    scope="col"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {col.label}
                      {col.sortable && (
                        <span style={{
                          fontSize: '0.625rem',
                          color: isSorted ? 'var(--cyan-400)' : 'var(--text-20)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem', color: 'var(--text-40)', fontSize: '0.875rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem', color: '#f87171', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-40)', fontSize: '0.875rem' }}>
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="table-tr">
                  {columns.map((col) => (
                    <td key={col.key} className="table-td">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && !error && (
        <div className="datatable-pagination" role="navigation" aria-label="Table pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} rows
          </div>
          <div className="pagination-btns">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="page-btn"
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : Math.max(1, Math.min(currentPage - 3, totalPages - 6)) + i
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`page-btn ${currentPage === p ? 'active' : ''}`}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="page-btn"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
