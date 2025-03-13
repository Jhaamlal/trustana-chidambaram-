"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import AttributeForm from "@/app/components/attributes/AttributeForm"
import { useAttributes } from "@/app/hooks/useAttributes"
import { Attribute } from "@/app/types"

// Use a simpler approach for client components
export default function EditAttributePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { getAttribute, updateAttribute } = useAttributes()
  const [attribute, setAttribute] = useState<Attribute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttribute = async () => {
      try {
        const data = await getAttribute(id)
        setAttribute(data)
      } catch (err) {
        setError("Failed to load attribute")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAttribute()
  }, [id, getAttribute])

  const handleSubmit = async (updatedAttribute: Omit<Attribute, "_id">) => {
    try {
      await updateAttribute(id, updatedAttribute)
      router.push("/attributes")
    } catch (err) {
      console.error("Error updating attribute:", err)
      alert("Failed to update attribute")
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <p>Loading attribute...</p>
        </div>
      </div>
    )
  }

  if (error || !attribute) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-red-500">{error || "Attribute not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Attribute</h1>
      </div>

      <div className="card">
        <AttributeForm
          onSubmit={handleSubmit}
          initialValues={attribute}
          isEditing={true}
        />
      </div>
    </div>
  )
}
