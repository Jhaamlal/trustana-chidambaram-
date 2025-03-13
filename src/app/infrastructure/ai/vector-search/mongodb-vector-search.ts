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
    limit: number = 10
  ): Promise<Product[]> {
    try {
      // Use MongoDB Atlas Vector Search
      const pipeline = [
        {
          $vectorSearch: {
            index: "product_vector_index",
            path: "description_embedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: limit,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            brand: 1,
            barcode: 1,
            attr: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]

      console.log("Executing vector search pipeline")
      const results = await this.db
        .collection(this.collection)
        .aggregate(pipeline)
        .toArray()

      console.log(`Vector search found ${results.length} results`)
      return results as unknown as Product[]
    } catch (error) {
      // Fallback to regular search if vector search is not available
      console.error(
        "Vector search error, falling back to regular search:",
        error
      )

      const products = await this.db
        .collection(this.collection)
        .find({})
        .limit(limit)
        .toArray()

      return products as unknown as Product[]
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
            description_embedding: embedding,
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
        (index) => index.name === "product_vector_index"
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
                name: "product_vector_index",
                key: {
                  description_embedding: "vector",
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
