import { ReactNode } from "react"

interface TableProps {
  headers: {
    key: string
    label: string
    sortable?: boolean
  }[]
  children: ReactNode
  sortField?: string
  sortOrder?: "asc" | "desc"
  onSort?: (field: string) => void
}

export default function Table({
  headers,
  children,
  sortField,
  sortOrder,
  onSort,
}: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                scope="col"
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${header.sortable ? "cursor-pointer hover:bg-gray-100" : ""}
                `}
                onClick={() => {
                  if (header.sortable && onSort) {
                    onSort(header.key)
                  }
                }}
              >
                <div className="flex items-center space-x-1">
                  <span>{header.label}</span>
                  {header.sortable && sortField === header.key && (
                    <span>{sortOrder === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>
  )
}
