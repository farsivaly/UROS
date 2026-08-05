import type { TwinSnapshot } from './types'
import { loadTwinFromFile, loadTwinFromUrl } from './dataLoader'

/**
 * Communication façade — visualization talks only to this surface.
 * JSON today; WebSocket / MQTT / MATLAB / OPC UA can replace the backend later.
 */
export type TwinTransport = {
  kind: 'json-url' | 'json-file' | 'websocket' | 'rest'
  label: string
  load: () => Promise<TwinSnapshot>
}

export function createUrlTransport(url: string): TwinTransport {
  return {
    kind: 'json-url',
    label: url,
    load: () => loadTwinFromUrl(url),
  }
}

export function createFileTransport(file: File): TwinTransport {
  return {
    kind: 'json-file',
    label: file.name,
    load: () => loadTwinFromFile(file),
  }
}

/** Placeholder for Phase 4 live feeds — same interface, different transport. */
export function createWebSocketTransport(_url: string): TwinTransport {
  return {
    kind: 'websocket',
    label: 'WebSocket (not connected)',
    load: async () => {
      throw new Error('WebSocket transport not enabled yet — use JSON for Phase 3')
    },
  }
}
