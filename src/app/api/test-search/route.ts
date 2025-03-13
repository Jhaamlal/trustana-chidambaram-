import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "@/app/infrastructure/repositories/mongodb/product-repository"
import { EmbeddingService } from "@/app/infrastructure/ai/vector-search/embedding-service"
import { MongoDBVectorSearch } from "@/app/infrastructure/ai/vector-search/mongodb-vector-search"

export const runtime = "nodejs"

export async function GET(_: NextRequest) {
  try {
    // Connect to database
    console.log("Connecting to database...")
    const db = await connectToDatabase()
    const productRepository = new ProductRepository(db)
    const embeddingService = new EmbeddingService(db)
    const vectorSearch = new MongoDBVectorSearch(db)

    // 1. Check if vector search index exists
    console.log("Checking vector search index...")
    await vectorSearch.createVectorSearchIndex()

    // 2. Get a sample product to test embedding
    console.log("Getting sample product...")
    const sampleProducts = await productRepository.getRecentlyImportedProducts(
      1
    )

    if (sampleProducts.length === 0) {
      return NextResponse.json(
        { error: "No products found to test" },
        { status: 404 }
      )
    }

    const sampleProduct = sampleProducts[0]
    console.log("Sample product:", {
      id: sampleProduct._id,
      name: sampleProduct.name,
    })

    // 3. Check if the product has an embedding
    console.log("Checking if product has embedding...")
    const hasEmbedding = sampleProduct.description_embedding !== undefined

    // Define the diagnostics object with proper typing
    const diagnostics: {
      productCount: number
      hasVectorData: boolean
      embeddingLength: number | undefined
      openAIKeyConfigured: boolean
      sample: {
        id: string
        name: string
        hasEmbedding: boolean
      }
      embeddingGenerated?: boolean
      generatedEmbeddingLength?: number
      embeddingError?: string
      searchResultCount?: number
      searchQuery?: string
      searchError?: string
    } = {
      productCount: await productRepository.countProducts(),
      hasVectorData: hasEmbedding,
      embeddingLength: hasEmbedding
        ? sampleProduct.description_embedding?.length
        : 0,
      openAIKeyConfigured: !!process.env.OPENAI_API_KEY,
      sample: {
        id: sampleProduct._id,
        name: sampleProduct.name,
        hasEmbedding,
      },
    }

    // 4. If no embedding, generate one as a test
    if (!hasEmbedding) {
      console.log("Product has no embedding, generating one...")
      try {
        // Create a text representation of the product for embedding
        const textForEmbedding = `
          Product: ${sampleProduct.name || ""}
          Brand: ${sampleProduct.brand || ""}
          Barcode: ${sampleProduct.barcode || ""}
          ${
            sampleProduct.attr
              ?.map(
                (a: { k: string; v: any; u?: string }) =>
                  `${a.k}: ${a.v}${a.u ? " " + a.u : ""}`
              )
              .join("\n") || ""
          }
        `.trim()

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(
          textForEmbedding
        )

        // Store embedding in MongoDB
        await vectorSearch.storeProductEmbedding(
          sampleProduct._id.toString(),
          embedding
        )
        diagnostics.embeddingGenerated = true
        diagnostics.generatedEmbeddingLength = embedding.length
      } catch (error: any) {
        diagnostics.embeddingError = error.message
      }
    }

    // 5. Run a test search
    console.log("Running test search...")
    const testQuery = sampleProduct.name
    try {
      const embedding = await embeddingService.generateEmbedding(testQuery)
      const searchResults = await productRepository.searchProductsWithVector(
        embedding,
        {},
        5
      )

      diagnostics.searchResultCount = searchResults.length
      diagnostics.searchQuery = testQuery
    } catch (error: any) {
      diagnostics.searchError = error.message
    }

    return NextResponse.json({
      success: true,
      message: "Vector search diagnostics completed",
      diagnostics,
    })
  } catch (error: any) {
    console.error("Error in test-search:", error)
    return NextResponse.json(
      {
        error: "Error in test-search",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
