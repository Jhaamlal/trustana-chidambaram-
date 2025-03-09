import { Attribute } from "@/app/types/attribute"
import { Product } from "@/app/types/product"

// Validate attribute data
export function validateAttribute(data: Partial<Attribute>): {
  valid: boolean
  error?: string
} {
  // Name is required
  if (!data.name) {
    return { valid: false, error: "Name is required" }
  }

  // Display name is required
  if (!data.displayName) {
    return { valid: false, error: "Display name is required" }
  }

  // Type is required and must be valid
  const validTypes = [
    "short_text",
    "long_text",
    "rich_text",
    "number",
    "single_select",
    "multiple_select",
    "measure",
  ]
  if (!data.type || !validTypes.includes(data.type)) {
    return { valid: false, error: "Valid type is required" }
  }

  // For select types, options are required
  if (
    (data.type === "single_select" || data.type === "multiple_select") &&
    (!data.options || data.options.length === 0)
  ) {
    return { valid: false, error: "Options are required for select attributes" }
  }

  // For measure type, units are required
  if (data.type === "measure" && (!data.units || data.units.length === 0)) {
    return { valid: false, error: "Units are required for measure attributes" }
  }

  return { valid: true }
}

// Validate product data
export function validateProduct(data: Partial<Product>): {
  valid: boolean
  error?: string
} {
  // Name is required
  if (!data.name) {
    return { valid: false, error: "Product name is required" }
  }

  // Validate attributes if present
  if (data.attr && Array.isArray(data.attr)) {
    for (const attr of data.attr) {
      if (!attr.k) {
        return { valid: false, error: "Attribute key is required" }
      }

      // Value can be any type but must be present
      if (attr.v === undefined || attr.v === null) {
        return {
          valid: false,
          error: `Value for attribute ${attr.k} is required`,
        }
      }
    }
  }

  return { valid: true }
}

// Validate import file
export function validateFileType(fileName: string): {
  valid: boolean
  type?: string
  error?: string
} {
  const extension = fileName.split(".").pop()?.toLowerCase()

  if (!extension) {
    return { valid: false, error: "File has no extension" }
  }

  if (extension === "csv") {
    return { valid: true, type: "csv" }
  } else if (["xlsx", "xls"].includes(extension)) {
    return { valid: true, type: "excel" }
  }

  return {
    valid: false,
    error: "Unsupported file type. Please upload CSV or Excel file.",
  }
}
