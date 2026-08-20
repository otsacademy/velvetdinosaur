import type { Data } from '@puckeditor/core';
import { ASAP_LEGACY_TYPES } from '@/lib/puck/legacy-types';

export const LEGACY_PAGE_COMPONENTS = ASAP_LEGACY_TYPES;

export type LegacyPageComponent = (typeof LEGACY_PAGE_COMPONENTS)[number];

const LEGACY_PAGE_COMPONENT_SET = new Set<string>(LEGACY_PAGE_COMPONENTS);
const LEGACY_COMPONENT_EXCLUSIONS = new Set<string>([
  'AsapConnectPage',
  'AsapBoardPage',
  'AsapAdvisoryBoardPage'
]);

type PuckNodeLike = {
  type?: unknown;
};

function isPuckData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { root?: unknown; content?: unknown };
  return Boolean(maybe.root && typeof maybe.root === 'object' && Array.isArray(maybe.content));
}

function toNode(value: unknown): PuckNodeLike | null {
  if (!value || typeof value !== 'object') return null;
  return value as PuckNodeLike;
}

export function isLegacyPageComponent(value: unknown): value is LegacyPageComponent {
  return (
    typeof value === 'string' &&
    LEGACY_PAGE_COMPONENT_SET.has(value) &&
    !LEGACY_COMPONENT_EXCLUSIONS.has(value)
  );
}

export function listLegacyPageComponents(data: unknown): LegacyPageComponent[] {
  if (!isPuckData(data)) return [];
  const found: LegacyPageComponent[] = [];
  const seen = new Set<LegacyPageComponent>();

  for (const item of data.content || []) {
    const node = toNode(item);
    const type = typeof node?.type === 'string' ? node.type : '';
    if (!isLegacyPageComponent(type)) continue;
    if (seen.has(type)) continue;
    seen.add(type);
    found.push(type);
  }

  return found;
}

export function hasLegacyPageComponents(data: unknown) {
  return listLegacyPageComponents(data).length > 0;
}
