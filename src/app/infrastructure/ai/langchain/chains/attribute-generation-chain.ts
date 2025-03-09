import { ClaudeService } from "../../llm/claude-service"
import {
  getSystemPrompt,
  getAttributeGenerationPrompt,
} from "../../llm/prompt-templates"
import { Product } from "@/app/types/product"
import { Attribute } from "@/app/types/attribute"
import { ProductAttribute } from "@/app/types/product"

export class AttributeGenerationChain {
  private llm: ClaudeService

  constructor() {
    this.llm = new ClaudeService()
  }

  async run(
    product: Product,
    similarProducts: Product[],
    attributesToEnrich: Attribute[]
  ): Promise<ProductAttribute[]> {
    try {
      // Generate the prompt
      const systemPrompt = getSystemPrompt()
      const prompt = getAttributeGenerationPrompt(
        product,
        similarProducts,
        attributesToEnrich
      )

      // Call the LLM
      const response = await this.llm.generateCompletion(prompt, {
        systemPrompt,
        temperature: 0.2,
      })

      // Parse the response
      return this.parseResponse(response, attributesToEnrich)
    } catch (error) {
      console.error("Error in attribute generation chain:", error)
      throw error
    }
  }

  private parseResponse(
    response: string,
    attributesToEnrich: Attribute[]
  ): ProductAttribute[] {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/)

      if (!jsonMatch) {
        throw new Error("Could not find valid JSON array in the response")
      }

      const jsonStr = jsonMatch[0]
      const attributes = JSON.parse(jsonStr) as ProductAttribute[]

      // Validate and clean up attributes
      return attributes.filter((attr) => {
        // Check if this is a valid attribute
        const attributeDef = attributesToEnrich.find((a) => a.name === attr.k)
        if (!attributeDef) return false

        // Validate based on attribute type
        switch (attributeDef.type) {
          case "short_text":
            if (typeof attr.v !== "string") attr.v = String(attr.v)
            if (attr.v.length > (attributeDef.maxLength || 50)) {
              attr.v = attr.v.substring(0, attributeDef.maxLength || 50)
            }
            return true

          case "long_text":
          case "rich_text":
            if (typeof attr.v !== "string") attr.v = String(attr.v)
            return true

          case "number":
            if (typeof attr.v !== "number") {
              try {
                attr.v = Number(attr.v)
              } catch {
                return false
              }
            }
            return !isNaN(attr.v)

          case "single_select":
            if (typeof attr.v !== "string") attr.v = String(attr.v)
            return attributeDef.options?.includes(attr.v) || false

          case "multiple_select":
            if (!Array.isArray(attr.v)) {
              if (typeof attr.v === "string") {
                attr.v = [attr.v]
              } else {
                return false
              }
            }
            return attr.v.every((v: any) => attributeDef.options?.includes(v))

          case "measure":
            if (typeof attr.v !== "number") {
              try {
                attr.v = Number(attr.v)
              } catch {
                return false
              }
            }
            return (
              !isNaN(attr.v) && !!attr.u && attributeDef.units?.includes(attr.u)
            )

          default:
            return false
        }
      })
    } catch (error) {
      console.error("Error parsing LLM response:", error)
      return []
    }
  }
}
