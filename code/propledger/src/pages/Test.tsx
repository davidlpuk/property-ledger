import { useState } from "react"

export default function TestPage() {
    const [count, setCount] = useState(0)

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header 1 - Black */}
                <h1 className="text-4xl font-bold text-black mb-4">Header 1</h1>

                {/* Header 1 - Green */}
                <h1 className="text-4xl font-bold text-[#149B5C] mb-4">Header 1</h1>

                {/* Image */}
                <div className="w-[572px] h-[381.33px] bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-500">Image (572 x 381.33)</span>
                </div>

                {/* Counter Section */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <p className="text-lg mb-4">Counter: {count}</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCount(count + 1)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Increment
                        </button>
                        <button
                            onClick={() => setCount(count - 1)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Decrement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
