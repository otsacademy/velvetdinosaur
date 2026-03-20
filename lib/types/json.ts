export type JsonPrimitive = string | number | boolean | null
export type Json = JsonPrimitive | JsonObject | JsonArray
export type JsonObject = { [key: string]: Json }
export type JsonArray = Json[]

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function getBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

export function getArray<T>(value: unknown, guard?: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value)) return []
  if (!guard) return value as T[]
  return value.filter(guard)
}

