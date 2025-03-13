import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "@/app/infrastructure/repositories/mongodb/product-repository"
import { AttributeRepository } from "@/app/infrastructure/repositories/mongodb/attribute-repository"
import { EnrichmentService } from "@/app/infrastructure/ai/enrichment-service"
import { ObjectId } from "mongodb"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()

    // Accept both plural and singular versions
    const productIds = requestBody.productIds || []
    const productId = requestBody.productId

    console.log("==== STARTING ENRICHMENT PROCESS ====")

    // Handle both singular and plural cases
    if (!productId && (!productIds || productIds.length === 0)) {
      console.error("No product ID provided")
      return NextResponse.json(
        { error: "No product ID provided" },
        { status: 400 }
      )
    }

    // Get DB connection
    const db = await connectToDatabase()
    console.log("Connected to database successfully")

    // Create repositories
    const productRepository = new ProductRepository(db)
    const attributeRepository = new AttributeRepository(db)
    const enrichmentService = new EnrichmentService(db)

    // Get all available attributes from the database
    const allAttributes = await attributeRepository.listAllAttributes()
    console.log(`Loaded ${allAttributes.length} attribute definitions`)

    // Process single product case
    if (productId) {
      console.log(`Request to enrich single product with ID: ${productId}`)

      if (!ObjectId.isValid(productId)) {
        console.error(`Invalid product ID format: ${productId}`)
        return NextResponse.json(
          { error: "Invalid product ID format" },
          { status: 400 }
        )
      }

      // Get the product
      console.log(`Attempting to fetch product with ID: ${productId}`)
      const product = await productRepository.getProductById(productId)

      if (!product) {
        console.error(`Product not found in database: ${productId}`)
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        )
      }

      console.log(`Found product: ${product.name} (${product._id})`)

      // Start enrichment job
      console.log(`Starting enrichment job for product: ${product.name}`)
      const jobId = await enrichmentService.startEnrichmentJob(
        [product],
        allAttributes
      )

      console.log(`Started enrichment job ${jobId}`)
      console.log("==== ENRICHMENT PROCESS STARTED ====")

      return NextResponse.json({
        success: true,
        jobId,
        message: "Enrichment process started successfully",
      })
    }
    // Process multiple products case
    else {
      console.log(`Request to enrich ${productIds.length} products`)

      // Validate product IDs
      const validProductIds = productIds.filter((id: string) =>
        ObjectId.isValid(id)
      )

      if (validProductIds.length === 0) {
        console.error("No valid product IDs provided")
        return NextResponse.json(
          { error: "No valid product IDs provided" },
          { status: 400 }
        )
      }

      // Get products
      const products = await productRepository.getProductsByIds(validProductIds)

      if (!products || products.length === 0) {
        console.error("No products found with the provided IDs")
        return NextResponse.json(
          { error: "No products found with the provided IDs" },
          { status: 404 }
        )
      }

      console.log(`Found ${products.length} products to enrich`)

      // Start enrichment job
      const jobId = await enrichmentService.startEnrichmentJob(
        products,
        allAttributes
      )

      console.log(`Started enrichment job ${jobId}`)
      console.log("==== ENRICHMENT PROCESS STARTED ====")

      return NextResponse.json({
        success: true,
        jobId,
        message: `Enrichment process started successfully for ${products.length} products`,
      })
    }
  } catch (error: any) {
    console.error("Error starting enrichment:", error)
    return NextResponse.json(
      {
        error: "Failed to start enrichment process",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
