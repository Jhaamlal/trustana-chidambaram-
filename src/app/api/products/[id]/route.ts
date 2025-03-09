import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "@/app/infrastructure/repositories/mongodb/product-repository"
import { ObjectId } from "mongodb"

export const runtime = "edge"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)

    const product = await productRepository.getProductById(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product", message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)

    // Check if product exists
    const existingProduct = await productRepository.getProductById(id)
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Update product
    const updatedProduct = await productRepository.updateProduct(id, {
      ...data,
      updatedAt: new Date(),
    })

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product", message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)

    // Delete product
    await productRepository.deleteProduct(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product", message: error.message },
      { status: 500 }
    )
  }
}
