// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createProductSearchService } from "@/app/services/product-search-service"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { query, filters, limit } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      )
    }

    const productSearchService = await createProductSearchService()
    const products = await productSearchService.searchProducts(
      query,
      filters || {},
      limit || 20
    )

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error in product search:", error)
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    )
  }
}
