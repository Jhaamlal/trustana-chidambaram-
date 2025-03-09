// Types of confidence metrics
type ConfidenceMetric =
  | "contextual_match" // How well the value matches the context
  | "format_validity" // Whether the value format is valid
  | "source_reliability" // Reliability of the source information
  | "llm_confidence" // LLM's reported confidence

// Confidence score calculation for different attribute types
export function calculateConfidence(
  attributeType: string,
  value: any,
  metrics: Record<ConfidenceMetric, number>
): number {
  // Base weights for different metrics
  const weights: Record<string, Record<ConfidenceMetric, number>> = {
    default: {
      contextual_match: 0.4,
      format_validity: 0.3,
      source_reliability: 0.2,
      llm_confidence: 0.1,
    },
    // For short text, format is less important than context
    short_text: {
      contextual_match: 0.5,
      format_validity: 0.2,
      source_reliability: 0.2,
      llm_confidence: 0.1,
    },
    // For rich text, format validity is more important
    rich_text: {
      contextual_match: 0.3,
      format_validity: 0.4,
      source_reliability: 0.2,
      llm_confidence: 0.1,
    },
    // For numbers and measures, format validity is critical
    number: {
      contextual_match: 0.3,
      format_validity: 0.5,
      source_reliability: 0.1,
      llm_confidence: 0.1,
    },
    measure: {
      contextual_match: 0.3,
      format_validity: 0.5,
      source_reliability: 0.1,
      llm_confidence: 0.1,
    },
    // For select types, contextual match is most important
    single_select: {
      contextual_match: 0.6,
      format_validity: 0.2,
      source_reliability: 0.1,
      llm_confidence: 0.1,
    },
    multiple_select: {
      contextual_match: 0.6,
      format_validity: 0.2,
      source_reliability: 0.1,
      llm_confidence: 0.1,
    },
  }

  // Get the appropriate weights for this attribute type
  const typeWeights = weights[attributeType] || weights.default

  // Calculate weighted confidence score
  let confidenceScore = 0
  for (const [metric, weight] of Object.entries(typeWeights) as [
    ConfidenceMetric,
    number
  ][]) {
    confidenceScore += (metrics[metric] || 0) * weight
  }

  // Ensure the score is between 0 and 1
  return Math.max(0, Math.min(1, confidenceScore))
}

// Validate format based on attribute type
export function validateFormat(attributeType: string, value: any): number {
  switch (attributeType) {
    case "short_text":
      return typeof value === "string" && value.length <= 50 ? 1 : 0

    case "long_text":
    case "rich_text":
      return typeof value === "string" ? 1 : 0

    case "number":
      return typeof value === "number" ||
        (typeof value === "string" && !isNaN(Number(value)))
        ? 1
        : 0

    case "single_select":
      return typeof value === "string" ? 1 : 0

    case "multiple_select":
      return Array.isArray(value) ? 1 : 0

    case "measure":
      return typeof value === "object" &&
        "v" in value &&
        "u" in value &&
        (typeof value.v === "number" || !isNaN(Number(value.v)))
        ? 1
        : 0

    default:
      return 0.5 // Unknown type, moderate confidence
  }
}
