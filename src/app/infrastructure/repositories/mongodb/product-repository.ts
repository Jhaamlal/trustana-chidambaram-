import { Db, ObjectId, Document } from "mongodb"
import { Product, ProductFilterOptions } from "@/app/types/product"

export class ProductRepository {
  private db: Db
  private collection = "products"

  constructor(db: Db) {
    this.db = db
  }

  async createProduct(product: Omit<Product, "_id">): Promise<Product> {
    const result = await this.db.collection(this.collection).insertOne(product)
    return {
      ...product,
      _id: result.insertedId.toString(),
    } as Product
  }

  async createManyProducts(
    products: Omit<Product, "_id">[]
  ): Promise<{ insertedCount: number }> {
    const result = await this.db
      .collection(this.collection)
      .insertMany(products)
    return {
      insertedCount: result.insertedCount,
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!ObjectId.isValid(id)) {
      return null
    }
    const product = await this.db
      .collection(this.collection)
      .findOne({ _id: new ObjectId(id) })

    if (!product) return null

    return this.mapToProduct(product)
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const product = await this.db
      .collection(this.collection)
      .findOne({ barcode })

    if (!product) return null

    return this.mapToProduct(product)
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const validIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id))

    if (validIds.length === 0) return []

    const products = await this.db
      .collection(this.collection)
      .find({ _id: { $in: validIds } })
      .toArray()

    return products.map((doc) => this.mapToProduct(doc))
  }

  async listProducts(options: ProductFilterOptions): Promise<Product[]> {
    const { page, limit, sortField, sortOrder, filters } = options
    const skip = (page - 1) * limit

    // Build filter query
    const query: any = {}

    // Process attribute filters
    if (Object.keys(filters).length > 0) {
      const attrConditions: any[] = []

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
          // Handle different types of filters
          if (Array.isArray(value)) {
            // For multiple select attributes
            attrConditions.push({
              attr: {
                $elemMatch: {
                  k: key,
                  v: { $in: value },
                },
              },
            })
          } else if (
            typeof value === "object" &&
            (value.min !== undefined || value.max !== undefined)
          ) {
            // For range filters (numbers)
            const rangeCondition: any = { k: key }
            if (value.min !== undefined) {
              rangeCondition["v"] = {
                ...(rangeCondition["v"] || {}),
                $gte: value.min,
              }
            }
            if (value.max !== undefined) {
              rangeCondition["v"] = {
                ...(rangeCondition["v"] || {}),
                $lte: value.max,
              }
            }

            attrConditions.push({
              attr: {
                $elemMatch: rangeCondition,
              },
            })
          } else {
            // For simple equality filters
            attrConditions.push({
              attr: {
                $elemMatch: {
                  k: key,
                  v: value,
                },
              },
            })
          }
        }
      }

      if (attrConditions.length > 0) {
        query.$and = attrConditions
      }
    }

    // Prepare sort options
    const sortOptions: any = {}

    // Special handling for sorting by attribute
    if (sortField.startsWith("attr.")) {
      // Extract the attribute name from the sort field
      const attrName = sortField.replace("attr.", "")

      // Use the aggregation pipeline for attribute sorting
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            sortValue: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$attr",
                    cond: { $eq: ["$$this.k", attrName] },
                  },
                },
                0,
              ],
            },
          },
        },
        { $sort: { "sortValue.v": sortOrder === "desc" ? -1 : 1 } },
        { $skip: skip },
        { $limit: limit },
      ]

      const results = await this.db
        .collection(this.collection)
        .aggregate(pipeline)
        .toArray()

      return results.map((doc) => this.mapToProduct(doc))
    } else {
      // Standard sorting for built-in fields
      sortOptions[sortField] = sortOrder === "desc" ? -1 : 1

      const results = await this.db
        .collection(this.collection)
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray()

      return results.map((doc) => this.mapToProduct(doc))
    }
  }

  async countProducts(filters: Record<string, any> = {}): Promise<number> {
    // Build filter query similar to listProducts
    const query: any = {}

    if (Object.keys(filters).length > 0) {
      const attrConditions: any[] = []

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            attrConditions.push({
              attr: {
                $elemMatch: {
                  k: key,
                  v: { $in: value },
                },
              },
            })
          } else if (
            typeof value === "object" &&
            (value.min !== undefined || value.max !== undefined)
          ) {
            const rangeCondition: any = { k: key }
            if (value.min !== undefined) {
              rangeCondition["v"] = {
                ...(rangeCondition["v"] || {}),
                $gte: value.min,
              }
            }
            if (value.max !== undefined) {
              rangeCondition["v"] = {
                ...(rangeCondition["v"] || {}),
                $lte: value.max,
              }
            }

            attrConditions.push({
              attr: {
                $elemMatch: rangeCondition,
              },
            })
          } else {
            attrConditions.push({
              attr: {
                $elemMatch: {
                  k: key,
                  v: value,
                },
              },
            })
          }
        }
      }

      if (attrConditions.length > 0) {
        query.$and = attrConditions
      }
    }

    return this.db.collection(this.collection).countDocuments(query)
  }

  async updateProduct(
    id: string,
    update: Partial<Product>
  ): Promise<Product | null> {
    if (!ObjectId.isValid(id)) {
      return null
    }

    const result = await this.db
      .collection(this.collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...update, updatedAt: new Date() } },
        { returnDocument: "after" }
      )

    if (!result) return null

    return this.mapToProduct(result)
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false
    }

    const result = await this.db
      .collection(this.collection)
      .deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }

  async isAttributeInUse(attributeName: string): Promise<boolean> {
    const count = await this.db.collection(this.collection).countDocuments({
      "attr.k": attributeName,
    })

    return count > 0
  }
  async searchProductsWithVector(
    embedding: number[],
    filters: Record<string, any> = {},
    limit: number = 20
  ): Promise<Product[]> {
    // Build filter conditions
    const filterConditions: any[] = []

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          filterConditions.push({
            attr: {
              $elemMatch: {
                k: key,
                v: { $in: value },
              },
            },
          })
        } else if (
          typeof value === "object" &&
          (value.min !== undefined || value.max !== undefined)
        ) {
          const rangeCondition: any = { k: key }
          if (value.min !== undefined) {
            rangeCondition.v = { ...(rangeCondition.v || {}), $gte: value.min }
          }
          if (value.max !== undefined) {
            rangeCondition.v = { ...(rangeCondition.v || {}), $lte: value.max }
          }
          filterConditions.push({
            attr: { $elemMatch: rangeCondition },
          })
        } else {
          filterConditions.push({
            attr: {
              $elemMatch: {
                k: key,
                v: value,
              },
            },
          })
        }
      }
    }

    // Create vector search pipeline
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "product_vector_index",
          path: "description_embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: limit * 2, // Request more candidates to allow for filtering
        },
      },
    ]

    // Add filter if conditions exist
    if (filterConditions.length > 0) {
      pipeline.push({
        $match: { $and: filterConditions },
      })
    }

    // Add projection and limit
    pipeline.push(
      {
        $project: {
          _id: 1,
          name: 1,
          brand: 1,
          barcode: 1,
          images: 1,
          attr: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
      { $limit: limit }
    )

    try {
      const results = await this.db
        .collection(this.collection)
        .aggregate(pipeline)
        .toArray()

      return results.map((doc) => this.mapToProduct(doc))
    } catch (error) {
      console.error("Vector search error:", error)
      // Fallback to regular search
      return this.listProducts({
        page: 1,
        limit,
        sortField: "name",
        sortOrder: "asc",
        filters,
      })
    }
  }

  async getRecentlyImportedProducts(limit: number): Promise<Product[]> {
    return (await this.db
      .collection(this.collection)
      .find({})
      .sort({ importedAt: -1 })
      .limit(limit)
      .toArray()) as unknown as Product[]
  }

  // Helper method to convert MongoDB document to Product type
  private mapToProduct(doc: Document): Product {
    // Handle both WithId<Document> and regular Document
    const id = doc._id
      ? typeof doc._id === "string"
        ? doc._id
        : doc._id.toString()
      : ""

    return {
      _id: id,
      name: doc.name as string,
      brand: doc.brand as string,
      barcode: doc.barcode as string | undefined,
      images: doc.images as string[],
      importedAt: doc.importedAt as Date,
      enriched: doc.enriched as boolean,
      enrichedAt: doc.enrichedAt as Date | undefined,
      attr: doc.attr as Product["attr"],
      description_embedding: doc.description_embedding as number[] | undefined,
    }
  }
}

// src/app/repositories/product-repository.ts
