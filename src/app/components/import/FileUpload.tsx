import { useState, useRef } from "react"
import Button from "@/app/components/ui/Button"
import { CloudArrowUpIcon } from "@heroicons/react/24/outline"
import Input from "../ui/Input"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedFileTypes: string
  maxFileSizeMB: number
}

export default function FileUpload({
  onFileSelect,
  acceptedFileTypes,
  maxFileSizeMB,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxFileSizeMB * 1024 * 1024

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(
        `File size exceeds the maximum allowed size (${maxFileSizeMB} MB)`
      )
      return false
    }

    // Check file type
    const fileType = file.name.split(".").pop()?.toLowerCase()
    const acceptedTypes = acceptedFileTypes
      .split(",")
      .map((type) => type.trim().replace(".", "").toLowerCase())

    if (!fileType || !acceptedTypes.includes(fileType)) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`)
      return false
    }

    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  return (
    <div>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }
          ${error ? "border-red-300" : ""}
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400" />

        <p className="mt-2 text-sm text-gray-600">
          Drag and drop your file here, or{" "}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium"
            onClick={handleButtonClick}
          >
            browse
          </button>
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Accepted file types: {acceptedFileTypes}
        </p>
        <p className="text-xs text-gray-500">
          Maximum file size: {maxFileSizeMB} MB
        </p>
        {/* need to check */}
        {/* <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleChange}
        /> */}
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleChange}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {selectedFile && !error && (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button variant="primary" onClick={handleUpload}>
              Upload
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
