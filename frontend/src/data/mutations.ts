import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DisruptionReason } from './schemas'

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { type: string; description: string }) =>
      api('/reports', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reports'] })
      void qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useTransitionReport(status: 'acknowledged' | 'resolved') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api(`/reports/${id}/${status === 'acknowledged' ? 'ack' : 'resolve'}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reports'] })
      void qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useSimulate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { type: DisruptionReason; targetSystemId?: string }) =>
      api('/demo/simulate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries()
    },
  })
}

export function useReset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api('/demo/reset', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries()
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries()
    },
  })
}

export function useDevLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) =>
      api('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries()
    },
  })
}

export function signInWithGoogle() {
  window.location.href = '/api/auth/google'
}
