"use client";

import type { Config, ComponentConfig } from '@puckeditor/core';
import { createElement } from 'react';
import { storeBlocksClient } from '@/components/blocks/store/client';
import { storeBlockNames as installedStoreBlockNames } from '@/components/blocks/store/block-names';
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

// Every installed store block gets at least a placeholder config so pages
// built from store blocks stay editable even before a client preview or
// schema exists for them.
const storeBlockNames = Array.from(new Set([...installedStoreBlockNames, ...Object.keys(schemaMap)]));

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
