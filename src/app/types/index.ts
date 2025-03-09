export * from "./product"
export * from "./attribute"
export * from "./import"
export * from "./enrichment"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}
