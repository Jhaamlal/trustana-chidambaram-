import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "@/app/infrastructure/repositories/mongodb/product-repository"
import { processCSVFile } from "@/app/lib/file-processors/csv-processor"
import { processExcelFile } from "@/app/lib/file-processors/excel-processor"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileType } = await request.json()

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      )
    }

    // Process the file based on its type
    let products
    if (fileType === "csv") {
      products = await processCSVFile(fileUrl)
    } else if (fileType === "excel" || fileType === "xlsx") {
      products = await processExcelFile(fileUrl)
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      )
    }

    // Validate the processed data
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "No valid products found in the file" },
        { status: 400 }
      )
    }

    // Connect to database and save products
    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)

    // Add import metadata to each product
    const productsWithMetadata = products.map((product) => ({
      ...product,
      importedAt: new Date(),
      enriched: false,
      attr: product.attr || [],
    }))

    // Save products to database
    const result = await productRepository.createManyProducts(
      productsWithMetadata
    )

    return NextResponse.json({
      success: true,
      imported: result.insertedCount,
      total: products.length,
    })
  } catch (error: any) {
    console.error("Error processing import file:", error)
    return NextResponse.json(
      { error: "Failed to process import file", message: error.message },
      { status: 500 }
    )
  }
}
