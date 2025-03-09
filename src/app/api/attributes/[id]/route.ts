import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { AttributeRepository } from "@/app/infrastructure/repositories/mongodb/attribute-repository"
import { ObjectId } from "mongodb"

export const runtime = "edge"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid attribute ID" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const attributeRepository = new AttributeRepository(client)

    const attribute = await attributeRepository.getAttributeById(id)

    if (!attribute) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(attribute)
  } catch (error: any) {
    console.error("Error fetching attribute:", error)
    return NextResponse.json(
      { error: "Failed to fetch attribute", message: error.message },
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
      return NextResponse.json(
        { error: "Invalid attribute ID" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const attributeRepository = new AttributeRepository(client)

    // Check if attribute exists
    const existingAttribute = await attributeRepository.getAttributeById(id)
    if (!existingAttribute) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      )
    }

    // Update attribute
    const updatedAttribute = await attributeRepository.updateAttribute(id, {
      ...data,
      updatedAt: new Date(),
    })

    return NextResponse.json(updatedAttribute)
  } catch (error: any) {
    console.error("Error updating attribute:", error)
    return NextResponse.json(
      { error: "Failed to update attribute", message: error.message },
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
      return NextResponse.json(
        { error: "Invalid attribute ID" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const attributeRepository = new AttributeRepository(client)
    const productRepository = await import(
      "@/app/infrastructure/repositories/mongodb/product-repository"
    ).then((module) => new module.ProductRepository(client))

    // Check if attribute is being used by any products
    const isAttributeInUse = await productRepository.isAttributeInUse(id)
    if (isAttributeInUse) {
      return NextResponse.json(
        { error: "Cannot delete attribute that is in use by products" },
        { status: 409 }
      )
    }

    // Delete attribute
    await attributeRepository.deleteAttribute(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting attribute:", error)
    return NextResponse.json(
      { error: "Failed to delete attribute", message: error.message },
      { status: 500 }
    )
  }
}
