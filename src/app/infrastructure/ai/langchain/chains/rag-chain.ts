import { Product } from "@/app/types/product"
import { Attribute } from "@/app/types/attribute"
import { ProductAttribute } from "@/app/types/product"
import { AttributeGenerationChain } from "./attribute-generation-chain"

export class RAGChain {
  private attributeGenerationChain: AttributeGenerationChain

  constructor() {
    this.attributeGenerationChain = new AttributeGenerationChain()
  }

  async run({
    product,
    similarProducts,
    attributesToEnrich,
  }: {
    product: Product
    similarProducts: Product[]
    attributesToEnrich: Attribute[]
  }): Promise<ProductAttribute[]> {
    try {
      // Filter similar products to only include those with relevant attributes
      const relevantSimilarProducts = this.filterRelevantSimilarProducts(
        similarProducts,
        attributesToEnrich
      )

      // Log the number of relevant similar products found
      console.log(
        `Found ${relevantSimilarProducts.length} relevant similar products for ${product.name}`
      )

      // Even if we don't have relevant similar products with exact attribute matches,
      // use products from the same category or brand as additional context
      let enhancedContextProducts = [...relevantSimilarProducts]

      // If we have very few relevant products, add more context from similar brands or categories
      if (relevantSimilarProducts.length < 3 && similarProducts.length > 0) {
        console.log(
          `Limited relevant products found. Adding similar brand/category products as additional context`
        )

        // Add products with same brand if available
        const sameBrandProducts = similarProducts
          .filter(
            (p) =>
              p.brand?.toLowerCase() === product.brand?.toLowerCase() &&
              !relevantSimilarProducts.includes(p)
          )
          .slice(0, 3)

        enhancedContextProducts = [
          ...enhancedContextProducts,
          ...sameBrandProducts,
        ]
        console.log(
          `Added ${sameBrandProducts.length} products from the same brand`
        )
      }

      // Generate attribute values using the attribute generation chain
      const generatedAttributes = await this.attributeGenerationChain.run(
        product,
        enhancedContextProducts,
        attributesToEnrich
      )

      return generatedAttributes
    } catch (error) {
      console.error("Error in RAG chain:", error)
      throw error
    }
  }

  private filterRelevantSimilarProducts(
    similarProducts: Product[],
    attributesToEnrich: Attribute[]
  ): Product[] {
    // Get attribute names to enrich
    const attributeNames = attributesToEnrich.map((attr) => attr.name)

    // Filter similar products to only include those with at least one relevant attribute
    // Also, include how many relevant attributes each product has to prioritize those with more matches
    const productsWithRelevanceScore = similarProducts
      .map((product) => {
        if (!product.attr || product.attr.length === 0)
          return { product, score: 0 }

        // Count how many of the attributes we want to enrich are present in this product
        const relevantAttributeCount = product.attr.filter((attr) =>
          attributeNames.includes(attr.k)
        ).length

        return { product, score: relevantAttributeCount }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score) // Sort by descending score

    // Return products, prioritizing those with more relevant attributes
    return productsWithRelevanceScore.map(({ product }) => product)
  }
}
