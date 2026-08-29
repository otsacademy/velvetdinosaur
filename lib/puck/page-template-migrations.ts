import type { Data } from '@puckeditor/core';

/**
 * Site-owned seam: conversion of legacy full-page nodes into editable
 * template content. The installer template starts clean, so there is
 * nothing to migrate and both entry points are inert.
 */
export function findLegacyTypesWithoutTemplates(_types: string[]): string[] {
  return [];
}

export function migrateLegacyTemplateNodes(_data: unknown): { data: Data; changed: boolean } | null {
  return null;
}
