"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ProductList from "@/app/components/products/ProductList"
import ProductFilters from "@/app/components/products/ProductFilters"
import EnrichmentButton from "@/app/components/products/EnrichmentButton"
import { useProducts } from "@/app/hooks/useProducts"
import { useAttributes } from "@/app/hooks/useAttributes"

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const sortField = searchParams.get("sortField") || "name"
  const sortOrder = searchParams.get("sortOrder") || "asc"
  const filtersParam = searchParams.get("filters")

  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, any>>(
    filtersParam ? JSON.parse(filtersParam) : {}
  )

  const { products, pagination, loading, error } = useProducts({
    page,
    limit,
    sortField,
    sortOrder,
    filters,
  })

  const { attributes, loading: attributesLoading } = useAttributes()

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)

    // Update URL with new filters
    const params = new URLSearchParams()
    params.set("page", "1") // Reset to first page
    params.set("limit", limit.toString())
    params.set("sortField", sortField)
    params.set("sortOrder", sortOrder)
    params.set("filters", JSON.stringify(newFilters))

    router.push(`/products?${params.toString()}`)
  }

  const handleSortChange = (field: string) => {
    const newSortOrder =
      field === sortField && sortOrder === "asc" ? "desc" : "asc"

    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", limit.toString())
    params.set("sortField", field)
    params.set("sortOrder", newSortOrder)
    params.set("filters", JSON.stringify(filters))

    router.push(`/products?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    params.set("page", newPage.toString())
    params.set("limit", limit.toString())
    params.set("sortField", sortField)
    params.set("sortOrder", sortOrder)
    params.set("filters", JSON.stringify(filters))

    router.push(`/products?${params.toString()}`)
  }

  const handleProductSelection = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts((prev) => [...prev, productId])
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(products.map((product) => product._id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleEnrichmentComplete = () => {
    // Refresh the product list
    router.refresh()
    // Clear selection
    setSelectedProducts([])
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex space-x-4">
          {/* Hello there */}
          <EnrichmentButton
            selectedProducts={selectedProducts}
            onEnrichmentComplete={handleEnrichmentComplete}
            disabled={selectedProducts.length === 0}
          />
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <ProductFilters
          attributes={attributes}
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={attributesLoading}
        />
      </div>

      <div className="card">
        <ProductList
          products={products}
          attributes={attributes}
          pagination={pagination}
          loading={loading}
          error={error}
          sortField={sortField}
          sortOrder={sortOrder}
          selectedProducts={selectedProducts}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onProductSelect={handleProductSelection}
          onSelectAll={handleSelectAll}
        />
      </div>
    </div>
  )
}
