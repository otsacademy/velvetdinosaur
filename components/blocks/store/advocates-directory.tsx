import type { ComponentConfig } from '@measured/puck';
import { listAdvocates } from '@/lib/content/advocates';
import type { Advocate } from '@/lib/content/types';
import {
  AdvocatesDirectoryView,
  type DirectoryCategory,
  type DirectoryItem
} from './advocates-directory.client';

type CategoryConfig = {
  id: string;
  label: string;
};

export type AdvocatesDirectoryProps = {
  searchPlaceholder?: string;
  allLabel?: string;
  visitLabel?: string;
  emptyTitle?: string;
  emptyBody?: string;
  clearLabel?: string;
  categories?: CategoryConfig[];
};

function mapCategory(category?: Advocate['category']) {
  if (!category) return null;
  if (category === 'tour') return 'guides';
  return category;
}

export async function AdvocatesDirectory(props: AdvocatesDirectoryProps) {
  if (!props.categories || props.categories.length === 0) return null;
  const advocates = await listAdvocates();
  const baseCategories: CategoryConfig[] = props.categories;

  const items: DirectoryItem[] = advocates
    .filter((advocate) => advocate.category && advocate.category !== 'charity')
    .map((advocate) => ({
      name: advocate.name,
      location: advocate.location,
      description: advocate.description,
      website: advocate.website,
      categoryId: mapCategory(advocate.category) || undefined
    }));

  const grouped: DirectoryCategory[] = baseCategories.map((category) => ({
    id: category.id,
    label: category.label,
    items: items.filter((item) => item.categoryId === category.id)
  }));

  return (
    <AdvocatesDirectoryView
      categories={grouped}
      searchPlaceholder={props.searchPlaceholder}
      allLabel={props.allLabel}
      visitLabel={props.visitLabel}
      emptyTitle={props.emptyTitle}
      emptyBody={props.emptyBody}
      clearLabel={props.clearLabel}
    />
  );
}

export const advocatesDirectoryConfig: ComponentConfig<AdvocatesDirectoryProps> = {
  fields: {
    searchPlaceholder: { type: 'text' },
    allLabel: { type: 'text' },
    visitLabel: { type: 'text' },
    emptyTitle: { type: 'text' },
    emptyBody: { type: 'textarea' },
    clearLabel: { type: 'text' },
    categories: {
      type: 'array',
      arrayFields: {
        id: { type: 'text' },
        label: { type: 'text' }
      }
    }
  },
  defaultProps: {
    searchPlaceholder: '',
    allLabel: '',
    visitLabel: '',
    emptyTitle: '',
    emptyBody: '',
    clearLabel: '',
    categories: []
  },
  render: (props) => AdvocatesDirectory(props) as any
};
