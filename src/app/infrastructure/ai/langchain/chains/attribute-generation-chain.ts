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
      console.log(
        "Raw response from Claude:",
        response.substring(0, 200) + "..."
      )

      // Extract JSON from the response with a more robust regex
      // This handles various ways Claude might format the JSON response
      const jsonRegex = /(\[[\s\S]*?\](?=\s*$)|\[[\s\S]*\])/m
      const jsonMatch = response.match(jsonRegex)

      if (!jsonMatch) {
        console.error("Could not find valid JSON array in the response")
        console.log("Full response:", response)
        throw new Error("Could not find valid JSON array in the response")
      }

      const jsonStr = jsonMatch[0]
      console.log("Extracted JSON string:", jsonStr)

      let attributes
      try {
        attributes = JSON.parse(jsonStr) as ProductAttribute[]
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError)
        console.log("Problematic JSON string:", jsonStr)
        throw parseError
      }

      console.log(
        `Successfully parsed ${attributes.length} attributes from response`
      )

      // Validate and clean up attributes
      const validatedAttributes = attributes.filter((attr) => {
        // Check if this is a valid attribute
        const attributeDef = attributesToEnrich.find((a) => a.name === attr.k)
        if (!attributeDef) {
          console.warn(`Attribute ${attr.k} not found in schema`)
          return false
        }

        // Log attribute info
        console.log(
          `Processing attribute ${attr.k} of type ${attributeDef.type}`
        )
        console.log(`- Value: ${JSON.stringify(attr.v)}`)
        console.log(`- Confidence: ${attr.confidence}`)

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
                console.warn(`Invalid number value for ${attr.k}: ${attr.v}`)
                return false
              }
            }
            return !isNaN(attr.v)

          case "single_select":
            if (typeof attr.v !== "string") attr.v = String(attr.v)

            // Try to find closest match for the provided value
            if (!attributeDef.options?.includes(attr.v)) {
              console.warn(
                `Attempting to find close match for ${attr.k}: ${attr.v}`
              )

              // Convert to lowercase for comparison
              const lowerValue = attr.v.toLowerCase()

              // Find closest match (if any)
              const closestMatch = attributeDef.options?.find(
                (opt) => opt.toLowerCase() === lowerValue
              )

              if (closestMatch) {
                console.log(`Found case-insensitive match: ${closestMatch}`)
                attr.v = closestMatch
              } else {
                // Try partial match
                const partialMatch = attributeDef.options?.find(
                  (opt) =>
                    opt.toLowerCase().includes(lowerValue) ||
                    lowerValue.includes(opt.toLowerCase())
                )

                if (partialMatch) {
                  console.log(`Found partial match: ${partialMatch}`)
                  attr.v = partialMatch
                }
              }
            }

            const validOption = attributeDef.options?.includes(attr.v) || false
            if (!validOption) {
              console.warn(
                `Invalid option for ${attr.k}: ${
                  attr.v
                }, valid options: ${attributeDef.options?.join(", ")}`
              )
            }
            return validOption

          case "multiple_select":
            if (!Array.isArray(attr.v)) {
              if (typeof attr.v === "string") {
                attr.v = [attr.v]
              } else {
                console.warn(
                  `Invalid value type for multiple_select ${
                    attr.k
                  }: ${typeof attr.v}`
                )
                return false
              }
            }

            // Try to find closest matches for each value
            attr.v = attr.v.map((val: any) => {
              if (typeof val !== "string") return String(val)

              if (!attributeDef.options?.includes(val)) {
                // Try case-insensitive match
                const lowerVal = val.toLowerCase()
                const closestMatch = attributeDef.options?.find(
                  (opt) => opt.toLowerCase() === lowerVal
                )

                if (closestMatch) {
                  return closestMatch
                }

                // Try partial match
                const partialMatch = attributeDef.options?.find(
                  (opt) =>
                    opt.toLowerCase().includes(lowerVal) ||
                    lowerVal.includes(opt.toLowerCase())
                )

                if (partialMatch) {
                  return partialMatch
                }
              }

              return val
            })

            const allValid = attr.v.some((v: any) =>
              attributeDef.options?.includes(v)
            )
            if (!allValid) {
              console.warn(
                `No valid options found for ${attr.k}: ${
                  attr.v
                }, valid options: ${attributeDef.options?.join(", ")}`
              )
            }
            return allValid // More lenient - only need some valid options

          case "measure":
            if (typeof attr.v !== "number") {
              try {
                attr.v = Number(attr.v)
              } catch {
                console.warn(`Invalid measure value for ${attr.k}: ${attr.v}`)
                return false
              }
            }
            const validMeasure =
              !isNaN(attr.v) && !!attr.u && attributeDef.units?.includes(attr.u)
            if (!validMeasure) {
              console.warn(
                `Invalid measure for ${attr.k}: value=${attr.v}, unit=${
                  attr.u
                }, valid units: ${attributeDef.units?.join(", ")}`
              )
            }
            return validMeasure

          default:
            console.warn(`Unknown attribute type: ${attributeDef.type}`)
            return false
        }
      })

      console.log(
        `After validation: ${validatedAttributes.length} of ${attributes.length} attributes are valid`
      )
      return validatedAttributes
    } catch (error) {
      console.error("Error parsing LLM response:", error)
      return []
    }
  }
}
