"use client";

import type { ComponentType } from 'react';

import Block from "@/registry/new-york-v4/blocks/sidebar-13/page";

type BlockProps = {
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

export default function ShadcnBlockSidebar13Page({ className = "", propsJson = "", ...props }: BlockProps & Record<string, unknown>) {
  const Component = Block as ComponentType<Record<string, unknown>>;
  const extraProps = safeParseJson(propsJson);
  const mergedProps = { ...extraProps, ...props, className: [extraProps?.className, className, props?.className].filter(Boolean).join(" ") };
  return <Component {...mergedProps} />;
}
