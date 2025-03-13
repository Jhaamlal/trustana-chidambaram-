import { useState } from "react"
import Button from "@/app/components/ui/Button"
import { SparklesIcon } from "@heroicons/react/24/outline"

interface EnrichmentButtonProps {
  selectedProducts: string[]
  onEnrichmentComplete: () => void
  disabled?: boolean
}

export default function EnrichmentButton({
  selectedProducts,
  onEnrichmentComplete,
  disabled = false,
}: EnrichmentButtonProps) {
  const [isEnriching, setIsEnriching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnrich = async () => {
    if (selectedProducts.length === 0) return

    setIsEnriching(true)
    setError(null)

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage =
          data.message || data.error || "Failed to start enrichment process"
        console.error("Enrichment API error:", errorMessage)
        throw new Error(errorMessage)
      }

      // Show success message
      alert(
        `Enrichment started for ${selectedProducts.length} product${
          selectedProducts.length > 1 ? "s" : ""
        }. Job ID: ${data.jobId}`
      )

      // Call the completion handler
      onEnrichmentComplete()
    } catch (err: any) {
      setError(err.message || "An error occurred during enrichment")
      console.error("Enrichment error:", err)
    } finally {
      setIsEnriching(false)
    }
  }

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleEnrich}
        disabled={disabled || isEnriching}
        isLoading={isEnriching}
        className="flex items-center"
      >
        <SparklesIcon className="w-5 h-5 mr-1" />
        Enrich{" "}
        {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ""}
      </Button>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  )
}
