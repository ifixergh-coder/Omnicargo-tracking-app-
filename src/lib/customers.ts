import { supabase } from './supabase'

export async function findOrCreateCustomer(name: string, phone: string, email: string): Promise<string | null> {
  if (!name.trim()) return null

  if (phone.trim()) {
    const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone.trim()).maybeSingle()
    if (existing) return existing.id
  }

  const { data: created, error } = await supabase
    .from('customers')
    .insert({ name: name.trim(), phone: phone.trim() || null, email: email.trim() || null })
    .select()
  if (error || !created?.[0]) return null
  return created[0].id
}
