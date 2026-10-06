import type {
  AccessState,
  AlertSeverity,
  StatusBand,
  VulnerabilityTier,
} from '../data/schemas'

export const accessStateLabel: Record<AccessState, string> = {
  served: 'Served',
  partial: 'Partial',
  underserved: 'Underserved',
}

export const accessStateColor: Record<AccessState, string> = {
  served: '#16a34a',
  partial: '#d97706',
  underserved: '#dc2626',
}

export const bandLabel: Record<StatusBand, string> = {
  secure: 'Secure',
  watch: 'Watch',
  critical: 'Critical',
}

export const bandColor: Record<StatusBand, string> = {
  secure: '#16a34a',
  watch: '#d97706',
  critical: '#dc2626',
}

export const severityBadge: Record<AlertSeverity, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}

export const tierLabel: Record<VulnerabilityTier, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const tierBadge: Record<VulnerabilityTier, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
}

export const roleLabel: Record<string, string> = {
  'water-officer': 'Water Officer',
  'drrm-officer': 'DRRM Officer',
  'barangay-official': 'Barangay Official',
  resident: 'Resident',
  'barangay-admin': 'Barangay Admin',
}
