import { Db } from "mongodb"
import { Product } from "@/app/types/product"
import { Attribute } from "@/app/types/attribute"
// import { EnrichmentResult } from "@/app/types/enrichment"
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

  constructor(db: Db) {
    this.db = db
    this.productRepository = new ProductRepository(db)
    this.enrichmentRepository = new EnrichmentRepository(db)
    this.vectorSearch = new MongoDBVectorSearch(db)
    this.embeddingService = new EmbeddingService()
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

      // Process each product
      let processedCount = 0

      for (const product of products) {
        try {
          // Enrich the product
          const enrichedAttributes = await this.enrichProduct(
            product,
            attributesToEnrich
          )

          // Update the product with enriched attributes
          await this.productRepository.updateProduct(product._id, {
            attr: enrichedAttributes,
            enriched: true,
            enrichedAt: new Date(),
          })

          // Save enrichment result
          await this.enrichmentRepository.saveEnrichmentResult(jobId, {
            productId: product._id,
            enrichedAttributes: enrichedAttributes.map((attr) => attr.k),
            success: true,
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

      // Update job status to completed
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

    // Generate attribute values using RAG
    const generatedAttributes = await this.ragChain.run({
      product,
      similarProducts,
      attributesToEnrich,
    })

    // Calculate confidence scores for each attribute
    const enrichedAttributes = generatedAttributes.map((attr) => {
      const attributeDef = attributesToEnrich.find((a) => a.name === attr.k)
      if (!attributeDef) return attr

      // Calculate format validity
      const formatValidity = validateFormat(attributeDef.type, attr.v)

      // Calculate confidence score
      const confidenceScore = calculateConfidence(attributeDef.type, attr.v, {
        contextual_match: attr.confidence || 0.7,
        format_validity: formatValidity,
        source_reliability: 0.8,
        llm_confidence: attr.confidence || 0.7,
      })

      return {
        ...attr,
        confidence: confidenceScore,
      }
    })

    // Combine with existing attributes
    const existingAttributes = product.attr || []
    // const existingKeys = existingAttributes.map((attr) => attr.k)

    const combinedAttributes = [
      ...existingAttributes.filter(
        (attr) => !enrichedAttributes.some((ea) => ea.k === attr.k)
      ),
      ...enrichedAttributes,
    ]

    return combinedAttributes
  }
}
