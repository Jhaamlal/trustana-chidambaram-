import { Db, ObjectId } from "mongodb"
import {
  EnrichmentJobStatus,
  EnrichmentStatus,
  EnrichmentResult,
} from "@/app/types/enrichment"

export class EnrichmentRepository {
  private db: Db
  private jobsCollection = "enrichment_jobs"
  private resultsCollection = "enrichment_results"

  constructor(db: Db) {
    this.db = db
  }

  async createEnrichmentJob(
    productIds: string[],
    attributeIds: string[]
  ): Promise<string> {
    const job = {
      productIds,
      attributeIds,
      status: "pending" as EnrichmentStatus,
      progress: 0,
      productsTotal: productIds.length,
      productsProcessed: 0,
      startedAt: new Date(),
      createdAt: new Date(),
    }

    const result = await this.db.collection(this.jobsCollection).insertOne(job)
    return result.insertedId.toString()
  }

  async getEnrichmentJobStatus(
    jobId: string
  ): Promise<EnrichmentJobStatus | null> {
    if (!ObjectId.isValid(jobId)) {
      return null
    }

    const job = await this.db
      .collection(this.jobsCollection)
      .findOne({ _id: new ObjectId(jobId) })

    if (!job) {
      return null
    }

    return {
      jobId: job._id.toString(),
      status: job.status,
      progress: job.progress,
      productsTotal: job.productsTotal,
      productsProcessed: job.productsProcessed,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
    }
  }

  async updateEnrichmentJobStatus(
    jobId: string,
    update: Partial<Omit<EnrichmentJobStatus, "jobId">>
  ): Promise<boolean> {
    if (!ObjectId.isValid(jobId)) {
      return false
    }

    const result = await this.db
      .collection(this.jobsCollection)
      .updateOne({ _id: new ObjectId(jobId) }, { $set: update })

    return result.modifiedCount === 1
  }

  async saveEnrichmentResult(
    jobId: string,
    result: Omit<EnrichmentResult, "_id">
  ): Promise<string> {
    const enrichmentResult = {
      ...result,
      jobId,
      timestamp: new Date(),
    }

    const insertResult = await this.db
      .collection(this.resultsCollection)
      .insertOne(enrichmentResult)
    return insertResult.insertedId.toString()
  }

  async getEnrichmentResultsByJobId(
    jobId: string
  ): Promise<EnrichmentResult[]> {
    const results = await this.db
      .collection(this.resultsCollection)
      .find({ jobId })
      .toArray()

    return results.map((result) => ({
      productId: result.productId,
      enrichedAttributes: result.enrichedAttributes,
      success: result.success,
      error: result.error,
    }))
  }
}
