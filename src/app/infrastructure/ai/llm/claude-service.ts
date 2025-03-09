export class ClaudeService {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || ""
    this.model = "claude-3-opus-20240229"
  }

  async generateCompletion(
    prompt: string,
    options: {
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
    } = {}
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error("Anthropic API key is not configured")
      }

      const { temperature = 0.2, maxTokens = 4000, systemPrompt } = options

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          system: systemPrompt,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `Anthropic API error: ${error.error?.message || response.statusText}`
        )
      }

      const data = await response.json()
      return data.content[0].text
    } catch (error) {
      console.error("Error generating completion with Claude:", error)
      throw error
    }
  }
}
