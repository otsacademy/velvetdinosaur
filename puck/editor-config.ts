'use client';

import type { Config, Field } from '@puckeditor/core';
import { config as baseConfig } from '@/puck/registry.client';
import { PuckImageBlock } from '@/components/puck/blocks/puck-image-block.client';
import { assetPickerField } from '@/components/puck/fields/asset-picker-field';
import { checkboxField } from '@/components/puck/fields/checkbox-field';
import { imageListField } from '@/components/puck/fields/image-list-field';
import { linkPickerField } from '@/components/puck/fields/link-picker-field';
import { stringListField } from '@/components/puck/fields/string-list-field';
import { fieldHelpIcon } from '@/components/puck/fields/field-help';
import { humanizeFieldKey, lookupFieldVocab } from '@/puck/field-vocabulary';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isImageFieldName(propName: string) {
  const name = propName.toLowerCase();
  if (name === 'src' || name.endsWith('src')) return true;
  const skipTokens = ['alt', 'caption', 'heading', 'title', 'label'];
  if (skipTokens.some((token) => name.includes(token)) && !name.includes('url') && !name.endsWith('src')) {
    return false;
  }
  const imageTokens = ['image', 'photo', 'gallery', 'thumbnail', 'thumb', 'poster', 'avatar', 'banner', 'cover', 'logo'];
  return imageTokens.some((token) => name.includes(token));
}

function shouldUseAssetPicker(propName: string) {
  return isImageFieldName(propName);
}

function shouldUseFilePicker(propName: string) {
  const name = propName.toLowerCase();
  return name === 'fileurl' || name.endsWith('fileurl') || name === 'attachment' || name.endsWith('attachment');
}

function shouldUseLinkPicker(propName: string) {
  const name = propName.toLowerCase();
  return name === 'href' || name.endsWith('href') || name === 'url' || name.endsWith('url');
}

function shouldUseInlineEditing(propName: string, field: Field) {
  const contentEditable = (field as { contentEditable?: boolean }).contentEditable;
  if (contentEditable === false) return false;
  if (contentEditable === true) return field.type === 'text' || field.type === 'textarea';
  const name = propName.toLowerCase();
  if (
    name === 'id' ||
    name.endsWith('id') ||
    name === 'slug' ||
    name.endsWith('slug') ||
    name === 'src' ||
    name.endsWith('src') ||
    name === 'alt' ||
    name.endsWith('alt') ||
    name === 'href' ||
    name.endsWith('href') ||
    name === 'url' ||
    name.endsWith('url') ||
    name.includes('classname') ||
    name.includes('wrapperclass') ||
    name.includes('target') ||
    name === 'rel' ||
    name.includes('variant') ||
    name.includes('tone') ||
    name.includes('ratio') ||
    name.includes('position') ||
    name.includes('objectfit') ||
    name.includes('icon') ||
    name.includes('color') ||
    name.includes('email') ||
    name.includes('file') ||
    name.includes('html') ||
    name.includes('script') ||
    name.includes('json') ||
    name.includes('css') ||
    name.includes('embed') ||
    name.includes('schema') ||
    name.includes('template') ||
    name.includes('config') ||
    name.includes('query') ||
    name.includes('code')
  ) {
    return false;
  }
  return field.type === 'text' || field.type === 'textarea';
}

/**
 * Apply the shared field vocabulary: dictionary label supersedes block-declared
 * labels for consistency across sites; block labels survive only for keys with
 * no dictionary entry, ahead of the humanized fallback. Help text renders as a
 * tooltip via the field's labelIcon slot.
 */
function withVocabLabel(propName: string, field: Field): Field {
  if (!field || typeof field !== 'object') return field;
  const entry = lookupFieldVocab(propName);
  const label = entry?.label || field.label || humanizeFieldKey(propName);
  const next = { ...field, label } as Field;
  if (entry?.help && !(field as { labelIcon?: unknown }).labelIcon) {
    (next as { labelIcon?: unknown }).labelIcon = fieldHelpIcon(entry.help);
  }
  return next;
}

