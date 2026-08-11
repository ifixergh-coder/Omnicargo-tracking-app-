import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) navigate(`/track/${value.trim().toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <span className="w-3 h-3 rounded-full bg-orange" />
          <span className="text-white text-lg font-semibold tracking-wide">OmniCargo Tracking</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-lg">
          <label htmlFor="tracking" className="block text-sm font-medium text-slate mb-2">
            Enter your tracking number
          </label>
          <input
            id="tracking"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="OMC-2026-4F82K1"
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-orange"
          />
          <button
            type="submit"
            className="mt-4 w-full bg-orange text-white font-medium py-3 rounded-md hover:opacity-90 transition"
          >
            Track shipment
          </button>
        </form>
      </div>
    </div>
  )
}
