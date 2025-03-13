import { Db } from "mongodb"
import { Product } from "@/app/types/product"
import { Attribute } from "@/app/types/attribute"
import { ProductRepository } from "../repositories/mongodb/product-repository"
import { EnrichmentRepository } from "../repositories/mongodb/enrichment-repository"

import {
  calculateConfidence,
  validateFormat,
} from "@/app/lib/ai/confidence-calculator"
import { RAGChain } from "./langchain/chains/rag-chain"
import { EmbeddingService } from "./vector-search/embedding-service"
import { MongoDBVectorSearch } from "./vector-search/mongodb-vector-search"

export class EnrichmentService {
  private db: Db
  private productRepository: ProductRepository
  private enrichmentRepository: EnrichmentRepository
  private vectorSearch: MongoDBVectorSearch
  private embeddingService: EmbeddingService
  private ragChain: RAGChain
  // Minimum confidence threshold for including attributes - lowered for more lenient filtering
  private minConfidenceThreshold = 0.15

  constructor(db: Db) {
    this.db = db
    this.productRepository = new ProductRepository(db)
    this.enrichmentRepository = new EnrichmentRepository(db)
    this.vectorSearch = new MongoDBVectorSearch(db)
    this.embeddingService = new EmbeddingService(db)
    this.ragChain = new RAGChain()
  }

  async startEnrichmentJob(
    products: Product[],
    attributesToEnrich: Attribute[]
  ): Promise<string> {
    // Create a new enrichment job
    const productIds = products.map((p) => p._id)
    const attributeIds = attributesToEnrich.map((a) => a._id)

    const jobId = await this.enrichmentRepository.createEnrichmentJob(
      productIds,
      attributeIds
    )

    // Start the enrichment process asynchronously
    this.processEnrichmentJob(jobId, products, attributesToEnrich).catch(
      (error) => {
        console.error("Error in enrichment job:", error)
        this.enrichmentRepository.updateEnrichmentJobStatus(jobId, {
          status: "failed",
          error: error.message,
        })
      }
    )

    return jobId
  }

  async getJobStatus(jobId: string) {
    return this.enrichmentRepository.getEnrichmentJobStatus(jobId)
  }

  private async processEnrichmentJob(
    jobId: string,
    products: Product[],
    attributesToEnrich: Attribute[]
  ) {
    try {
      // Update job status to processing
      await this.enrichmentRepository.updateEnrichmentJobStatus(jobId, {
        status: "processing",
        progress: 0,
      })

      // Log the start of the enrichment process
      console.log(
        `Starting enrichment job ${jobId} for ${products.length} products with ${attributesToEnrich.length} attributes`
      )
      console.log(
        `Attributes to enrich: ${attributesToEnrich
          .map((a) => a.name)
          .join(", ")}`
      )

      // Process each product
      let processedCount = 0
      let successCount = 0
      let skippedCount = 0

      for (const product of products) {
        try {
          console.log(`Processing product: ${product.name} (${product._id})`)

          // Check if product already has all the attributes
          const existingAttrs = product.attr || []
          const existingAttrNames = existingAttrs.map((attr) => attr.k)
          const attributesToEnrichForProduct = attributesToEnrich.filter(
            (attr) => !existingAttrNames.includes(attr.name)
          )

          if (attributesToEnrichForProduct.length === 0) {
            console.log(
              `Skipping product ${product._id}: All attributes already exist`
            )
            skippedCount++
            processedCount++
            continue
          }

          // Enrich the product
          const enrichedAttributes = await this.enrichProduct(
            product,
            attributesToEnrichForProduct
          )

          // Filter out low-confidence attributes
          const filteredAttributes = enrichedAttributes.filter(
            (attr) => (attr.confidence || 0) >= this.minConfidenceThreshold
          )

          console.log(
            `Enriched ${filteredAttributes.length} attributes for product ${product._id} (filtered from ${enrichedAttributes.length})`
          )

          // Update the product with enriched attributes
          if (filteredAttributes.length > 0) {
            await this.productRepository.updateProduct(product._id, {
              attr: [...existingAttrs, ...filteredAttributes],
              enriched: true,
              enrichedAt: new Date(),
            })
            successCount++
          } else {
            console.log(
              `No attributes with sufficient confidence for product ${product._id}`
            )
          }

          // Save enrichment result
          await this.enrichmentRepository.saveEnrichmentResult(jobId, {
            productId: product._id,
            enrichedAttributes: filteredAttributes.map((attr) => attr.k),
            success: filteredAttributes.length > 0,
          })

          // Update job progress
          processedCount++
          const progress = Math.round((processedCount / products.length) * 100)

          await this.enrichmentRepository.updateEnrichmentJobStatus(jobId, {
            progress,
            productsProcessed: processedCount,
          })
        } catch (error: any) {
          console.error(`Error enriching product ${product._id}:`, error)

          // Save failed enrichment result
          await this.enrichmentRepository.saveEnrichmentResult(jobId, {
            productId: product._id,
            enrichedAttributes: [],
            success: false,
            error: error.message,
          })

          // Continue with next product
          processedCount++
          const progress = Math.round((processedCount / products.length) * 100)

          await this.enrichmentRepository.updateEnrichmentJobStatus(jobId, {
            progress,
            productsProcessed: processedCount,
          })
        }
      }

      // Update job status to completed with progress information
      const completionMessage = `Successfully enriched ${successCount} products, skipped ${skippedCount} products that already had attributes`
      console.log(`Enrichment job ${jobId} completed. ${completionMessage}`)

      await this.enrichmentRepository.updateEnrichmentJobStatus(jobId, {
        status: "completed",
        progress: 100,
        productsProcessed: products.length,
        completedAt: new Date(),
      })
    } catch (error: any) {
      console.error("Error processing enrichment job:", error)

      // Update job status to failed
      await this.enrichmentRepository.updateEnrichmentJobStatus(jobId, {
        status: "failed",
        error: error.message,
      })
    }
  }

