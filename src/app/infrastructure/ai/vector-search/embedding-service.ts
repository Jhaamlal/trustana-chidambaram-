export class EmbeddingService {
  private apiKey: string
  private model: string
  private fallbackModel: string
  private db: any

  constructor(db: any) {
    this.apiKey = process.env.OPENAI_API_KEY || ""
    this.model = "text-embedding-3-small"
    this.fallbackModel = "text-embedding-ada-002"
    this.db = db
  }

  // Here we are passing the data create vector embedding using OpenAI
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        console.error("OpenAI API key is not configured")
        throw new Error("OpenAI API key is not configured")
      }

      console.log(`Generating embedding for text: ${text.substring(0, 50)}...`)

      // Try with the primary model first
      try {
        return await this.fetchEmbedding(this.model, text)
      } catch (primaryModelError: any) {
        // If the primary model fails, try the fallback model
        console.warn(
          `Error with primary embedding model: ${primaryModelError.message}, trying fallback model`
        )
        return await this.fetchEmbedding(this.fallbackModel, text)
      }
    } catch (error) {
      console.error("Error generating embedding:", error)
      throw error
    }
  }

  private async fetchEmbedding(
    modelName: string,
    text: string
  ): Promise<number[]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        input: text,
        dimensions: 1536, // Explicitly request 1536 dimensions for compatibility
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`OpenAI API error response for model ${modelName}:`, error)
      throw new Error(
        `OpenAI API error: ${error.error?.message || response.statusText}`
      )
    }

    const data = await response.json()
    console.log(
      `Successfully generated embedding with ${data.data[0].embedding.length} dimensions using model ${modelName}`
    )
    return data.data[0].embedding
  }
}

export function createEmbeddingService(db: any) {
  return new EmbeddingService(db)
}
