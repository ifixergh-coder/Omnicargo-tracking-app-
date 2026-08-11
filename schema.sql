-- OmniCargo Tracking Platform — database schema
-- Run this in the Supabase SQL editor for the NEW tracking project
-- (keep this separate from the invoicing app's database)

-- ── Vehicles / couriers ─────────────────────────────────────
-- A truck, motorbike, or contracted rider. tracking_source tells
-- the app whether to expect updates from hardware or a phone.
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  label text not null,               -- e.g. "Truck 3", "Kojo's bike"
  driver_name text,
  driver_phone text,
  tracking_source text not null default 'phone'
    check (tracking_source in ('hardware','phone')),
  hardware_device_id text,           -- external GPS tracker's device ID, if any
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Partners (e-commerce integrations) ──────────────────────
create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_key text unique not null,      -- generated on partner signup
  webhook_url text,                  -- optional: we POST status changes here
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Shipments ────────────────────────────────────────────────
-- One row per package/shipment. tracking_number is what senders,
-- recipients, and e-commerce partners use to look things up.
create table shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text unique not null,

  -- who it's for
  sender_name text not null,
  sender_phone text,
  sender_email text,
  recipient_name text not null,
  recipient_phone text,
  recipient_email text,

  -- where it's going
  origin_address text,
  destination_address text,

  -- current state
  status text not null default 'pending'
    check (status in ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','cancelled')),

  -- which vehicle/driver is currently assigned
  assigned_vehicle_id uuid references vehicles(id),

  -- who created it: an OmniCargo staff account, or an e-commerce
  -- partner via the public API (nullable partner_id for that case)
  created_by uuid,
  partner_id uuid references partners(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shipments_tracking_number on shipments(tracking_number);
create index idx_shipments_partner on shipments(partner_id);

-- ── Location updates ─────────────────────────────────────────
-- Every ping, from either a hardware tracker or a driver's phone,
-- lands here in the same shape. The map and history don't care
-- which source sent it.
create table location_updates (
  id bigint generated always as identity primary key,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  source text not null check (source in ('hardware','phone')),
  lat double precision not null,
  lng double precision not null,
  heading numeric,                   -- degrees, optional
  speed numeric,                     -- km/h, optional
  recorded_at timestamptz not null default now()
);

create index idx_location_updates_vehicle_time on location_updates(vehicle_id, recorded_at desc);

-- keep only recent history queryable fast; old rows can be archived/pruned later

-- ── Status events ────────────────────────────────────────────
-- The timeline shown to customers: "Picked up", "In transit", etc.
create table status_events (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references shipments(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_status_events_shipment on status_events(shipment_id, created_at);

-- ── Notification log ─────────────────────────────────────────
create table notifications (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references shipments(id) on delete cascade,
  channel text not null check (channel in ('sms','whatsapp','email')),
  recipient_type text not null check (recipient_type in ('sender','recipient')),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  created_at timestamptz not null default now()
);

-- ── Realtime ─────────────────────────────────────────────────
-- Enable Realtime on these two so the customer tracking page and
-- driver map update live without polling.
alter publication supabase_realtime add table location_updates;
alter publication supabase_realtime add table status_events;

-- ── updated_at trigger for shipments ─────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_shipments_updated_at
before update on shipments
for each row execute function set_updated_at();
