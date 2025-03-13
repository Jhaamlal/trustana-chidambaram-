import { Product } from "@/app/types"
import { Db, ObjectId } from "mongodb"

export class MongoDBVectorSearch {
  private db: Db
  private collection = "products"

  constructor(db: Db) {
    this.db = db
  }

  async findSimilarProducts(
    embedding: number[],
    limit = 10
  ): Promise<Product[]> {
    try {
      if (!embedding || embedding.length === 0) {
        console.error("Invalid embedding provided for vector search")
        return this.findSimilarProductsAlternative(limit)
      }

      console.log(
        `Performing vector search with embedding of dimension ${embedding.length}`
      )

      // Check if the vectorSearchIndex exists before attempting to use it
      const indexExists = await this.checkVectorIndexExists()
      if (!indexExists) {
        console.warn(
          "Vector search index not found, falling back to alternative search"
        )
        return this.findSimilarProductsAlternative(limit)
      }

      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: limit * 10, // Request more candidates to improve quality
            limit: limit,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            brand: 1,
            category: 1,
            attributes: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]

      const result = await this.db
        .collection(this.collection)
        .aggregate(pipeline)
        .toArray()

      if (!result || result.length === 0) {
        console.warn(
          "Vector search returned no results, falling back to alternative search"
        )
        return this.findSimilarProductsAlternative(limit)
      }

      console.log(`Found ${result.length} similar products using vector search`)
      return result as unknown as Product[]
    } catch (error) {
      console.error("Vector search error:", error)
      console.log("Falling back to alternative search method")
      return this.findSimilarProductsAlternative(limit)
    }
  }

  // Add a helper method to check if the vector index exists
  private async checkVectorIndexExists(): Promise<boolean> {
    try {
      const indexes = await this.db
        .collection(this.collection)
        .listIndexes()
        .toArray()
      return indexes.some((index) => index.name === "vector_index")
    } catch (error) {
      console.error("Error checking vector index:", error)
      return false
    }
  }

  // Fallback method to find similar products when vector search is unavailable
  private async findSimilarProductsAlternative(
    limit: number
  ): Promise<Product[]> {
    console.log("Using alternative product search methods")

    try {
      // Extract product information from the embedding query (likely comes from product name/brand)
      // First, try to find products with similar brands if we have that in our database
      const productsWithBrand = await this.db
        .collection(this.collection)
        .find({
          attr: { $exists: true, $not: { $size: 0 } },
        })
        .limit(limit)
        .toArray()

      if (productsWithBrand.length > 0) {
        console.log(
          `Found ${productsWithBrand.length} products with attributes`
        )
        return productsWithBrand as unknown as Product[]
      }

      // If no products with attributes found, get any products that at least have some attributes
      const productsWithAttributes = await this.db
        .collection(this.collection)
        .find({
          "attr.0": { $exists: true },
        })
        .limit(limit)
        .toArray()

      if (productsWithAttributes.length > 0) {
        console.log(
          `Found ${productsWithAttributes.length} products with at least one attribute`
        )
        return productsWithAttributes as unknown as Product[]
      }

      // Last resort: just get any products available
      console.log(
        "No products with attributes found, returning any available products"
      )
      const products = await this.db
        .collection(this.collection)
        .find({})
        .limit(limit)
        .toArray()

      return products as unknown as Product[]
    } catch (fallbackError) {
      console.error("Even fallback search failed:", fallbackError)
      return [] // Return empty array if all searches fail
    }
  }

  async storeProductEmbedding(
    productId: string,
    embedding: number[]
  ): Promise<void> {
    console.log(
      `Storing embedding for product ${productId}, dimensions: ${embedding.length}`
    )

    try {
      await this.db.collection(this.collection).updateOne(
        { _id: new ObjectId(productId) },
        {
          $set: {
            embedding: embedding,
            vector_updated_at: new Date(),
          },
        }
      )
      console.log(`Successfully stored embedding for product ${productId}`)
    } catch (error) {
      console.error(`Error storing embedding for product ${productId}:`, error)
      throw error
    }
  }

  async createVectorSearchIndex(): Promise<void> {
    try {
      // Check if index exists
      const indexes = await this.db.collection(this.collection).indexes()
      const hasVectorIndex = indexes.some(
        (index) => index.name === "vector_index"
      )

      if (!hasVectorIndex) {
        console.log("Vector search index not found, attempting to create it...")

        try {
          // Attempt to create vector search index using MongoDB command
          // Note: This will only work for self-hosted MongoDB with vector search capabilities
          // For MongoDB Atlas, the index must be created in the Atlas UI
          await this.db.command({
            createIndexes: this.collection,
            indexes: [
              {
                name: "vector_index",
                key: {
                  embedding: "vector",
                },
                vectorOptions: {
                  type: "cosine",
                  dimensions: 1536, // OpenAI embedding dimensions
                  similarity: "cosine",
                },
              },
            ],
          })

          console.log("Vector search index created successfully")
        } catch (indexError) {
          console.warn(
            "Could not create vector index programmatically:",
            indexError
          )
          console.warn(
            "If using MongoDB Atlas, please create the vector search index manually in the Atlas UI"
          )
        }
      } else {
        console.log("Vector search index already exists")
      }
    } catch (error) {
      console.error("Error checking/creating vector search index:", error)
    }
  }
}
