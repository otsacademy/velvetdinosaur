"use client";

import type { Config, ComponentConfig } from '@measured/puck';
import { createElement } from 'react';
import { storeBlocksClient } from '@/components/blocks/store/client';
import { StoreBlockPreview } from '@/components/puck/store-block-preview';
import { coreComponents, withLayout } from '@/puck/registry-core';
import storeBlockSchemas from '@/puck/store-block-schemas.json';

type UnknownProps = Record<string, unknown>;

type SchemaEntry = {
  fields?: ComponentConfig<UnknownProps>['fields'];
  defaultProps?: UnknownProps;
};

const schemaMap = storeBlockSchemas as Record<string, SchemaEntry>;

type PuckRenderProps = Parameters<NonNullable<ComponentConfig<UnknownProps>['render']>>[0];

function placeholderConfig(name: string, schema?: SchemaEntry): ComponentConfig<UnknownProps> {
  return {
    fields: schema?.fields || {},
    defaultProps: schema?.defaultProps || {},
    render: ({ puck, ...props }: PuckRenderProps) =>
      createElement(StoreBlockPreview, { name, props })
  };
}

function previewConfig(
  name: string,
  render: ComponentConfig<UnknownProps>['render'] | undefined,
  fallback?: ComponentConfig<UnknownProps>
): ComponentConfig<UnknownProps> {
  const schema = schemaMap[name];
  const fields = fallback?.fields || schema?.fields || {};
  const defaultProps = fallback?.defaultProps || schema?.defaultProps || {};
  const renderWithFallback = (inputProps: PuckRenderProps) => {
    const node = render ? render(inputProps) : null;
    if (node === null || node === undefined) {
      const { puck, ...rest } = inputProps || {};
      return createElement(StoreBlockPreview, { name, props: rest });
    }
    return node;
  };

  return {
    ...fallback,
    fields,
    defaultProps,
    render: renderWithFallback
  };
}

const storeBlockNames = Object.keys(schemaMap);

const storePlaceholders = Object.fromEntries(
  storeBlockNames.map((name) => [name, placeholderConfig(name, schemaMap[name])])
);

const safeBlocks = Object.fromEntries(
  Object.entries(storeBlocksClient).map(([name, block]) => [
    name,
    previewConfig(
      name,
      (block as ComponentConfig<UnknownProps>)?.render,
      block as ComponentConfig<UnknownProps>
    )
  ])
);

export const config: Config = {
  components: Object.fromEntries(
    Object.entries({
      ...coreComponents,
      ...storePlaceholders,
      ...safeBlocks
    }).map(([key, value]) => [key, withLayout(value)])
  ) as Config['components']
};
