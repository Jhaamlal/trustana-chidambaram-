import { useState } from "react"

export function useEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentStatus, setEnrichmentStatus] = useState<{
    jobId: string | null
    status: "idle" | "pending" | "completed" | "failed"
    progress: number
    error: string | null
  }>({
    jobId: null,
    status: "idle",
    progress: 0,
    error: null,
  })

  const enrichProducts = async (
    productIds: string[],
    attributeIds?: string[]
  ) => {
    setIsEnriching(true)
    setEnrichmentStatus({
      jobId: null,
      status: "pending",
      progress: 0,
      error: null,
    })

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds,
          attributeIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start enrichment")
      }

      setEnrichmentStatus({
        jobId: data.jobId,
        status: "pending",
        progress: 10,
        error: null,
      })

      // Start polling for job status
      const jobId = data.jobId
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/enrich/status/${jobId}`)
          const statusData = await statusResponse.json()

          if (!statusResponse.ok) {
            clearInterval(pollInterval)
            throw new Error(
              statusData.error || "Failed to check enrichment status"
            )
          }

          setEnrichmentStatus({
            jobId,
            status: statusData.status,
            progress: statusData.progress,
            error: null,
          })

          if (
            statusData.status === "completed" ||
            statusData.status === "failed"
          ) {
            clearInterval(pollInterval)
            setIsEnriching(false)
          }
        } catch (err: any) {
          clearInterval(pollInterval)
          setEnrichmentStatus((prev) => ({
            ...prev,
            status: "failed",
            error: err.message || "Failed to check enrichment status",
          }))
          setIsEnriching(false)
        }
      }, 2000)

      return data
    } catch (err: any) {
      setEnrichmentStatus({
        jobId: null,
        status: "failed",
        progress: 0,
        error: err.message || "An error occurred during enrichment",
      })
      setIsEnriching(false)
      throw err
    }
  }

  return {
    enrichProducts,
    isEnriching,
    enrichmentStatus,
  }
}
