import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { AttributeRepository } from "@/app/infrastructure/repositories/mongodb/attribute-repository"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const client = await connectToDatabase()
    const attributeRepository = new AttributeRepository(client)

    const attributes = await attributeRepository.listAttributes(page, limit)
    const total = await attributeRepository.countAttributes()

    return NextResponse.json({
      attributes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching attributes:", error)
    return NextResponse.json(
      { error: "Failed to fetch attributes", message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate attribute data
    if (!data.name || !data.displayName || !data.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const attributeRepository = new AttributeRepository(client)

    // Check if attribute with same name already exists
    const existingAttribute = await attributeRepository.getAttributeByName(
      data.name
    )
    if (existingAttribute) {
      return NextResponse.json(
        { error: "Attribute with this name already exists" },
        { status: 409 }
      )
    }

    // Create new attribute
    const attribute = await attributeRepository.createAttribute({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(attribute, { status: 201 })
  } catch (error: any) {
    console.error("Error creating attribute:", error)
    return NextResponse.json(
      { error: "Failed to create attribute", message: error.message },
      { status: 500 }
    )
  }
}
