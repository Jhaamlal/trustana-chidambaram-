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

      const results = await this.db
        .collection(this.collection)
        .aggregate(pipeline)
        .toArray()

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
    await this.db.collection(this.collection).updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          description_embedding: embedding,
          vector_updated_at: new Date(),
        },
      }
    )
  }

  async createVectorSearchIndex(): Promise<void> {
    try {
      // Check if index exists
      const indexes = await this.db.collection(this.collection).indexes()
      const hasVectorIndex = indexes.some(
        (index) => index.name === "product_vector_index"
      )

      if (!hasVectorIndex) {
        // Create vector search index
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
      }
    } catch (error) {
      console.error("Error creating vector search index:", error)
    }
  }
}
