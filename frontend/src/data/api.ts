import { getState } from '../lib/store'
import { allAlerts, deriveActiveAlerts } from '../lib/alerts'
import { computeMetrics } from '../lib/metrics'
import type { Alert, Metrics, WaterSource } from './types'

async function resolve<T>(value: T): Promise<T> {
  return value
}

export function getStatus() {
  return resolve(getState().statuses)
}

export function getAlerts(): Promise<Alert[]> {
  return resolve(allAlerts(getState()))
}

export function getActiveAlerts(): Promise<Alert[]> {
  return resolve(deriveActiveAlerts(getState()))
}

export function getSources(): Promise<WaterSource[]> {
  return resolve(getState().sources)
}

export function getMetrics(): Promise<Metrics> {
  const state = getState()
  return resolve(computeMetrics(state, deriveActiveAlerts(state)))
}
