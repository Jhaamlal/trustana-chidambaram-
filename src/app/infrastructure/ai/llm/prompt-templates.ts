import { Attribute } from "@/app/types/attribute"
import { Product } from "@/app/types/product"

export const getSystemPrompt = (): string => {
  return `You are a product information specialist AI that helps enrich product data with accurate and relevant information.
Your task is to generate values for specific product attributes based on the provided product information and similar products.

IMPORTANT: You MUST generate values for ALL requested attributes, even if you have to make educated guesses with lower confidence scores.
Always return data in the exact JSON format requested with values for every attribute.

Guidelines:
- Be factual and precise where possible
- For uncertain values, set an appropriate confidence score between 0.3-0.5
- Never return empty arrays or null values
- Always provide a value for every requested attribute
- Base your responses on the provided context and your knowledge of product categories
- For selection-type attributes, always choose from the provided options list

When working with limited data:
1. Leverage your general knowledge about product categories and common attributes
2. Use available product information (name, brand, etc.) to make educated inferences
3. Set appropriate confidence scores that reflect the limited data situation
4. For selection-type attributes, choose the most likely option from the provided list`
}

export const getAttributeGenerationPrompt = (
  product: Product,
  similarProducts: Product[],
  attributesToEnrich: Attribute[]
): string => {
  // Format the product information
  const productInfo = `
Product Information:
Name: ${product.name}
Brand: ${product.brand}
${product.barcode ? `Barcode: ${product.barcode}` : ""}
${
  product.images && product.images.length > 0
    ? `Has ${product.images.length} product images`
    : "No product images available"
}

${
  product.attr && product.attr.length > 0
    ? `Existing Product Attributes:
${formatProductAttributes(product)}`
    : "No existing attributes available for this product"
}
  `

  // Format similar products information
  const similarProductsInfo =
    similarProducts.length > 0
      ? `
Similar Products Information (${similarProducts.length} products found):
${similarProducts
  .map(
    (p, index) => `
- Similar Product ${index + 1}:
  Name: ${p.name}
  Brand: ${p.brand}
  ${formatProductAttributes(p)}
`
  )
  .join("\n")}
`
      : `
Limited Similar Products Context:
No similar products with matching attributes were found in the database.
You should rely more on the product name, brand, and your general knowledge about this type of product.
`

  // Format attributes to be enriched with clearer instructions
  const attributesInfo = `
ATTRIBUTES TO GENERATE (YOU MUST GENERATE ALL OF THESE):
${attributesToEnrich
  .map(
    (attr) => `
- ${attr.displayName} (${attr.name})
  Type: ${attr.type}
  Description: ${attr.description || "No description available"}
  ${
    attr.type === "single_select" || attr.type === "multiple_select"
      ? `Options: ${attr.options?.join(
          ", "
        )} (YOU MUST SELECT FROM THESE OPTIONS ONLY)`
      : ""
  }
  ${
    attr.type === "measure"
      ? `Units: ${attr.units?.join(", ")} (YOU MUST USE ONE OF THESE UNITS)`
      : ""
  }
  ${
    attr.type === "short_text"
      ? `Max Length: ${attr.maxLength || 50} characters`
      : ""
  }
`
  )
  .join("\n")}
`

  // Final prompt
  return `
${productInfo}

${similarProductsInfo}

${attributesInfo}

For each attribute listed above, provide a value that is accurate and appropriate for this product based on the information provided.
For each generated attribute value, also provide a confidence score between 0 and 1 indicating how confident you are in the accuracy of the value.

CRITICAL INSTRUCTIONS:
1. YOU MUST generate a value for EVERY attribute listed above
2. Set lower confidence scores (0.3-0.5) when you're making educated guesses
3. YOU MUST follow the type constraints (selection options, measure units, etc.)
4. For 'measure' type attributes, ALWAYS include both value and unit
5. For 'selection' type attributes, ONLY choose from the provided options list
6. For 'multiple_select' type attributes, provide at least one valid option

Format your response as a valid JSON array of objects with the following structure:
[
  {
    "k": "attribute_name",
    "v": "attribute_value",
    "confidence": 0.9
  },
  ...
]

For 'measure' type attributes, include a unit field:
{
  "k": "weight",
  "v": 500,
  "u": "g",
  "confidence": 0.85
}

For 'multiple_select' type attributes, provide an array of values:
{
  "k": "colors",
  "v": ["red", "blue"],
  "confidence": 0.7
}

REMINDER: Your response MUST contain values for ALL requested attributes.
`
}

function formatProductAttributes(product: Product): string {
  if (!product.attr || product.attr.length === 0) {
    return "No attributes available"
  }

  return product.attr
    .map((attr) => {
      let valueStr = ""

      if (attr.u) {
        valueStr = `${attr.v} ${attr.u}`
      } else if (Array.isArray(attr.v)) {
        valueStr = attr.v.join(", ")
      } else {
        valueStr = String(attr.v)
      }

      return `  ${attr.k}: ${valueStr}${
        attr.confidence ? ` (confidence: ${attr.confidence.toFixed(2)})` : ""
      }`
    })
    .join("\n")
}
