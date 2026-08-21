import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { vehicleId, driverUserId, managerToken } = req.body ?? {}

  if (!vehicleId || !managerToken) {
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
    return res.status(403).json({ error: 'Only managers can delete driver accounts' })
  }

  const { error: vehicleError } = await supabase.from('vehicles').delete().eq('id', vehicleId)
  if (vehicleError) {
    return res.status(400).json({ error: vehicleError.message })
  }

  if (driverUserId) {
    const { error: userError } = await supabase.auth.admin.deleteUser(driverUserId)
    if (userError) {
      return res.status(200).json({ warning: `Vehicle deleted, but login removal failed: ${userError.message}` })
    }
  }

  return res.status(200).json({ success: true })
}
