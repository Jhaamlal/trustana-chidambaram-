import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ProductRepository } from "@/infrastructure/repositories/mongodb/product-repository"
import { AttributeRepository } from "@/infrastructure/repositories/mongodb/attribute-repository"
import { EnrichmentService } from "@/infrastructure/ai/enrichment-service"
import { ObjectId } from "mongodb"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const { productIds, attributeIds } = await request.json()

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs are required" },
        { status: 400 }
      )
    }

    // Validate product IDs
    if (productIds.some((id) => !ObjectId.isValid(id))) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const productRepository = new ProductRepository(client)
    const attributeRepository = new AttributeRepository(client)

    // Get attributes to enrich
    let attributesToEnrich
    if (attributeIds && attributeIds.length > 0) {
      attributesToEnrich = await attributeRepository.getAttributesByIds(
        attributeIds
      )
    } else {
      attributesToEnrich = await attributeRepository.listAllAttributes()
    }

    if (!attributesToEnrich || attributesToEnrich.length === 0) {
      return NextResponse.json(
        { error: "No attributes found for enrichment" },
        { status: 400 }
      )
    }

    // Get products to enrich
    const products = await productRepository.getProductsByIds(productIds)

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found with the provided IDs" },
        { status: 404 }
      )
    }

    // Initialize enrichment service
    const enrichmentService = new EnrichmentService(client)

    // Start enrichment process
    const enrichmentJobId = await enrichmentService.startEnrichmentJob(
      products,
      attributesToEnrich
    )

    return NextResponse.json({
      success: true,
      jobId: enrichmentJobId,
      message: `Enrichment started for ${products.length} products`,
    })
  } catch (error: any) {
    console.error("Error starting enrichment:", error)
    return NextResponse.json(
      { error: "Failed to start enrichment process", message: error.message },
      { status: 500 }
    )
  }
}
