# OmniCargo Tracking Platform

Standalone app (separate from the invoicing app) for generating tracking
numbers and letting customers watch their shipment move on a live map.

## What's built so far (MVP core)

- `schema.sql` — full database schema: shipments, vehicles, location
  updates (hardware or phone, same table), status timeline, partners
  (for the future e-commerce plugin), notification log.
- `/` — enter a tracking number
- `/track/:trackingNumber` — customer view: live map + status timeline
- `/driver` — a driver picks their vehicle and shares phone GPS
  (fallback source for vehicles without hardware trackers)

Not built yet: staff-facing screen to create shipments/assign vehicles,
SMS/WhatsApp/email notifications, hardware GPS device integration, and
the public e-commerce API. These are the natural next steps.

## Setup

1. **Create a new Supabase project** (separate from the invoicing app's
   project) at supabase.com.
2. Open the SQL editor in that project and run everything in
   `schema.sql`.
3. Get a free Mapbox account at mapbox.com and copy your access token.
4. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase → Project
     Settings → API)
   - `VITE_MAPBOX_TOKEN`
5. Push this project to a new GitHub repo, then deploy it on Vercel the
   same way the invoicing app is deployed — add the same three
   environment variables in Vercel's project settings.

## Trying it out

Once deployed, add a row to `vehicles` (tracking_source = 'phone') and a
row to `shipments` with that vehicle's id as `assigned_vehicle_id`, then
open `/driver` on a phone to start sharing location, and `/track/<the
tracking number>` on another device to watch it move live.
