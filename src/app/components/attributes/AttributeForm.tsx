import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Select from "@/app/components/ui/Select"
import Button from "@/app/components/ui/Button"
import { Attribute, AttributeType } from "@/app/types/attribute"
import Input from "../ui/Input"

interface AttributeFormProps {
  onSubmit: (attribute: Omit<Attribute, "_id">) => Promise<void>
  initialValues?: Attribute
  isEditing?: boolean
}

export default function AttributeForm({
  onSubmit,
  initialValues,
  isEditing = false,
}: AttributeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [type, setType] = useState("short_text")
  const [description, setDescription] = useState("")
  const [required, setRequired] = useState(false)
  const [searchable, setSearchable] = useState(true)
  const [maxLength, setMaxLength] = useState<number | undefined>(50)
  const [options, setOptions] = useState<string[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [newUnit, setNewUnit] = useState("")

  // Load initial values if editing
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name)
      setDisplayName(initialValues.displayName)
      setType(initialValues.type)
      setDescription(initialValues.description || "")
      setRequired(initialValues.required || false)
      setSearchable(initialValues.searchable || true)
      setMaxLength(initialValues.maxLength)
      setOptions(initialValues.options || [])
      setUnits(initialValues.units || [])
    }
  }, [initialValues])

  // Attribute type options
  const typeOptions = [
    { value: "short_text", label: "Short Text" },
    { value: "long_text", label: "Long Text" },
    { value: "rich_text", label: "Rich Text (HTML)" },
    { value: "number", label: "Number" },
    { value: "single_select", label: "Single Select" },
    { value: "multiple_select", label: "Multiple Select" },
    { value: "measure", label: "Measure" },
  ]

  const handleAddOption = () => {
    if (newOption && !options.includes(newOption)) {
      setOptions([...options, newOption])
      setNewOption("")
    }
  }

  const handleRemoveOption = (option: string) => {
    setOptions(options.filter((o) => o !== option))
  }

  const handleAddUnit = () => {
    if (newUnit && !units.includes(newUnit)) {
      setUnits([...units, newUnit])
      setNewUnit("")
    }
  }

  const handleRemoveUnit = (unit: string) => {
    setUnits(units.filter((u) => u !== unit))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form
      if (!name || !displayName || !type) {
        throw new Error("Name, display name, and type are required")
      }

      if (
        (type === "single_select" || type === "multiple_select") &&
        options.length === 0
      ) {
        throw new Error("Select attributes must have at least one option")
      }

      if (type === "measure" && units.length === 0) {
        throw new Error("Measure attributes must have at least one unit")
      }

      // Prepare attribute data with the missing properties

      const attributeData: Omit<Attribute, "_id"> = {
        name,
        displayName,
        type: type as AttributeType, // Type assertion here
        description,
        required,
        searchable,
        options:
          type === "single_select" || type === "multiple_select"
            ? options
            : undefined,
        units: type === "measure" ? units : undefined,
        maxLength: type === "short_text" ? maxLength : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Submit the form
      await onSubmit(attributeData)
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the attribute")
      console.error("Form submission error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEditing} // Name cannot be changed when editing
          helperText="Unique identifier for the attribute (cannot be changed later)"
          required
        />

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          helperText="How the attribute will be displayed to users"
          required
        />
      </div>

      <div className="mb-4">
        <Select
          label="Type"
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={isEditing} // Type cannot be changed when editing
          helperText="The data type of this attribute"
          required
        />
      </div>

      <div className="mb-4">
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          helperText="Optional description of this attribute"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
          />
          <label
            htmlFor="required"
            className="text-sm font-medium text-gray-700"
          >
            Required
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="searchable"
            checked={searchable}
            onChange={(e) => setSearchable(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
          />
          <label
            htmlFor="searchable"
            className="text-sm font-medium text-gray-700"
          >
            Searchable
          </label>
        </div>
      </div>

      {/* Type-specific fields */}
      {type === "short_text" && (
        <div className="mb-4">
          <Input
            label="Maximum Length"
            type="number"
            min={1}
            max={50}
            value={maxLength?.toString() || "50"}
            onChange={(e) => setMaxLength(parseInt(e.target.value))}
            helperText="Maximum number of characters (1-50)"
          />
        </div>
      )}

      {(type === "single_select" || type === "multiple_select") && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options
          </label>
          <div className="flex mb-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add new option"
              className="mr-2"
            />
            <Button
              type="button"
              onClick={handleAddOption}
              disabled={!newOption}
            >
              Add
            </Button>
          </div>

          {options.length === 0 ? (
            <p className="text-sm text-red-500">
              At least one option is required
            </p>
          ) : (
            <div className="bg-gray-50 p-3 rounded-md">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center mb-1 last:mb-0"
                >
                  <span className="text-sm">{option}</span>
                  <Button
                    type="button"
                    variant="danger"
                    className="p-1 h-6 w-6 flex items-center justify-center"
                    onClick={() => handleRemoveOption(option)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {type === "measure" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Units
          </label>
          <div className="flex mb-2">
            <Input
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Add new unit (e.g., USD, cm, kg)"
              className="mr-2"
            />
            <Button type="button" onClick={handleAddUnit} disabled={!newUnit}>
              Add
            </Button>
          </div>

          {units.length === 0 ? (
            <p className="text-sm text-red-500">
              At least one unit is required
            </p>
          ) : (
            <div className="bg-gray-50 p-3 rounded-md">
              {units.map((unit, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center mb-1 last:mb-0"
                >
                  <span className="text-sm">{unit}</span>
                  <Button
                    type="button"
                    variant="danger"
                    className="p-1 h-6 w-6 flex items-center justify-center"
                    onClick={() => handleRemoveUnit(unit)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/attributes")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditing ? "Update Attribute" : "Create Attribute"}
        </Button>
      </div>
    </form>
  )
}
