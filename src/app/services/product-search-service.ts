import { Product } from "@/app/types/product"

import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "../infrastructure/repositories/mongodb/product-repository"
import { EmbeddingService } from "../infrastructure/ai/vector-search/embedding-service"

export class ProductSearchService {
  private productRepository: ProductRepository
  private embeddingService: EmbeddingService

  constructor(
    productRepository: ProductRepository,
    embeddingService: EmbeddingService
  ) {
    this.productRepository = productRepository
    this.embeddingService = embeddingService
  }

  async searchProducts(
    query: string,
    filters: Record<string, any> = {},
    limit: number = 20
  ): Promise<Product[]> {
    try {
      // Generate embedding for the search query
      const embedding = await this.embeddingService.generateEmbedding(query)

      // Search products using vector search with filters
      return await this.productRepository.searchProductsWithVector(
        embedding,
        filters,
        limit
      )
    } catch (error) {
      console.error("Error searching products:", error)
      // Fallback to regular filtering if vector search fails
      return await this.productRepository.listProducts({
        page: 1,
        limit,
        sortField: "name",
        sortOrder: "asc",
        filters,
      })
    }
  }
}

export async function createProductSearchService() {
  const db = await connectToDatabase()
  const productRepository = new ProductRepository(db)
  const embeddingService = new EmbeddingService(db)

  return new ProductSearchService(productRepository, embeddingService)
}
