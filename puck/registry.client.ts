"use client";

import type { Config, ComponentConfig } from '@puckeditor/core';
import { createElement } from 'react';
import { storeBlocksCurated as clientSafeBlocks } from '@/components/blocks/store/curated.client';
import { storeBlockPreviewRenders } from '@/components/puck/previews/store-preview-renders';
import { StoreBlockPreview } from '@/components/puck/store-block-preview';
import { coreComponents, withLayout } from '@/puck/registry-core';
import storeBlockSchemas from '@/puck/store-block-schemas.json';

type UnknownProps = Record<string, unknown>;

type SchemaEntry = {
  fields?: ComponentConfig<UnknownProps>['fields'];
  defaultProps?: UnknownProps;
};

const schemaMap = storeBlockSchemas as Record<string, SchemaEntry>;
const clientSafeBlockMap = clientSafeBlocks as unknown as Record<string, ComponentConfig<UnknownProps>>;

type PuckRenderProps = Parameters<NonNullable<ComponentConfig<UnknownProps>['render']>>[0];

function stripPuckProps(props: UnknownProps | undefined) {
  if (!props) return {};
  const { puck, ...rest } = props;
  return rest;
}

function placeholderConfig(name: string, schema?: SchemaEntry): ComponentConfig<UnknownProps> {
  return {
    fields: schema?.fields || {},
    defaultProps: schema?.defaultProps || {},
    render: (inputProps) =>
      createElement(StoreBlockPreview, { name, props: stripPuckProps(inputProps as UnknownProps) })
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
      return createElement(StoreBlockPreview, {
        name,
        props: stripPuckProps(inputProps as UnknownProps)
      });
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

function withLayoutComponents(
  components: Record<string, ComponentConfig<UnknownProps>>
): Config['components'] {
  return Object.fromEntries(
    Object.entries(components).map(([key, value]) => [key, withLayout(value)])
  ) as Config['components'];
}

const storeBlockNames = Array.from(
  new Set([
    ...Object.keys(schemaMap),
    ...Object.keys(clientSafeBlockMap),
    ...Object.keys(storeBlockPreviewRenders)
  ])
);

const storeComponents = Object.fromEntries(
  storeBlockNames.map((name) => {
    const safeBlock = clientSafeBlockMap[name];
    const previewRender = storeBlockPreviewRenders[name];

    if (previewRender) {
      return [name, previewConfig(name, previewRender, safeBlock)];
    }

    if (safeBlock) {
      return [name, previewConfig(name, safeBlock.render, safeBlock)];
    }

    return [name, placeholderConfig(name, schemaMap[name])];
  })
);

export const config: Config = {
  components: withLayoutComponents({
    ...(coreComponents as Record<string, ComponentConfig<UnknownProps>>),
    ...(storeComponents as Record<string, ComponentConfig<UnknownProps>>)
  })
};
