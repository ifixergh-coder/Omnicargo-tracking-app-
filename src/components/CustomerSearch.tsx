import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type Customer = { id: string; name: string; phone: string | null; email: string | null }

export default function CustomerSearch({ onSelect, label }: { onSelect: (c: Customer) => void; label: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (query.trim().length < 2) { setResults([]); return }
    timeoutRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(5)
      setResults((data as Customer[]) ?? [])
    }, 300)
  }, [query])

  return (
    <div className="relative mb-2">
      <input
        placeholder={`Search existing ${label.toLowerCase()} (name or phone)`}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="w-full border rounded-md px-3 py-2 text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-md shadow-md mt-1">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); setQuery(''); setResults([]); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
            >
              <p className="font-medium text-navy">{c.name}</p>
              <p className="text-xs text-slate">{c.phone} {c.email && `· ${c.email}`}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
