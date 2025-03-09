import Table from "../ui/Table"
import Button from "../ui/Button"
import { Attribute, Product } from "@/app/types"

interface ProductListProps {
  products: Product[]
  attributes: Attribute[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  loading: boolean
  error: string | null
  sortField: string
  sortOrder: string
  selectedProducts: string[]
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  onProductSelect: (productId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export default function ProductList({
  products,
  attributes,
  pagination,
  loading,
  error,
  sortField,
  sortOrder,
  selectedProducts,
  onSortChange,
  onPageChange,
  onProductSelect,
  onSelectAll,
}: ProductListProps) {
  // Generate table headers from attributes
  const headers = [
    { key: "select", label: "", sortable: false },
    { key: "name", label: "Name", sortable: true },
    { key: "brand", label: "Brand", sortable: true },
    { key: "barcode", label: "Barcode", sortable: true },
    ...attributes.map((attr) => ({
      key: `attr.${attr.name}`,
      label: attr.displayName,
      sortable: true,
    })),
  ]

  // Function to get attribute value for display
  const getAttributeValue = (product: Product, attrName: string): string => {
    if (!product.attr) return "N/A"

    const attribute = product.attr.find((a) => a.k === attrName)
    if (!attribute) return "N/A"

    if (attribute.u) {
      return `${attribute.v} ${attribute.u}`
    }

    return String(attribute.v)
  }

  // Check if all products on current page are selected
  const allSelected =
    products.length > 0 &&
    products.every((product) => selectedProducts.includes(product._id))

  return (
    <div>
      {loading ? (
        <div className="text-center py-10">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading spinner"
            role="img"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No products found. Try adjusting your filters or import some
            products.
          </p>
        </div>
      ) : (
        <>
          <Table
            headers={headers}
            sortField={sortField}
            sortOrder={sortOrder === "desc" ? "desc" : "asc"}
            onSort={onSortChange}
          >
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      id={`product-${product._id}`}
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={(e) =>
                        onProductSelect(product._id, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Select ${product.name}`}
                    />
                    <label
                      htmlFor={`product-${product._id}`}
                      className="sr-only"
                    >
                      Select {product.name}
                    </label>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {product.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{product.brand}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{product.barcode}</div>
                </td>
                {attributes.map((attr) => (
                  <td
                    key={`${product._id}-${attr.name}`}
                    className="px-6 py-4 whitespace-nowrap"
                  >
                    <div className="text-sm text-gray-500">
                      {getAttributeValue(product, attr.name)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <input
                id="select-all-products"
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                aria-label="Select all products"
              />
              <label
                htmlFor="select-all-products"
                className="text-sm text-gray-700"
              >
                {selectedProducts.length} selected
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} products
              </span>
              <div
                className="flex space-x-1"
                role="navigation"
                aria-label="Pagination"
              >
                <Button
                  variant="secondary"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  aria-label="Previous page"
                >
                  Previous
                </Button>

                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const pageNum =
                      pagination.page > 3 ? pagination.page - 3 + i + 1 : i + 1

                    if (pageNum <= pagination.pages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum
                              ? "primary"
                              : "secondary"
                          }
                          onClick={() => onPageChange(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          aria-current={
                            pagination.page === pageNum ? "page" : undefined
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    return null
                  }
                )}

                <Button
                  variant="secondary"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