function transformField(propName: string, field: Field): Field {
  return withVocabLabel(propName, transformFieldWidget(propName, field));
}

function transformFieldWidget(propName: string, field: Field): Field {
  if (!field || typeof field !== 'object') return field;

  const fieldType = (field as { type?: string }).type;
  const assetKind = (field as Field & { assetKind?: 'image' | 'file' }).assetKind;
  if (fieldType === 'text' && assetKind) {
    return {
      ...field,
      ...assetPickerField({ accept: assetKind === 'image' ? 'image/*' : '*/*' }),
      contentEditable: false
    } as Field;
  }
  if (fieldType === 'checkbox') {
    return {
      ...field,
      ...checkboxField()
    } as Field;
  }

  if (field.type === 'text' && shouldUseAssetPicker(propName)) {
    return {
      ...field,
      ...assetPickerField({ accept: 'image/*' }),
      contentEditable: false
    } as Field;
  }

  if (field.type === 'text' && shouldUseFilePicker(propName)) {
    return {
      ...field,
      ...assetPickerField({ accept: '*/*' }),
      contentEditable: false
    } as Field;
  }

  if (field.type === 'text' && shouldUseLinkPicker(propName)) {
    return {
      ...field,
      ...linkPickerField(),
      contentEditable: false
    } as Field;
  }

  if (field.type === 'array' && isRecord(field.arrayFields)) {
    const keys = Object.keys(field.arrayFields);
    if (keys.length === 1 && keys[0] === 'value') {
      const inner = field.arrayFields.value as Field | undefined;
      if (inner?.type === 'text' || inner?.type === 'textarea') {
        if (shouldUseAssetPicker(propName)) {
          return imageListField({ accept: 'image/*' });
        }
        return stringListField();
      }
    }
  }

  if (field.type === 'array' && isRecord(field.arrayFields)) {
    const nextArrayFields: Record<string, Field> = {};
    for (const [key, inner] of Object.entries(field.arrayFields)) {
      nextArrayFields[key] = transformField(key, inner as Field);
    }
    return { ...field, arrayFields: nextArrayFields } as Field;
  }

  if (field.type === 'object') {
    const objectFields = (field as { objectFields?: unknown }).objectFields;
    if (isRecord(objectFields)) {
      const nextObjectFields: Record<string, Field> = {};
      for (const [key, inner] of Object.entries(objectFields)) {
        nextObjectFields[key] = transformField(key, inner as Field);
      }
      return { ...(field as Field), objectFields: nextObjectFields } as Field;
    }
  }

  if (field.type === 'text' || field.type === 'textarea') {
    return {
      ...field,
      contentEditable: shouldUseInlineEditing(propName, field)
    } as Field;
  }

  return field;
}

function transformFields(fields: Record<string, Field> | undefined) {
  if (!fields) return fields;
  const next: Record<string, Field> = {};
  for (const [propName, field] of Object.entries(fields)) {
    next[propName] = transformField(propName, field as Field);
  }
  return next;
}

const transformedComponents = Object.fromEntries(
  Object.entries(baseConfig.components).map(([key, component]) => {
    if (component && typeof component === 'object') {
      const fields = (component as { fields?: Record<string, Field> }).fields;
      return [key, { ...component, fields: transformFields(fields) }];
    }
    return [key, component];
  })
) as Config['components'];

if (transformedComponents?.Image && typeof transformedComponents.Image === 'object') {
  const imageComponent = transformedComponents.Image as {
    fields?: Record<string, Field>;
    render?: unknown;
  };
  imageComponent.render = PuckImageBlock as unknown as typeof imageComponent.render;
}

export const editorConfig: Config = {
  ...baseConfig,
  components: transformedComponents
};
