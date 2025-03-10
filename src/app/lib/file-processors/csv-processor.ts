import { parse } from "csv-parse/sync"
import { Product } from "@/app/types/product"

export async function processCSVFile(
  fileUrl: string
): Promise<Omit<Product, "_id">[]> {
  try {
    // Fetch the CSV file
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.statusText}`)
    }

    const csvText = await response.text()

    // Parse CSV data
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    })

    // Transform CSV records to product objects
    const products: Omit<Product, "_id">[] = records.map((record: any) => {
      // Extract basic product information
      const product: Omit<Product, "_id"> = {
        name:
          record["Product Name"] ||
          record.name ||
          record.product_name ||
          record.title ||
          "",
        brand: record.Brand || record.brand || "",
        barcode:
          record.Barcode ||
          record.barcode ||
          record.sku ||
          record.product_code ||
          "",
        images: [],
        importedAt: new Date(), // Set import date to current time
        enriched: false, // New products start as not enriched
      }

      // Handle images (could be comma-separated URLs)
      if (record.Images || record.images) {
        const imageField = record.Images || record.images
        product.images = imageField.split(",").map((url: string) => url.trim())
      } else if (record.image) {
        product.images = [record.image.trim()]
      }

      // Extract any additional fields as attributes
      const attr: { k: string; v: any; u?: string }[] = []
      for (const [key, value] of Object.entries(record)) {
        // Skip the basic fields we've already processed
        if (
          [
            "Product Name",
            "name",
            "product_name",
            "title",
            "Brand",
            "brand",
            "Barcode",
            "barcode",
            "sku",
            "product_code",
            "Images",
            "images",
            "image",
          ].includes(key)
        ) {
          continue
        }

        // Skip empty values
        if (!value) {
          continue
        }

        // Check if it's a measure with unit (e.g., "100 USD")
        const measureMatch = String(value).match(
          /^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)$/
        )
        if (measureMatch) {
          attr.push({
            k: key,
            v: parseFloat(measureMatch[1]),
            u: measureMatch[2],
          })
        } else {
          attr.push({
            k: key,
            v: value,
          })
        }
      }

      if (attr.length > 0) {
        product.attr = attr
      }

      return product
    })

    return products
  } catch (error) {
    console.error("Error processing CSV file:", error)
    throw new Error("Failed to process CSV file")
  }
}
