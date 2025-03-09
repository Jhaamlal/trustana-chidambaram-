import Link from "next/link"
import Button from "@/app/components/ui/Button"
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import { Attribute } from "@/app/types/attribute"

interface AttributeListProps {
  attributes: Attribute[]
  loading: boolean
  error: string | null
  onDelete: (attributeId: string) => void
  deleteInProgress: boolean
}

export default function AttributeList({
  attributes,
  loading,
  error,
  onDelete,
  deleteInProgress,
}: AttributeListProps) {
  // Helper function to get readable type name
  const getTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      short_text: "Short Text",
      long_text: "Long Text",
      rich_text: "Rich Text",
      number: "Number",
      single_select: "Single Select",
      multiple_select: "Multiple Select",
      measure: "Measure",
    }

    return typeMap[type] || type
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-10">
          <p>Loading attributes...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      ) : attributes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No attributes found. Create your first attribute to get started.
          </p>
          <Link
            href="/attributes/new"
            className="btn-primary inline-block mt-4"
          >
            Create Attribute
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Display Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Required
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attributes.map((attribute) => (
                <tr key={attribute._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {attribute.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {attribute.displayName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {getTypeName(attribute.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {attribute.required ? "Yes" : "No"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/attributes/${attribute._id}`}>
                        <Button variant="secondary" className="p-1">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        className="p-1"
                        onClick={() => onDelete(attribute._id)}
                        disabled={deleteInProgress}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
