"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon } from "@heroicons/react/24/outline"
import AttributeList from "@/app/components/attributes/AttributeList"
import { useAttributes } from "@/app/hooks/useAttributes"

export default function AttributesPage() {
  const router = useRouter()
  const { attributes, loading, error, deleteAttribute } = useAttributes()
  const [deleteInProgress, setDeleteInProgress] = useState(false)

  const handleDelete = async (attributeId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this attribute? This action will remove it from all products that use it."
      )
    ) {
      setDeleteInProgress(true)
      try {
        console.log(`Attempting to delete attribute: ${attributeId}`)
        await deleteAttribute(attributeId)
        console.log(`Attribute ${attributeId} deleted successfully`)
        router.refresh()
      } catch (error: any) {
        console.error("Error deleting attribute:", error)
        const errorMessage = error?.message || "Unknown error occurred"
        alert(`Failed to delete attribute: ${errorMessage}`)
      } finally {
        setDeleteInProgress(false)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attributes</h1>
        <Link href="/attributes/new" className="btn-primary flex items-center">
          <PlusIcon className="w-5 h-5 mr-1" />
          New Attribute
        </Link>
      </div>

      <div className="card">
        <AttributeList
          attributes={attributes}
          loading={loading}
          error={error}
          onDelete={handleDelete}
          deleteInProgress={deleteInProgress}
        />
      </div>
    </div>
  )
}
