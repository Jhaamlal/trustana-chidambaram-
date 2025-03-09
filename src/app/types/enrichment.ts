export interface EnrichmentRequest {
  productIds: string[]
  attributeIds?: string[]
}

export interface EnrichmentResponse {
  success: boolean
  jobId: string
  message: string
}

export type EnrichmentStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed"

export interface EnrichmentJobStatus {
  jobId: string
  status: EnrichmentStatus
  progress: number
  productsTotal: number
  productsProcessed: number
  startedAt: Date
  completedAt?: Date
  error?: string
}

export interface EnrichmentResult {
  productId: string
  enrichedAttributes: string[]
  success: boolean
  error?: string
}

export interface ConfidenceMetrics {
  contextual_match: number
  format_validity: number
  source_reliability: number
  llm_confidence: number
}
