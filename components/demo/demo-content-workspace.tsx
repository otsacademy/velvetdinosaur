import { PagesIndex } from '@/components/edit/pages-index.client';
import { demoContentPages, demoContentWorkArticles } from '@/lib/demo-content-data';
import type { DemoRouteVariant } from '@/lib/demo-site';

type DemoContentWorkspaceProps = {
  variant: DemoRouteVariant;
};

export function DemoContentWorkspace({ variant }: DemoContentWorkspaceProps) {
  return <PagesIndex pages={demoContentPages} workArticles={demoContentWorkArticles} mode="demo" demoVariant={variant} />;
}
