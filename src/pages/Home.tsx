import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicNav from '../components/PublicNav'

export default function Home() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) navigate(`/track/${value.trim().toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <div className="bg-navy px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-3">Fast, reliable delivery across Ghana</h1>
        <p className="text-white/70 max-w-md mx-auto mb-8">
          Book a pickup, calculate your cost, or track a shipment already on its way.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/book-pickup" className="bg-orange text-white font-medium px-6 py-3 rounded-md">
            Book a pickup
          </Link>
          <Link to="/calculator" className="bg-white text-navy font-medium px-6 py-3 rounded-md">
            Calculate cost
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-lg">
          <label htmlFor="tracking" className="block text-sm font-medium text-slate mb-2">
            Track a shipment
          </label>
          <input
            id="tracking"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="OMC8806890329144"
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-navy font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-orange"
          />
          <button
            type="submit"
            className="mt-4 w-full bg-navy text-white font-medium py-3 rounded-md hover:opacity-90 transition"
          >
            Track shipment
          </button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 text-center text-slate">
        <p>[More about OmniCargo's services and coverage can go here.]</p>
      </div>
    </div>
  )
}
