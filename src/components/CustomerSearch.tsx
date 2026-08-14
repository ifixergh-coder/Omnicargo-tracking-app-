import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type Customer = { id: string; name: string; phone: string | null; email: string | null }

type Props = {
  label: string
  name: string
  phone: string
  email: string
  onChangeName: (v: string) => void
  onChangePhone: (v: string) => void
  onChangeEmail: (v: string) => void
  selectedCustomer: Customer | null
  onSelectCustomer: (c: Customer | null) => void
}

export default function CustomerSearch({
  label, name, phone, email,
  onChangeName, onChangePhone, onChangeEmail,
  selectedCustomer, onSelectCustomer,
}: Props) {
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

  function selectCustomer(c: Customer) {
    onSelectCustomer(c)
    onChangeName(c.name)
    onChangePhone(c.phone ?? '')
    onChangeEmail(c.email ?? '')
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function clearSelection() {
    onSelectCustomer(null)
    onChangeName('')
    onChangePhone('')
    onChangeEmail('')
  }

  if (selectedCustomer) {
    return (
      <div className="mb-2 bg-orange/10 border border-orange rounded-md px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy">{selectedCustomer.name}</p>
          <p className="text-xs text-slate">{selectedCustomer.phone} {selectedCustomer.email && `· ${selectedCustomer.email}`}</p>
        </div>
        <button type="button" onClick={clearSelection} className="text-xs text-orange underline shrink-0 ml-3">
          Change
        </button>
      </div>
    )
  }

  return (
    <div>
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
                onClick={() => selectCustomer(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
              >
                <p className="font-medium text-navy">{c.name}</p>
                <p className="text-xs text-slate">{c.phone} {c.email && `· ${c.email}`}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate mb-1">Or enter a new {label.toLowerCase()}:</p>
      <input placeholder={`${label} name`} value={name} onChange={e => onChangeName(e.target.value)} required className="w-full border rounded-md px-3 py-2 mb-2" />
      <input placeholder={`${label} phone`} value={phone} onChange={e => onChangePhone(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-2" />
      <input placeholder={`${label} email`} value={email} onChange={e => onChangeEmail(e.target.value)} className="w-full border rounded-md px-3 py-2" />
    </div>
  )
}
