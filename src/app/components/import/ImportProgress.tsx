import { useEffect } from "react"

interface ImportProgressProps {
  isUploading: boolean
  isProcessing: boolean
  uploadProgress: number
  processProgress: number
}

export default function ImportProgress({
  isUploading,
  isProcessing,
  uploadProgress,
  processProgress,
}: ImportProgressProps) {
  // Calculate overall progress
  const overallProgress = isUploading
    ? uploadProgress * 0.3 // Upload is 30% of the process
    : 30 + processProgress * 0.7 // Processing is 70% of the process

  useEffect(() => {
    // Prevent navigation away during import
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading || isProcessing) {
        e.preventDefault()
        e.returnValue = "Import in progress. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isUploading, isProcessing])

  return (
    <div className="py-4">
      <h3 className="text-lg font-medium mb-4">
        {isUploading ? "Uploading File..." : "Processing Products..."}
      </h3>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${Math.round(overallProgress)}%` }}
        ></div>
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <span>
          {isUploading
            ? `Uploading: ${Math.round(uploadProgress)}%`
            : `Processing: ${Math.round(processProgress)}%`}
        </span>
        <span>{Math.round(overallProgress)}% Complete</span>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        {isUploading
          ? "Uploading your file to the server. Please do not close this window."
          : "Analyzing and importing products. This may take a few minutes for large files."}
      </p>

      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Processing your data:</span>{" "}
            {`We're
            extracting product information, validating fields, and preparing for
            AI enrichment. Products will be available in the product list once
            processing is complete.`}
          </p>
        </div>
      )}
    </div>
  )
}
