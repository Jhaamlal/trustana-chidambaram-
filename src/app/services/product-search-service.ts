import { Product } from "@/app/types/product"

import { connectToDatabase } from "@/app/lib/mongodb"
import { ProductRepository } from "../infrastructure/repositories/mongodb/product-repository"
import { EmbeddingService } from "../infrastructure/ai/vector-search/embedding-service"
import { MongoDBVectorSearch } from "../infrastructure/ai/vector-search/mongodb-vector-search"

export class ProductSearchService {
  private productRepository: ProductRepository
  private embeddingService: EmbeddingService
  private vectorSearch: MongoDBVectorSearch

  constructor(
    productRepository: ProductRepository,
    embeddingService: EmbeddingService,
    vectorSearch: MongoDBVectorSearch
  ) {
    this.productRepository = productRepository
    this.embeddingService = embeddingService
    this.vectorSearch = vectorSearch
  }

  async searchProducts(
    query: string,
    filters: Record<string, any> = {},
    limit: number = 20
  ): Promise<Product[]> {
    try {
      console.log(`Searching for "${query}" with filters:`, filters)

      // Ensure vector search index exists
      await this.vectorSearch.createVectorSearchIndex()

      // Generate embedding for the search query
      const embedding = await this.embeddingService.generateEmbedding(query)

      console.log(
        `Generated embedding with ${embedding.length} dimensions, using vector search`
      )

      // Search products using vector search with filters
      return await this.productRepository.searchProductsWithVector(
        embedding,
        filters,
        limit
      )
    } catch (error) {
      console.error("Error searching products:", error)
      console.log("Falling back to regular search without vectors")

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
  const vectorSearch = new MongoDBVectorSearch(db)

  return new ProductSearchService(
    productRepository,
    embeddingService,
    vectorSearch
  )
}
