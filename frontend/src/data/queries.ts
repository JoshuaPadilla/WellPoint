import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ApiError, api } from '../lib/api'
import {
  alertSchema,
  authUserSchema,
  barangayDetailSchema,
  communityReportSchema,
  communitySchema,
  metricsSchema,
  publicBarangaySchema,
  publicStatusSchema,
  statusItemSchema,
  waterSourceSchema,
} from './schemas'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return authUserSchema.parse(await api('/auth/me'))
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null
        }
        throw err
      }
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useMetrics(enabled = true) {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => metricsSchema.parse(await api('/metrics')),
    enabled,
  })
}

export function useStatus(enabled = true) {
  return useQuery({
    queryKey: ['status'],
    queryFn: async () => z.array(statusItemSchema).parse(await api('/status')),
    enabled,
  })
}

export function useAlerts(enabled = true) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => z.array(alertSchema).parse(await api('/alerts')),
    enabled,
  })
}

export function useSources(enabled = true) {
  return useQuery({
    queryKey: ['sources'],
    queryFn: async () =>
      z.array(waterSourceSchema).parse(await api('/sources')),
    enabled,
  })
}

export function useBarangays(enabled = true) {
  return useQuery({
    queryKey: ['barangays'],
    queryFn: async () =>
      z.array(communitySchema).parse(await api('/barangays')),
    enabled,
  })
}

export function useBarangay(id: string | undefined) {
  return useQuery({
    queryKey: ['barangay', id],
    queryFn: async () =>
      barangayDetailSchema.parse(await api(`/barangays/${id}`)),
    enabled: Boolean(id),
  })
}

export function usePublicBarangay(id: string | undefined) {
  return useQuery({
    queryKey: ['barangay-public', id],
    queryFn: async () =>
      publicStatusSchema.parse(await api(`/barangays/${id}/public`)),
    enabled: Boolean(id),
  })
}

export function usePublicBarangays() {
  return useQuery({
    queryKey: ['barangays-public'],
    queryFn: async () =>
      z.array(publicBarangaySchema).parse(await api('/barangays/public')),
  })
}

export function useReports(enabled = true) {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () =>
      z.array(communityReportSchema).parse(await api('/reports')),
    enabled,
  })
}
