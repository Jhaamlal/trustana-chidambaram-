export type AttributeType =
  | "short_text"
  | "long_text"
  | "rich_text"
  | "number"
  | "single_select"
  | "multiple_select"
  | "measure"

export interface Attribute {
  _id: string
  name: string
  displayName: string
  type: AttributeType
  description?: string
  required: boolean
  searchable: boolean
  options?: string[] // For single_select and multiple_select
  units?: string[] // For measure
  maxLength?: number // For short_text
  createdAt: Date
  updatedAt: Date
}

export interface AttributeListResponse {
  attributes: Attribute[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
