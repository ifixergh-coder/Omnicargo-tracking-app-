export function maskName(name: string): string {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + '***'
}

export function maskPhone(phone: string | null): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 2) return '**'
  const last2 = digits.slice(-2)
  return '*'.repeat(Math.max(digits.length - 2, 4)) + last2
}
