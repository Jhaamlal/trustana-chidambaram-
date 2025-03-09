export class EmbeddingService {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ""
    this.model = "text-embedding-3-small"
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        throw new Error("OpenAI API key is not configured")
      }

      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
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

      // Return a zero vector as fallback (not ideal but prevents system failure)
      return Array(1536).fill(0)
    }
  }
}
