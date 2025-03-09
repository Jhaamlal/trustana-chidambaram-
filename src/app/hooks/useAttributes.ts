import { useState, useEffect, useCallback } from "react"
import { Attribute } from "../types"

export function useAttributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttributes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/attributes")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch attributes")
      }

      setAttributes(data.attributes)
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching attributes")
      console.error("Error fetching attributes:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAttributes()
  }, [fetchAttributes])

  const getAttribute = useCallback(async (id: string): Promise<Attribute> => {
    try {
      const response = await fetch(`/api/attributes/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch attribute")
      }

      return data
    } catch (err: any) {
      throw new Error(
        err.message || "An error occurred while fetching attribute"
      )
    }
  }, [])

  const createAttribute = useCallback(
    async (attribute: Omit<Attribute, "_id">): Promise<Attribute> => {
      try {
        const response = await fetch("/api/attributes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attribute),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create attribute")
        }

        fetchAttributes() // Refresh the list
        return data
      } catch (err: any) {
        throw new Error(
          err.message || "An error occurred while creating attribute"
        )
      }
    },
    [fetchAttributes]
  )

  const updateAttribute = useCallback(
    async (id: string, attribute: Partial<Attribute>): Promise<Attribute> => {
      try {
        const response = await fetch(`/api/attributes/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attribute),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to update attribute")
        }

        fetchAttributes() // Refresh the list
        return data
      } catch (err: any) {
        throw new Error(
          err.message || "An error occurred while updating attribute"
        )
      }
    },
    [fetchAttributes]
  )

  const deleteAttribute = useCallback(
    async (id: string): Promise<void> => {
      try {
        const response = await fetch(`/api/attributes/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to delete attribute")
        }

        fetchAttributes() // Refresh the list
      } catch (err: any) {
        throw new Error(
          err.message || "An error occurred while deleting attribute"
        )
      }
    },
    [fetchAttributes]
  )

  return {
    attributes,
    loading,
    error,
    getAttribute,
    createAttribute,
    updateAttribute,
    deleteAttribute,
  }
}
