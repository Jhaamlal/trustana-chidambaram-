export class EmbeddingService {
  private apiKey: string
  private model: string
  private db: any

  constructor(db: any) {
    this.apiKey = process.env.OPENAI_API_KEY || ""
    this.model = "text-embedding-3-small"
    this.db = db
  }

  // Here we are passing the ,data create vector embedding ,using OPEN AI, it will
  // take some time, I can have used some trigger not to that need not to refresh ,but will do BAAD ME
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        console.error("OpenAI API key is not configured")
        throw new Error("OpenAI API key is not configured")
      }

      console.log(`Generating embedding for text: ${text.substring(0, 50)}...`)

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
        console.error("OpenAI API error response:", error)
        throw new Error(
          `OpenAI API error: ${error.error?.message || response.statusText}`
        )
      }

      const data = await response.json()
      console.log(
        `Successfully generated embedding with ${data.data[0].embedding.length} dimensions`
      )
      return data.data[0].embedding
    } catch (error) {
      console.error("Error generating embedding:", error)
      throw error // Rethrow to handle properly instead of returning zeros
    }
  }
}

export function createEmbeddingService(db: any) {
  return new EmbeddingService(db)
}
