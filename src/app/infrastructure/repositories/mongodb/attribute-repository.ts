import { Db, ObjectId, Document, WithId } from "mongodb"
import { Attribute } from "@/app/types/attribute"
import { ProductRepository } from "./product-repository"
import { connectToDatabase } from "@/app/lib/mongodb"

export class AttributeRepository {
  private db: Db
  private collection = "attributes_definition"

  constructor(db: Db) {
    this.db = db
  }

  async createAttribute(attribute: Omit<Attribute, "_id">): Promise<Attribute> {
    const result = await this.db
      .collection(this.collection)
      .insertOne(attribute)
    return {
      ...attribute,
      _id: result.insertedId.toString(),
    } as Attribute
  }

  async getAttributeById(id: string): Promise<Attribute | null> {
    if (!ObjectId.isValid(id)) {
      return null
    }
    const attribute = await this.db
      .collection(this.collection)
      .findOne({ _id: new ObjectId(id) })

    if (!attribute) return null

    return this.mapToAttribute(attribute)
  }

  async getAttributeByName(name: string): Promise<Attribute | null> {
    const attribute = await this.db
      .collection(this.collection)
      .findOne({ name })

    if (!attribute) return null

    return this.mapToAttribute(attribute)
  }

  async getAttributesByIds(ids: string[]): Promise<Attribute[]> {
    const validIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id))

    if (validIds.length === 0) return []

    const attributes = await this.db
      .collection(this.collection)
      .find({ _id: { $in: validIds } })
      .toArray()

    return attributes.map(this.mapToAttribute)
  }

  async listAttributes(
    page: number = 1,
    limit: number = 20
  ): Promise<Attribute[]> {
    const skip = (page - 1) * limit

    const attributes = await this.db
      .collection(this.collection)
      .find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return attributes.map(this.mapToAttribute)
  }

  async listAllAttributes(): Promise<Attribute[]> {
    const attributes = await this.db
      .collection(this.collection)
      .find()
      .sort({ name: 1 })
      .toArray()

    return attributes.map(this.mapToAttribute)
  }

  async countAttributes(): Promise<number> {
    return this.db.collection(this.collection).countDocuments()
  }

  async updateAttribute(
    id: string,
    update: Partial<Attribute>
  ): Promise<Attribute | null> {
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

    return this.mapToAttribute(result)
  }

  async deleteAttribute(attributeId: string): Promise<void> {
    try {
      console.log(`Starting delete of attribute ID: ${attributeId}`)

      // Get the attribute
      const attribute = await this.getAttributeById(attributeId)
      if (!attribute) {
        console.log(`Attribute ID ${attributeId} not found`)
        throw new Error("Attribute not found")
      }

      console.log(`Found attribute: ${attribute.name}`)

      // Create product repository
      const productRepository = new ProductRepository(this.db)

      // First, remove the attribute from products
      console.log(`Removing attribute ${attribute.name} from all products`)
      await productRepository.removeAttributeFromAllProducts(attribute.name)
      console.log(`Successfully removed attribute from products`)

      // Then delete the attribute definition
      console.log(`Deleting attribute definition for ${attribute.name}`)
      const result = await this.db
        .collection(this.collection)
        .deleteOne({ _id: new ObjectId(attributeId) })

      console.log(`Attribute deletion result: ${JSON.stringify(result)}`)

      if (result.deletedCount === 0) {
        throw new Error(`Failed to delete attribute ${attributeId}`)
      }

      console.log(`Successfully deleted attribute: ${attribute.name}`)
    } catch (error) {
      console.error("Error in deleteAttribute method:", error)
      throw error
    }
  }

  // Helper method to convert MongoDB document to Attribute type
  private mapToAttribute(doc: WithId<Document>): Attribute {
    return {
      _id: doc._id.toString(),
      name: doc.name as string,
      displayName: doc.displayName as string,
      type: doc.type as Attribute["type"],
      description: doc.description as string | undefined,
      required: doc.required as boolean,
      searchable: doc.searchable as boolean,
      options: doc.options as string[] | undefined,
      units: doc.units as string[] | undefined,
      maxLength: doc.maxLength as number | undefined,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    }
  }
}

export async function createAttributeRepository(): Promise<AttributeRepository> {
  const db = await connectToDatabase()
  return new AttributeRepository(db)
}
