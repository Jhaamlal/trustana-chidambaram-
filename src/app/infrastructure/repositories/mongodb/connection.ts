import { MongoClient, Db } from "mongodb"

// Connection caching for serverless environment
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient
  }

  const uri = process.env.MONGODB_URI as string
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  const client = new MongoClient(uri)
  await client.connect()

  cachedClient = client
  return client
}

export async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }

  const dbName = process.env.MONGODB_DB || "product-management"
  const client = await getMongoClient()
  const db = client.db(dbName)

  cachedDb = db
  return db
}
