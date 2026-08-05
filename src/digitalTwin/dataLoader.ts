import { parseTwinSnapshot } from './jsonParser'
import type { TwinSnapshot } from './types'

export const DEFAULT_TWIN_URL = '/data/twin_snapshot.json'

/** Load a twin snapshot from a URL (JSON file or future REST endpoint). */
export async function loadTwinFromUrl(url: string): Promise<TwinSnapshot> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load twin data (${res.status})`)
  const json: unknown = await res.json()
  return parseTwinSnapshot(json)
}

/** Load from a user-selected File (Load JSON control). */
export async function loadTwinFromFile(file: File): Promise<TwinSnapshot> {
  const text = await file.text()
  const json: unknown = JSON.parse(text)
  return parseTwinSnapshot(json)
}
