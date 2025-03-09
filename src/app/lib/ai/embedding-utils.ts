import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client (for vector storage)
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to generate embeddings using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `OpenAI API error: ${error.error?.message || response.statusText}`
      )
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw new Error("Failed to generate text embedding")
  }
}

// Function to find similar products by embedding
export async function findSimilarProducts(
  embedding: number[],
  limit: number = 5
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error finding similar products:", error)
    throw new Error("Failed to find similar products")
  }
}

// Function to store product embedding
export async function storeProductEmbedding(
  productId: string,
  embedding: number[]
): Promise<void> {
  try {
    const { error } = await supabase.from("product_embeddings").upsert({
      product_id: productId,
      embedding,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error storing product embedding:", error)
    throw new Error("Failed to store product embedding")
  }
}
