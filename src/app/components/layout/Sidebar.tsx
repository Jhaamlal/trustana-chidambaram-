"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"

export default function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Products", href: "/products", icon: CubeIcon },
    { name: "Attributes", href: "/attributes", icon: TagIcon },
    { name: "Import", href: "/import", icon: ArrowUpTrayIcon },
  ]

  return (
    <div className="w-64 bg-gray-800 text-white flex-shrink-0 hidden md:block">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <SparklesIcon className="h-8 w-8 text-blue-400" />
        <span className="ml-2 text-xl font-bold">AI Products</span>
      </div>
      <nav className="mt-5">
        <div className="px-2 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-md
                  ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
