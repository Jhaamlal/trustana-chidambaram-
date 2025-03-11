import { useState } from "react"
import { Product } from "@/app/types/product"

export function useProductSearch() {
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  const searchProducts = async (
    query: string,
    filters: Record<string, any> = {},
    limit: number = 20
  ) => {
    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch("/api/products/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          filters,
          limit,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to search products")
      }

      const data = await response.json()
      setResults(data.products)
      return data.products
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
      return []
    } finally {
      setIsSearching(false)
    }
  }

  return {
    searchProducts,
    results,
    isSearching,
    error,
  }
}
