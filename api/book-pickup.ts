import { createClient } from '@supabase/supabase-js'

function generateTrackingNumber(): string {
  let digits = ''
  for (let i = 0; i < 13; i++) digits += Math.floor(Math.random() * 10).toString()
  return `OMC${digits}`
}

async function findOrCreateCustomer(
  supabase: ReturnType<typeof createClient>,
  name: string, phone: string, email: string | null,
): Promise<string | null> {
  if (!phone) return null
  const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).maybeSingle()
  if (existing) {
    // Same customer booking again — update their details rather than
    // creating a duplicate contact card
    await supabase.from('customers').update({ name, email: email || null }).eq('id', existing.id)
    return existing.id as string
  }
  const { data: created } = await supabase.from('customers').insert({ name, phone, email: email || null }).select()
  return created?.[0]?.id ?? null
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    senderName, senderPhone, senderEmail,
    recipientName, recipientPhone, recipientEmail,
    pickupAddress, pickupLat, pickupLng,
    destinationAddress, destinationLat, destinationLng, destinationGps,
    cbmMode, directCbm, lengthCm, widthCm, heightCm, weightKg, boxCount,
    packageDescription, declaredValue,
  } = req.body ?? {}

  if (!senderName || !senderPhone || !recipientName || !pickupAddress) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  )

  const { data: pricingRow } = await supabase.from('pricing_settings').select('*').eq('id', 1).maybeSingle()
  const pricePerCbm = pricingRow?.price_per_cbm ?? 50
  const includedKgPerCbm = pricingRow?.included_kg_per_cbm ?? 100
  const extraKgRate = pricingRow?.extra_kg_rate ?? 2

  const l = parseFloat(lengthCm) || 0
  const w = parseFloat(widthCm) || 0
  const h = parseFloat(heightCm) || 0
  const weight = parseFloat(weightKg) || 0
  const cbm = cbmMode === 'direct' ? (parseFloat(directCbm) || 0) : (l && w && h ? (l * w * h) / 1_000_000 : 0)

  const baseCharge = cbm * pricePerCbm
  const allowance = cbm * includedKgPerCbm
  const excessWeight = Math.max(0, weight - allowance)
  const excessCharge = excessWeight * extraKgRate
  const totalCharge = baseCharge + excessCharge

  const trackingNumber = generateTrackingNumber()

  const [senderCustomerId, recipientCustomerId] = await Promise.all([
    findOrCreateCustomer(supabase, senderName, senderPhone, senderEmail),
    findOrCreateCustomer(supabase, recipientName, recipientPhone, recipientEmail),
  ])

  const { data: inserted, error } = await supabase.from('shipments').insert({
    tracking_number: trackingNumber,
    sender_name: senderName, sender_phone: senderPhone, sender_email: senderEmail || null,
    recipient_name: recipientName, recipient_phone: recipientPhone || null, recipient_email: recipientEmail || null,
    pickup_location: pickupAddress,
    pickup_lat: pickupLat ?? null, pickup_lng: pickupLng ?? null,
    destination_address: destinationAddress || null,
    destination_lat: destinationLat ?? null, destination_lng: destinationLng ?? null,
    destination_gps: destinationGps || null,
    package_description: packageDescription || null,
    length_cm: l || null, width_cm: w || null, height_cm: h || null,
    weight_kg: weight || null, cbm: cbm || null, cbm_entry_mode: cbmMode === 'direct' ? 'direct' : 'dimensions',
    box_count: parseInt(boxCount) || 1,
    declared_value_ghs: parseFloat(declaredValue) || null,
    price_per_cbm: pricePerCbm, included_kg_per_cbm: includedKgPerCbm, extra_kg_rate: extraKgRate,
    total_charge: totalCharge || null,
    status: 'pending', source: 'customer_web',
    sender_customer_id: senderCustomerId, recipient_customer_id: recipientCustomerId,
  }).select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ trackingNumber, id: inserted?.[0]?.id, totalCharge })
}
