import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/lib/mongodb"
import { EnrichmentService } from "@/app/infrastructure/ai/enrichment-service"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const client = await connectToDatabase()
    const enrichmentService = new EnrichmentService(client)

    // Get job status
    const status = await enrichmentService.getJobStatus(jobId)

    if (!status) {
      return NextResponse.json(
        { error: "Enrichment job not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(status)
  } catch (error: any) {
    console.error("Error fetching enrichment status:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrichment status", message: error.message },
      { status: 500 }
    )
  }
}
