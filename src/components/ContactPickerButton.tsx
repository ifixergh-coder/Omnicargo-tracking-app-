import { useState, useEffect } from 'react'

type Props = {
  onSelect: (name: string, phone: string) => void
}

declare global {
  interface Navigator {
    contacts?: {
      select: (properties: string[], options?: { multiple?: boolean }) => Promise<any[]>
      getProperties: () => Promise<string[]>
    }
  }
}

export default function ContactPickerButton({ onSelect }: Props) {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('contacts' in navigator && 'ContactsManager' in window)
  }, [])

  async function pickContact() {
    try {
      const contacts = await navigator.contacts!.select(['name', 'tel'], { multiple: false })
      if (contacts?.[0]) {
        const name = contacts[0].name?.[0] ?? ''
        const phone = contacts[0].tel?.[0] ?? ''
        onSelect(name, phone)
      }
    } catch {
      // user cancelled or picker failed — nothing to do
    }
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={pickContact}
      className="text-xs text-orange underline mb-2"
    >
      Pick from contacts
    </button>
  )
}
