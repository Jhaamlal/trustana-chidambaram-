import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "@/app/infrastructure/repositories/mongodb/product-repository"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sortField = searchParams.get("sortField") || "name"
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc"
    const filters = searchParams.get("filters")
      ? JSON.parse(searchParams.get("filters") || "{}")
      : {}

    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)

    const products = await productRepository.listProducts({
      page,
      limit,
      sortField,
      sortOrder,
      filters,
    })

    const total = await productRepository.countProducts(filters)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate product data
    if (!data.name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)

    // Check if product with same barcode already exists
    if (data.barcode) {
      const existingProduct = await productRepository.getProductByBarcode(
        data.barcode
      )
      if (existingProduct) {
        return NextResponse.json(
          { error: "Product with this barcode already exists" },
          { status: 409 }
        )
      }
    }

    // Create product
    const product = await productRepository.createProduct({
      ...data,
      importedAt: new Date(),
      enriched: false,
      attr: data.attr || [],
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product", message: error.message },
      { status: 500 }
    )
  }
}
