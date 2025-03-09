import { UserCircleIcon, BellIcon } from "@heroicons/react/24/outline"
import Button from "../ui/Button"

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          Product Management System
        </h1>
        <div className="flex items-center space-x-4">
          {/* <button className="text-gray-500 hover:text-gray-700">
            <BellIcon className="h-6 w-6" />
          </button> */}
          <Button className="text-gray-500 hover:text-gray-700">
            <BellIcon className="h-6 w-6" />
          </Button>
          <button className="flex items-center text-gray-700 hover:text-gray-900">
            <UserCircleIcon className="h-6 w-6 mr-2" />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  )
}
