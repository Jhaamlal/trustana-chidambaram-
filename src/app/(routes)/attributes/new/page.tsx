"use client"

import { useRouter } from "next/navigation"
import AttributeForm from "@/app/components/attributes/AttributeForm"
import { useAttributes } from "@/app/hooks/useAttributes"
import { Attribute } from "@/app/types/attribute"

export default function NewAttributePage() {
  const router = useRouter()
  const { createAttribute } = useAttributes()

  const handleSubmit = async (attribute: Omit<Attribute, "_id">) => {
    try {
      await createAttribute(attribute)
      router.push("/attributes")
    } catch (error) {
      console.error("Error creating attribute:", error)
      alert("Failed to create attribute")
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Attribute</h1>
      </div>

      <div className="card">
        <AttributeForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
