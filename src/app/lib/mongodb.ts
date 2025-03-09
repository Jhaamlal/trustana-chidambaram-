"use server"
import { MongoClient, Db } from "mongodb"

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/product-management"
const MONGODB_DB = process.env.MONGODB_DB || "product-management"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  // If we have cached connections, use them
  if (cachedClient && cachedDb) {
    return cachedDb
  }

  // Connect to MongoDB
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(MONGODB_DB)

  // Cache the connections
  cachedClient = client
  cachedDb = db

  // Create indexes if they don't exist
  await setupIndexes(db)

  return db
}

async function setupIndexes(db: Db): Promise<void> {
  // Create indexes for products collection
  await db.collection("products").createIndex({ name: 1 })
  await db.collection("products").createIndex({ brand: 1 })
  await db
    .collection("products")
    .createIndex({ barcode: 1 }, { unique: true, sparse: true })
  await db.collection("products").createIndex({ "attr.k": 1, "attr.v": 1 })

  // Create text index for search
  await db.collection("products").createIndex({
    name: "text",
    brand: "text",
  })

  // Create indexes for attributes collection
  await db
    .collection("attributes_definition")
    .createIndex({ name: 1 }, { unique: true })
  await db.collection("attributes_definition").createIndex({ type: 1 })
}
