import { useState, useEffect } from "react"
import Input from "@/app/components/ui/Input"
import Select from "@/app/components/ui/Select"
import Button from "@/app/components/ui/Button"
import { Attribute } from "@/app/types/attribute"

interface ProductFiltersProps {
  attributes: Attribute[]
  filters: Record<string, any>
  onFilterChange: (filters: Record<string, any>) => void
  loading: boolean
}

export default function ProductFilters({
  attributes,
  filters,
  onFilterChange,
  loading,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filters)
  const [searchQuery, setSearchQuery] = useState<string>(filters._search || "")

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
    setSearchQuery(filters._search || "")
  }, [filters])

  const handleFilterChange = (attributeName: string, value: any) => {
    const newFilters = {
      ...localFilters,
      [attributeName]: value,
    }

    if (
      value === "" ||
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[attributeName]
    }

    setLocalFilters(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleApplyFilters = () => {
    // Include search query in filters if provided
    const filtersWithSearch = {
      ...localFilters,
    }

    if (searchQuery) {
      filtersWithSearch._search = searchQuery
    } else if (filtersWithSearch._search) {
      delete filtersWithSearch._search
    }

    onFilterChange(filtersWithSearch)
  }

  const handleClearFilters = () => {
    setLocalFilters({})
    setSearchQuery("")
    onFilterChange({})
  }

  // Render filter control based on attribute type
  const renderFilterControl = (attribute: Attribute) => {
    switch (attribute.type) {
      case "short_text":
      case "long_text":
      case "rich_text":
        return (
          <Input
            type="text"
            placeholder={`Filter by ${attribute.displayName}`}
            value={localFilters[attribute.name] || ""}
            onChange={(e) => handleFilterChange(attribute.name, e.target.value)}
          />
        )

      case "number":
        return (
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              className="w-1/2"
              value={localFilters[attribute.name]?.min || ""}
              onChange={(e) =>
                handleFilterChange(attribute.name, {
                  ...localFilters[attribute.name],
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Input
              type="number"
              placeholder="Max"
              className="w-1/2"
              value={localFilters[attribute.name]?.max || ""}
              onChange={(e) =>
                handleFilterChange(attribute.name, {
                  ...localFilters[attribute.name],
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        )

      case "single_select":
        return (
          <Select
            options={[
              { value: "", label: `All ${attribute.displayName}` },
              ...(attribute.options || []).map((option) => ({
                value: option,
                label: option,
              })),
            ]}
            value={localFilters[attribute.name] || ""}
            onChange={(e) => handleFilterChange(attribute.name, e.target.value)}
          />
        )

      case "multiple_select":
        return (
          <Select
            multiple
            options={(attribute.options || []).map((option) => ({
              value: option,
              label: option,
            }))}
            value={localFilters[attribute.name] || []}
            onChange={(e) => {
              const values = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              )
              handleFilterChange(attribute.name, values)
            }}
          />
        )

      case "measure":
        return (
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Value"
              className="w-2/3"
              value={localFilters[attribute.name]?.value || ""}
              onChange={(e) =>
                handleFilterChange(attribute.name, {
                  ...localFilters[attribute.name],
                  value: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Select
              className="w-1/3"
              options={[
                { value: "", label: "Unit" },
                ...(attribute.units || []).map((unit) => ({
                  value: unit,
                  label: unit,
                })),
              ]}
              value={localFilters[attribute.name]?.unit || ""}
              onChange={(e) =>
                handleFilterChange(attribute.name, {
                  ...localFilters[attribute.name],
                  unit: e.target.value,
                })
              }
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-4">
          <p>Loading attributes...</p>
        </div>
      ) : (
        <>
          {/* Vector Search Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Search Products
            </label>
            <div className="flex">
              <Input
                type="text"
                placeholder="Search for products by description..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-grow"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use natural language to find similar products
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {attributes.map((attribute) => (
              <div key={attribute._id} className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {attribute.displayName}
                </label>
                {renderFilterControl(attribute)}
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button variant="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
