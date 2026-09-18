'use client';
import type { ComponentProps } from 'react';
import { EmailTemplateVisualEditor } from '@/components/edit/email-template-visual-editor';
export function DemoEmailTemplateVisualEditor(props: ComponentProps<typeof EmailTemplateVisualEditor>) {
  return <EmailTemplateVisualEditor {...props} demo />;
}
