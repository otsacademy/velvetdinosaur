import type { Data } from '@measured/puck';

function ensureId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

function isContentItem(value: unknown): value is { type: string; props: Record<string, unknown> } {
  return Boolean(value && typeof value === 'object' && 'type' in (value as object) && 'props' in (value as object));
}

function sanitizeContent(content: unknown): unknown {
  if (!Array.isArray(content)) return content;
  return content.map((item) => {
    if (!isContentItem(item)) return item;
    const { props = {}, ...rest } = item;
    const propsObj = typeof props === 'object' && props ? { ...(props as Record<string, unknown>) } : {};
    if (!propsObj.id) {
      const fallbackId = (item as { id?: string }).id;
      propsObj.id = fallbackId || ensureId();
    }

    for (const [key, value] of Object.entries(propsObj)) {
      if (Array.isArray(value) && value.every(isContentItem)) {
        propsObj[key] = sanitizeContent(value);
      }
    }

    const { id: _legacyId, ...cleanRest } = rest as { id?: string };
    return {
      ...cleanRest,
      props: propsObj
    };
  });
}

export function sanitizeData(data: Data): Data {
  if (!data || !Array.isArray(data.content)) {
    return data;
  }

  return {
    ...data,
    content: sanitizeContent(data.content) as Data['content'],
    zones: data.zones ? (Object.fromEntries(
      Object.entries(data.zones).map(([key, value]) => [key, sanitizeContent(value)])
    ) as Data['zones']) : data.zones
  };
}
