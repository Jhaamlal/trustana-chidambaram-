import { useState, useEffect } from "react"
import { Product } from "@/app/types/product"

interface UseProductsProps {
  page: number
  limit: number
  sortField: string
  sortOrder: string
  filters: Record<string, any>
}

export function useProducts({
  page,
  limit,
  sortField,
  sortOrder,
  filters,
}: UseProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sortField,
          sortOrder,
          filters: JSON.stringify(filters),
        })

        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch products")
        }

        setProducts(data.products)
        setPagination(data.pagination)
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching products")
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [page, limit, sortField, sortOrder, filters])

  return { products, pagination, loading, error }
}
