import Link from "next/link"
import { ArrowRightIcon } from "@heroicons/react/24/outline"

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Product Management System</h1>
        <p className="text-gray-600 mb-8">
          Welcome to the Product Management System with AI Enrichment. This
          platform allows you to import products, define custom attributes, and
          use AI to automatically enrich your product information.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-xl font-semibold mb-3">Import Products</h2>
            <p className="text-gray-600 mb-4">
              Import your product data from CSV or Excel files to get started.
            </p>
            <Link
              href="/import"
              className="flex items-center text-blue-600 font-medium"
            >
              Go to Import <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h2 className="text-xl font-semibold mb-3">Manage Attributes</h2>
            <p className="text-gray-600 mb-4">
              Define custom attributes to store additional product information.
            </p>
            <Link
              href="/attributes"
              className="flex items-center text-purple-600 font-medium"
            >
              Go to Attributes <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
            <h2 className="text-xl font-semibold mb-3">View Products</h2>
            <p className="text-gray-600 mb-4">
              Browse, filter, and enrich your product catalog.
            </p>
            <Link
              href="/products"
              className="flex items-center text-amber-600 font-medium"
            >
              Go to Products <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-3">AI Enrichment</h2>
          <p className="text-gray-600 mb-4">
            Our AI enrichment engine can automatically populate product
            attributes using advanced machine learning techniques. Simply select
            products from the product list and click the &quot;Enrich&quot;
            button to get started.
          </p>
          <Link href="/products" className="btn-primary inline-block">
            Enrich Products
          </Link>
        </div>
      </div>
    </div>
  )
}
