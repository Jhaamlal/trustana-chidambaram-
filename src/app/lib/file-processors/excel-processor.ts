import * as XLSX from "xlsx"
import { Product } from "@/app/types/product"

export async function processExcelFile(
  fileUrl: string
): Promise<Omit<Product, "_id">[]> {
  try {
    // Fetch the Excel file
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    // Parse Excel data
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[worksheetName]

    // Convert to JSON
    const records = XLSX.utils.sheet_to_json(worksheet)

    // Transform Excel records to product objects
    const products: Omit<Product, "_id">[] = records.map((record: any) => {
      // Extract basic product information
      const product: Omit<Product, "_id"> = {
        name: record.name || record.product_name || record.title || "",
        brand: record.brand || "",
        barcode: record.barcode || record.sku || record.product_code || "",
        images: [],
        importedAt: new Date(), // Set import date to current time
        enriched: false, // New products start as not enriched
      }

      // Handle images (could be comma-separated URLs)
      if (record.images) {
        product.images = String(record.images)
          .split(",")
          .map((url: string) => url.trim())
      } else if (record.image) {
        product.images = [String(record.image).trim()]
      }

      // Extract any additional fields as attributes
      const attr: { k: string; v: any; u?: string }[] = []
      for (const [key, value] of Object.entries(record)) {
        // Skip the basic fields we've already processed
        if (
          [
            "name",
            "product_name",
            "title",
            "brand",
            "barcode",
            "sku",
            "product_code",
            "images",
            "image",
          ].includes(key)
        ) {
          continue
        }

        // Skip empty values
        if (value === undefined || value === null || value === "") {
          continue
        }

        // Check if it's a measure with unit (e.g., "100 USD")
        if (typeof value === "string") {
          const measureMatch = value.match(/^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)$/)
          if (measureMatch) {
            attr.push({
              k: key,
              v: parseFloat(measureMatch[1]),
              u: measureMatch[2],
            })
            continue
          }
        }

        attr.push({
          k: key,
          v: value,
        })
      }

      if (attr.length > 0) {
        product.attr = attr
      }

      return product
    })

    return products
  } catch (error) {
    console.error("Error processing Excel file:", error)
    throw new Error("Failed to process Excel file")
  }
}
