export const STATUS_OPTIONS = [
  'pending', 'picked_up', 'in_transit', 'arrived_at_facility', 'out_for_delivery', 'delivered', 'failed', 'cancelled',
]

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Delivery information received — arranging pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  arrived_at_facility: 'Arrived at sort facility',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery failed',
  cancelled: 'Cancelled',
}
