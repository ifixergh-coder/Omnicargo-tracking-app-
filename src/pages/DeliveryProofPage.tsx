import { useState } from 'react'
import { useParams } from 'react-router-dom'

type ProofResult = {
  url: string
  deliveryType: string
  note: string | null
  createdAt: string
}

export default function DeliveryProofPage() {
  const { trackingNumber } = useParams()
  const [senderPhone, setSenderPhone] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProofResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/delivery-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, senderPhone, recipientPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
      } else {
        setResult(data)
      }
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-orange" />
          <span className="font-semibold text-navy">Delivery photo</span>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-slate mb-4">
              To protect this delivery's privacy, enter both the sender's and your (recipient's) phone number as they were given when this shipment was created.
            </p>
            <input
              placeholder="Sender's phone number"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-3 mb-3"
            />
            <input
              placeholder="Your (recipient's) phone number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-3 mb-3"
            />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-orange text-white font-medium py-3 rounded-md disabled:opacity-50">
              {loading ? 'Checking…' : 'View photo'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <img src={result.url} alt="Delivery proof" className="w-full rounded-md border mb-3" />
            <p className="text-sm text-slate mb-1">
              {result.deliveryType === 'handed_to_person' ? 'Handed to person' : 'Left at location'}
            </p>
            {result.note && <p className="text-sm text-slate mb-1">Note: {result.note}</p>}
            <p className="text-xs text-slate mb-4">{new Date(result.createdAt).toLocaleString()}</p>
            <a
              href={result.url}
              download
              className="block text-center bg-navy text-white font-medium py-3 rounded-md"
            >
              Download photo
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
