import { useState } from "react"
import Select from "@/app/components/ui/Select"

interface AttributeTypeSelectorProps {
  value: string
  onChange: (type: string) => void
  disabled?: boolean
}

export default function AttributeTypeSelector({
  value,
  onChange,
  disabled = false,
}: AttributeTypeSelectorProps) {
  const typeOptions = [
    { value: "short_text", label: "Short Text (< 50 characters)" },
    { value: "long_text", label: "Long Text" },
    { value: "rich_text", label: "Rich Text (HTML)" },
    { value: "number", label: "Number" },
    { value: "single_select", label: "Single Select" },
    { value: "multiple_select", label: "Multiple Select" },
    { value: "measure", label: "Measure (with unit)" },
  ]

  const [selectedType, setSelectedType] = useState(value)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value
    setSelectedType(newType)
    onChange(newType)
  }

  return (
    <div>
      <Select
        label="Attribute Type"
        options={typeOptions}
        value={selectedType}
        onChange={handleChange}
        disabled={disabled}
        helperText="The data type determines how the attribute will be stored and displayed"
      />

      <div className="mt-3 text-sm text-gray-500">
        {selectedType === "short_text" && (
          <p>
            Short text attributes are limited to 50 characters and are suitable
            for names, codes, or brief descriptions.
          </p>
        )}
        {selectedType === "long_text" && (
          <p>
            Long text attributes can store extended descriptions or detailed
            information without HTML formatting.
          </p>
        )}
        {selectedType === "rich_text" && (
          <p>
            Rich text attributes support HTML formatting for styled content like
            product descriptions.
          </p>
        )}
        {selectedType === "number" && (
          <p>
            Number attributes store numeric values that can be used for
            calculations and comparisons.
          </p>
        )}
        {selectedType === "single_select" && (
          <p>
            Single select attributes allow choosing one option from a predefined
            list of values.
          </p>
        )}
        {selectedType === "multiple_select" && (
          <p>
            Multiple select attributes allow choosing multiple options from a
            predefined list.
          </p>
        )}
        {selectedType === "measure" && (
          <p>Measure attributes store a numeric value with a unit</p>
        )}
      </div>
    </div>
  )
}
