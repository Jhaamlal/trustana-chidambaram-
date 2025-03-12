import { useState } from "react"
import axios from "axios"

export function useImport() {
  const [isImporting, setIsImporting] = useState(false)

  const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void
  ) => {
    setIsImporting(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload the file using axios with progress tracking
      const response = await axios.post("/api/import/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            )
            onProgress(progress)
          }
        },
      })

      // Return the response data
      return { blobUrl: response.data.blobUrl }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "File upload failed"
      )
    } finally {
      setIsImporting(false)
    }
  }

  const processFile = async (
    fileUrl: string,
    fileType: string,
    onProgress: (progress: number) => void
  ) => {
    try {
      // Start with 0% progress
      onProgress(0)

      // Process the file on the server
      const response = await axios.post("/api/import/process", {
        fileUrl,
        fileType,
      })

      // Simulate progress updates while processing
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        const increment = Math.random() * 10
        currentProgress += increment
        if (currentProgress > 95) currentProgress = 95
        onProgress(currentProgress)
      }, 1000)

      clearInterval(progressInterval)

      // Complete the progress
      onProgress(100)

      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "File processing failed"
      )
    }
  }

  return { uploadFile, processFile, isImporting }
}
