import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "@/app/infrastructure/repositories/mongodb/product-repository"
import { processCSVFile } from "@/app/lib/file-processors/csv-processor"
import { processExcelFile } from "@/app/lib/file-processors/excel-processor"
import { createEmbeddingService } from "@/app/infrastructure/ai/vector-search/embedding-service"
import { MongoDBVectorSearch } from "@/app/infrastructure/ai/vector-search/mongodb-vector-search"
import { Product } from "@/app/types"

export const runtime = "nodejs"

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

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "No valid products found in the file" },
        { status: 400 }
      )
    }

    // Connect to database
    const db = await connectToDatabase()
    const productRepository = new ProductRepository(db)

    // Initialize embedding service and vector search
    const embeddingService = createEmbeddingService(db)
    const vectorSearch = new MongoDBVectorSearch(db)

    // Ensure vector search index exists
    await vectorSearch.createVectorSearchIndex()

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

    // Generate embeddings for each product in the background
    // Get the inserted product IDs if available
    const savedProducts = await productRepository.getRecentlyImportedProducts(
      products.length
    )

    if (savedProducts.length > 0) {
      // Process embeddings after sending response
      Promise.all(
        savedProducts.map(async (product: Product) => {
          // Create a text representation of the product for embedding
          const textForEmbedding = `
            Product: ${product.name || ""}
            Brand: ${product.brand || ""}
            Barcode: ${product.barcode || ""}
            ${
              product.attr
                ?.map(
                  (a: { k: string; v: any; u?: string }) =>
                    `${a.k}: ${a.v}${a.u ? " " + a.u : ""}`
                )
                .join("\n") || ""
            }
          `.trim()

          try {
            // Generate embedding
            const embedding = await embeddingService.generateEmbedding(
              textForEmbedding
            )
            // Store embedding in MongoDB
            await vectorSearch.storeProductEmbedding(
              product._id.toString(),
              embedding
            )
            console.log(`Added embedding for product ${product._id}`)
          } catch (error) {
            console.error(
              `Failed to generate embedding for product ${product._id}:`,
              error
            )
          }
        })
      ).catch((error) => {
        console.error("Error processing embeddings:", error)
      })
    }

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
