export interface Product {
  _id: string
  name: string
  brand: string
  barcode?: string
  images: string[]
  importedAt: Date
  enriched: boolean
  enrichedAt?: Date
  attr?: ProductAttribute[]
  description_embedding?: number[]
}

export interface ProductAttribute {
  k: string // attribute key/name
  v: any // attribute value
  u?: string // unit (for measure type)
  confidence?: number // AI confidence score
}

export interface ProductFilterOptions {
  page: number
  limit: number
  sortField: string
  sortOrder: "asc" | "desc"
  filters: Record<string, any>
}

export interface ProductPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ProductListResponse {
  products: Product[]
  pagination: ProductPagination
}
