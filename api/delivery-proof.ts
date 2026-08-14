import { createClient } from '@supabase/supabase-js'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-9) // compare last 9 digits, tolerant of country code prefixes
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { trackingNumber, senderPhone, recipientPhone } = req.body ?? {}
  if (!trackingNumber || !senderPhone || !recipientPhone) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  )

  const { data: shipment } = await supabase
    .from('shipments')
    .select('id, sender_phone, recipient_phone')
    .eq('tracking_number', trackingNumber)
    .maybeSingle()

  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' })
  }

  const senderMatch = shipment.sender_phone && normalizePhone(shipment.sender_phone) === normalizePhone(senderPhone)
  const recipientMatch = shipment.recipient_phone && normalizePhone(shipment.recipient_phone) === normalizePhone(recipientPhone)

  if (!senderMatch || !recipientMatch) {
    return res.status(403).json({ error: 'Phone numbers do not match our records' })
  }

  const { data: proof } = await supabase
    .from('delivery_proofs')
    .select('photo_path, delivery_type, recipient_note, created_at')
    .eq('shipment_id', shipment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!proof) {
    return res.status(404).json({ error: 'No delivery photo on file for this shipment' })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('delivery-proofs')
    .createSignedUrl(proof.photo_path, 600) // link valid for 10 minutes

  if (signError || !signed) {
    return res.status(500).json({ error: 'Could not generate photo link' })
  }

  return res.status(200).json({
    url: signed.signedUrl,
    deliveryType: proof.delivery_type,
    note: proof.recipient_note,
    createdAt: proof.created_at,
  })
}
