export interface ImportFileRequest {
  fileName: string
  contentType: string
}

export interface ImportFileResponse {
  presignedUrl: string
  blobUrl: string
  success: boolean
}

export interface ProcessFileRequest {
  fileUrl: string
  fileType: "csv" | "excel" | "xlsx"
}

export interface ProcessFileResponse {
  success: boolean
  imported: number
  total: number
  errors?: ImportError[]
}

export interface ImportError {
  row: number
  message: string
  field?: string
}

export interface ImportProgress {
  isUploading: boolean
  isProcessing: boolean
  uploadProgress: number
  processProgress: number
}
