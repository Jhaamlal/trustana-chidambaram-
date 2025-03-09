import { Attribute } from "@/app/types/attribute"
import { Product } from "@/app/types/product"

export const getSystemPrompt = (): string => {
  return `You are a product information specialist AI that helps enrich product data with accurate and relevant information.
Your task is to generate values for specific product attributes based on the provided product information and similar products.
Always be factual and precise. If you cannot determine a value with reasonable confidence, indicate this with a confidence score below 0.5.
Do not make up information. Base your responses on the provided context and your knowledge of product categories.`
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
  `

  // Format similar products information
  const similarProductsInfo =
    similarProducts.length > 0
      ? `
Similar Products Information:
${similarProducts
  .map(
    (p) => `
- Name: ${p.name}
  Brand: ${p.brand}
  ${formatProductAttributes(p)}
`
  )
  .join("\n")}
`
      : "No similar products found."

  // Format attributes to be enriched
  const attributesInfo = `
Attributes to Generate:
${attributesToEnrich
  .map(
    (attr) => `
- ${attr.displayName} (${attr.name})
  Type: ${attr.type}
  ${
    attr.type === "single_select" || attr.type === "multiple_select"
      ? `Options: ${attr.options?.join(", ")}`
      : ""
  }
  ${attr.type === "measure" ? `Units: ${attr.units?.join(", ")}` : ""}
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

For each attribute, provide a value that is accurate and appropriate for this product based on the information provided.
For each generated attribute value, also provide a confidence score between 0 and 1 indicating how confident you are in the accuracy of the value.

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
  "k": "price",
  "v": 29.99,
  "u": "USD",
  "confidence": 0.85
}

For 'multiple_select' type attributes, provide an array of values:
{
  "k": "colors",
  "v": ["red", "blue"],
  "confidence": 0.7
}
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

      return `  ${attr.k}: ${valueStr}`
    })
    .join("\n")
}
