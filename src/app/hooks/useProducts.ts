import { useState } from "react"

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

      // Track upload progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      // Upload the file directly
      return new Promise<{ blobUrl: string }>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve({ blobUrl: response.blobUrl })
            } catch (err) {
              console.log(err)
              reject(new Error("Invalid response format"))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
        })

        xhr.open("POST", "/api/import/upload")
        xhr.send(formData)
      })
    } catch (error: any) {
      throw new Error(error.message || "File upload failed")
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
      const response = await fetch("/api/import/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl,
          fileType,
        }),
      })

      // Simulate progress updates while processing
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        const increment = Math.random() * 10
        currentProgress += increment
        if (currentProgress > 95) currentProgress = 95
        onProgress(currentProgress)
      }, 1000)

      const result = await response.json()

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(result.error || "Failed to process file")
      }

      // Complete the progress
      onProgress(100)

      return result
    } catch (error: any) {
      throw new Error(error.message || "File processing failed")
    }
  }

  return { uploadFile, processFile, isImporting }
}
