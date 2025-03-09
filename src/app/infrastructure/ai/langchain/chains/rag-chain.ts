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

      // Generate attribute values using the attribute generation chain
      const generatedAttributes = await this.attributeGenerationChain.run(
        product,
        relevantSimilarProducts,
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
    return similarProducts.filter((product) => {
      if (!product.attr || product.attr.length === 0) return false

      // Check if the product has any of the attributes we want to enrich
      return product.attr.some((attr) => attributeNames.includes(attr.k))
    })
  }
}