  private async enrichProduct(
    product: Product,
    attributesToEnrich: Attribute[]
  ) {
    // Generate embedding for the product
    const productText = `${product.name} ${product.brand} ${
      product.barcode || ""
    }`
    const embedding = await this.embeddingService.generateEmbedding(productText)

    // Find similar products using vector search
    const similarProducts = await this.vectorSearch.findSimilarProducts(
      embedding
    )

    console.log(
      `Found ${similarProducts.length} similar products for ${product.name}`
    )

    // Generate attribute values using RAG
    const generatedAttributes = await this.ragChain.run({
      product,
      similarProducts,
      attributesToEnrich,
    })

    console.log(`RAG chain generated ${generatedAttributes.length} attributes`)

    // Calculate confidence scores for each attribute
    const enrichedAttributes = generatedAttributes.map((attr) => {
      const attributeDef = attributesToEnrich.find((a) => a.name === attr.k)
      if (!attributeDef) return attr

      // Calculate format validity
      const formatValidity = validateFormat(attributeDef.type, attr.v)

      // Adjust source reliability based on available similar products
      // Be more lenient when similar products are scarce
      let sourceReliability = 0.8 // default
      if (similarProducts.length === 0) {
        sourceReliability = 0.5 // Increased from 0.4
      } else if (similarProducts.length < 3) {
        sourceReliability = 0.65 // Increased from 0.6
      }

      // Use the LLM-provided confidence directly if it's available and reasonable
      const llmConfidence = attr.confidence
        ? Math.max(0.3, attr.confidence)
        : 0.7

      // Calculate confidence score
      const confidenceScore = calculateConfidence(attributeDef.type, attr.v, {
        contextual_match: Math.max(0.5, attr.confidence || 0.7), // Ensure minimum contextual match
        format_validity: formatValidity,
        source_reliability: sourceReliability,
        llm_confidence: llmConfidence,
      })

      return {
        ...attr,
        confidence: confidenceScore,
      }
    })

    // For debugging purposes, log the confidence scores
    console.log("Enriched attributes with confidence scores:")
    enrichedAttributes.forEach((attr) => {
      console.log(`  ${attr.k}: ${attr.confidence?.toFixed(2)}`)
    })

    // Return only the enriched attributes (existing ones are handled in processEnrichmentJob)
    return enrichedAttributes
  }
}
