"use client";

import type { ComponentType } from 'react';

import * as Registry from "@/registry/new-york-v4/ui/navigation-menu";

type PrimitiveProps = {
  label?: string;
  className?: string;
  propsJson?: string;
};

function safeParseJson(input?: string) {
  if (!input) return {};
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

export default function ShadcnNavigationMenu({ label = "Navigation Menu", className = "", propsJson = "" }: PrimitiveProps) {
  const resolved = (Registry as Record<string, unknown>)["NavigationMenu"] || (Registry as Record<string, unknown>).default || Object.values(Registry as Record<string, unknown>).find((value) => typeof value === "function");
  if (!resolved || typeof resolved !== "function") {
    return <div className="rounded-md border border-[var(--vd-border)] bg-white p-3 text-sm text-[var(--vd-muted-fg)]">Component export not found.</div>;
  }
  const Component = resolved as ComponentType<Record<string, unknown>>;
  const extraProps = safeParseJson(propsJson);
  const mergedProps: Record<string, unknown> = { ...extraProps, className: [extraProps?.className, className].filter(Boolean).join(" ") };
  const hasChildren = Object.prototype.hasOwnProperty.call(extraProps || {}, "children");
  const inlineLabel = false;
  if (!hasChildren && inlineLabel) {
    mergedProps.children = label;
  }
  if (!hasChildren && !inlineLabel && label) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-[var(--vd-muted-fg)]">{label}</div>
        <Component {...mergedProps} />
      </div>
    );
  }
  return <Component {...mergedProps} />;
}
