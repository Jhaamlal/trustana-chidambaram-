export class ClaudeService {
  private apiKey: string
  private model: string
  private fallbackModel: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || ""
    this.model = "claude-3-5-sonnet-20240620"
    this.fallbackModel = "claude-3-opus-20240229"
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
        console.error("Anthropic API key is not configured")
        throw new Error("Anthropic API key is not configured")
      }

      const { temperature = 0.2, maxTokens = 4000, systemPrompt } = options

      console.log(`Calling Claude API with ${prompt.length} character prompt`)
      console.log(`Using model: ${this.model}`)

      try {
        return await this.callClaudeApi(
          this.model,
          prompt,
          temperature,
          maxTokens,
          systemPrompt
        )
      } catch (primaryModelError: any) {
        console.warn(
          `Error with primary Claude model: ${primaryModelError.message}, trying fallback model`
        )
        return await this.callClaudeApi(
          this.fallbackModel,
          prompt,
          temperature,
          maxTokens,
          systemPrompt
        )
      }
    } catch (error) {
      console.error("Error generating completion with Claude:", error)
      throw error
    }
  }

  private async callClaudeApi(
    modelName: string,
    prompt: string,
    temperature: number,
    maxTokens: number,
    systemPrompt?: string
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    })

    if (!response.ok) {
      let errorInfo = "Unknown error"
      try {
        const error = await response.json()
        errorInfo = JSON.stringify(error)
        console.error(
          `Anthropic API error response for model ${modelName}:`,
          error
        )
      } catch (jsonError) {
        errorInfo = await response.text()
        console.error(
          `Failed to parse error response: ${errorInfo}. Error: ${jsonError}`
        )
      }
      throw new Error(`Anthropic API error (${response.status}): ${errorInfo}`)
    }

    const data = await response.json()

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Unexpected API response format:", data)
      throw new Error("Invalid response format from Anthropic API")
    }

    console.log(
      `Successfully generated completion with ${data.content[0].text.length} characters`
    )
    return data.content[0].text
  }
}
