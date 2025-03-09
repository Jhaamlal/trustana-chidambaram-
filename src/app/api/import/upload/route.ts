import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate a unique filename to prevent collisions
    const uniqueFilename = `${nanoid()}-${file.name}`

    // Upload the file directly to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
      contentType: file.type,
    })

    return NextResponse.json({
      blobUrl: blob.url,
      success: true,
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file", message: error.message },
      { status: 500 }
    )
  }
}
