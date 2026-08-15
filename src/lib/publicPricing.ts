import { supabase } from './supabase'

export type PricingSettings = {
  price_per_cbm: number
  included_kg_per_cbm: number
  extra_kg_rate: number
}

export async function getPublicPricing(): Promise<PricingSettings> {
  const { data } = await supabase.from('pricing_settings').select('*').eq('id', 1).maybeSingle()
  return {
    price_per_cbm: data?.price_per_cbm ?? 50,
    included_kg_per_cbm: data?.included_kg_per_cbm ?? 100,
    extra_kg_rate: data?.extra_kg_rate ?? 2,
  }
}
