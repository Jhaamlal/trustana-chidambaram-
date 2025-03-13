import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import {
  AttributeRepository,
  createAttributeRepository,
} from "@/app/infrastructure/repositories/mongodb/attribute-repository"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

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
  console.log(`API: Received DELETE request for attribute ID: ${params.id}`)

  try {
    if (!params.id || !ObjectId.isValid(params.id)) {
      console.log(`API: Invalid attribute ID format: ${params.id}`)
      return NextResponse.json(
        { error: "Invalid attribute ID format" },
        { status: 400 }
      )
    }

    console.log(`API: Creating attribute repository`)
    const attributeRepository = await createAttributeRepository()

    console.log(`API: Calling deleteAttribute for ID: ${params.id}`)
    await attributeRepository.deleteAttribute(params.id)

    console.log(`API: Successfully deleted attribute ID: ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error"
    console.error(`API: Error deleting attribute: ${errorMessage}`, error)

    return NextResponse.json(
      {
        error: "Failed to delete attribute",
        message: errorMessage,
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
