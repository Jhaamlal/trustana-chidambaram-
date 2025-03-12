"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import FileUpload from "@/app/components/import/FileUpload"
import ImportProgress from "@/app/components/import/ImportProgress"
import { useImport } from "@/app/hooks/useImport"

export default function ImportPage() {
  const router = useRouter()
  const { uploadFile, processFile } = useImport()
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processProgress, setProcessProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    success: boolean
    imported: number
    total: number
  } | null>(null)

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setImportResult(null)

    try {
      // Determine file type from extension ,if that file extension is not what we want in that case it will raise the error
      const fileType = file.name.split(".").pop()?.toLowerCase()
      if (!fileType || !["csv", "xlsx", "xls"].includes(fileType)) {
        throw new Error(
          "Unsupported file type. Please upload a CSV or Excel file."
        )
      }

      // Upload file to server
      const uploadResult = await uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })

      setIsUploading(false)
      setIsProcessing(true)

      // Process the uploaded file
      const result = await processFile(
        uploadResult.blobUrl,
        fileType,
        (progress) => {
          setProcessProgress(progress)
        }
      )

      setImportResult(result)

      // Show success message
      if (result.success) {
        setTimeout(() => {
          router.push("/products")
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during import")
      console.error("Import error:", err)
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setIsUploading(false)
    setIsProcessing(false)
    setUploadProgress(0)
    setProcessProgress(0)
    setError(null)
    setImportResult(null)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Products</h1>
      </div>

      <div className="card">
        {!isUploading && !isProcessing && !importResult && (
          <>
            <h2 className="text-lg font-semibold mb-4">Upload Product File</h2>
            <p className="text-gray-600 mb-6">
              Upload a CSV or Excel file containing your product data. The file
              should include columns for product name, brand, barcode, and image
              URLs.
            </p>

            <FileUpload
              onFileSelect={handleFileUpload}
              acceptedFileTypes=".csv,.xlsx,.xls"
              maxFileSizeMB={10}
            />
          </>
        )}

        {(isUploading || isProcessing) && (
          <ImportProgress
            isUploading={isUploading}
            isProcessing={isProcessing}
            uploadProgress={uploadProgress}
            processProgress={processProgress}
          />
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 font-medium">Error: {error}</p>
            <button onClick={handleReset} className="mt-4 btn-secondary">
              Try Again
            </button>
          </div>
        )}

        {importResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-medium text-green-700 mb-2">
              Import Successful!
            </h3>
            <p className="text-green-600">
              Successfully imported {importResult.imported} products out of{" "}
              {importResult.total}.
            </p>
            <p className="mt-2 text-gray-600">
              You will be redirected to the products page in a few seconds...
            </p>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => router.push("/products")}
                className="btn-primary"
              >
                Go to Products
              </button>
              <button onClick={handleReset} className="btn-secondary">
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
