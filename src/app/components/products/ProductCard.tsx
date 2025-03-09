import Image from "next/image"
import { Product } from "@/app/types/product"
import { Attribute } from "@/app/types/attribute"

interface ProductCardProps {
  product: Product
  attributes: Attribute[]
}

export default function ProductCard({ product, attributes }: ProductCardProps) {
  // Function to get attribute value for display
  const getAttributeValue = (attrName: string): string => {
    if (!product.attr) return "N/A"

    const attribute = product.attr.find((a) => a.k === attrName)
    if (!attribute) return "N/A"

    if (attribute.u) {
      return `${attribute.v} ${attribute.u}`
    }

    return String(attribute.v)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {product.images && product.images.length > 0 ? (
        <div className="relative h-48 w-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-3">Brand: {product.brand}</p>

        <div className="space-y-2">
          {attributes.slice(0, 3).map((attr) => (
            <div key={attr._id} className="flex justify-between">
              <span className="text-sm text-gray-600">{attr.displayName}:</span>
              <span className="text-sm font-medium text-gray-900">
                {getAttributeValue(attr.name)}
              </span>
            </div>
          ))}

          {product.barcode && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Barcode:</span>
              <span className="text-sm font-medium text-gray-900">
                {product.barcode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
