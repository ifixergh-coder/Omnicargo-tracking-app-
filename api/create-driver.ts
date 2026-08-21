import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { driverName, driverPhone, plateNumber, vehicleLabel, email, password, managerToken } = req.body ?? {}

  if (!driverName || !vehicleLabel || !email || !password || !managerToken) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  )

  const { data: callingUser, error: authError } = await supabase.auth.getUser(managerToken)
  if (authError || !callingUser.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const { data: roleRow } = await supabase.from('staff_roles').select('role')
    .eq('user_id', callingUser.user.id).maybeSingle()
  if (roleRow?.role !== 'manager') {
    return res.status(403).json({ error: 'Only managers can create driver accounts' })
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createError || !created.user) {
    return res.status(400).json({ error: createError?.message ?? 'Could not create account' })
  }

  const { data: vehicle, error: vehicleError } = await supabase.from('vehicles').insert({
    label: vehicleLabel,
    driver_name: driverName,
    driver_phone: driverPhone || null,
    plate_number: plateNumber || null,
    tracking_source: 'phone',
    active: true,
    driver_user_id: created.user.id,
  }).select()

  if (vehicleError) {
    await supabase.auth.admin.deleteUser(created.user.id)
    return res.status(400).json({ error: vehicleError.message })
  }

  return res.status(200).json({ userId: created.user.id, vehicleId: vehicle?.[0]?.id })
}
