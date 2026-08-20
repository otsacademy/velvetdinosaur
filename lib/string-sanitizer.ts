const NULLISH_STRING_VALUES = new Set(['undefined', '$undefined', 'null', '$null'])

export function cleanString(value: unknown) {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''
  if (NULLISH_STRING_VALUES.has(trimmed.toLowerCase())) return ''

  return trimmed
}

export function optionalString(value: unknown) {
  return cleanString(value) || undefined
}

export function nullableString(value: unknown) {
  return cleanString(value) || null
}
