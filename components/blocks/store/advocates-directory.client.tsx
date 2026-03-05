'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, ExternalLink, Leaf, MapPin } from 'lucide-react';

export type DirectoryItem = {
  name: string;
  location?: string;
  description?: string;
  website?: string;
  categoryId?: string;
  categoryLabel?: string;
};

export type DirectoryCategory = {
  id: string;
  label: string;
  items: DirectoryItem[];
};

export type AdvocatesDirectoryViewProps = {
  categories: DirectoryCategory[];
  searchPlaceholder?: string;
  allLabel?: string;
  visitLabel?: string;
  emptyTitle?: string;
  emptyBody?: string;
  clearLabel?: string;
};

export function AdvocatesDirectoryView({
  categories,
  searchPlaceholder,
  allLabel,
  visitLabel,
  emptyTitle,
  emptyBody,
  clearLabel
}: AdvocatesDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allItems = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        categoryLabel: cat.label,
        categoryId: cat.id
      }))
    );
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        if (activeCategory !== 'all' && activeCategory !== cat.id) {
          return { ...cat, items: [] };
        }

        const query = searchQuery.toLowerCase();
        const filteredItems = cat.items.filter((item) => {
          const name = item.name.toLowerCase();
          const location = (item.location || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          return name.includes(query) || location.includes(query) || description.includes(query);
        });

        return { ...cat, items: filteredItems };
      })
      .filter((cat) => cat.items.length > 0);
  }, [categories, activeCategory, searchQuery]);

  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [] as DirectoryItem[];
    return allItems
      .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [searchQuery, allItems]);

  const handleSuggestionClick = (name: string, categoryId: string) => {
    setSearchQuery(name);
    setActiveCategory(categoryId);
    setShowSuggestions(false);
  };

  return (
    <section className="mb-12">
      <div className="mb-12 sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur-md py-4 -mx-6 px-6 sm:-mx-12 sm:px-12 border-y border-[var(--vd-border)] shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96 shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder || ''}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSuggestions(true);
                  if (event.target.value === '') {
                    setActiveCategory('all');
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-4 bg-[var(--vd-muted)]/40 border border-[var(--vd-border)] rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--vd-primary)]/20 focus:border-[var(--vd-primary)] transition-all text-[var(--vd-fg)] placeholder:font-normal placeholder:text-[var(--vd-muted-fg)]"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--vd-muted-fg)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 ? (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[var(--vd-border)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    onClick={() => handleSuggestionClick(item.name, item.categoryId || 'all')}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--vd-muted)]/40 flex items-center justify-between group transition-colors border-b border-[var(--vd-border)] last:border-0"
                    type="button"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--vd-fg)] group-hover:text-[var(--vd-primary)]">
                        {item.name}
                      </p>
                      {item.categoryLabel ? (
                        <p className="text-xs text-[var(--vd-muted-fg)] uppercase tracking-wider">
                          {item.categoryLabel}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[var(--vd-muted-fg)] group-hover:text-[var(--vd-primary)] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-1 w-full pb-2 px-1">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`whitespace-nowrap px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                  activeCategory === 'all'
                    ? 'bg-[var(--vd-fg)] text-[var(--vd-bg)] border-[var(--vd-fg)] shadow-lg scale-105'
                    : 'bg-white text-[var(--vd-muted-fg)] border-[var(--vd-border)] hover:border-[var(--vd-fg)] hover:text-[var(--vd-fg)]'
                }`}
                type="button"
              >
                {allLabel || ''}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                    activeCategory === cat.id
                      ? 'bg-[var(--vd-primary)] text-[var(--vd-primary-fg)] border-[var(--vd-primary)] shadow-lg scale-105'
                      : 'bg-white text-[var(--vd-muted-fg)] border-[var(--vd-border)] hover:border-[var(--vd-primary)]/30 hover:text-[var(--vd-primary)]'
                  }`}
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-20 min-h-[400px]">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-4 mb-8 border-b border-[var(--vd-border)] pb-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--vd-fg)]">
                  {category.label}
                </h3>
                <div className="h-[1px] flex-1 bg-[var(--vd-muted)]" />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {category.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="group flex flex-col md:flex-row gap-8 p-8 md:p-10 rounded-[2rem] bg-white border border-[var(--vd-border)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="md:w-1/4 min-w-[200px]">
                      <h4 className="text-xl font-black text-[var(--vd-fg)] group-hover:text-[var(--vd-primary)] transition-colors leading-tight mb-3">
                        {item.name}
                      </h4>
                      {item.location ? (
                        <div className="flex items-start gap-2 text-[var(--vd-muted-fg)]">
                          <MapPin className="h-4 w-4" />
                          <p className="text-xs font-bold uppercase tracking-[0.2em] pt-0.5">
                            {item.location}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="md:flex-1 border-l-0 md:border-l border-[var(--vd-border)] md:pl-10">
                      {item.description ? (
                        <div className="text-base text-[var(--vd-muted-fg)] leading-relaxed whitespace-pre-wrap font-medium">
                          {item.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="md:w-auto flex items-start justify-end">
                      {item.website ? (
                        <a
                          href={item.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-8 py-4 bg-[var(--vd-muted)]/40 border border-[var(--vd-border)] rounded-full flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--vd-fg)] hover:bg-[var(--vd-primary)] hover:text-[var(--vd-primary-fg)] hover:border-[var(--vd-primary)] transition-all group/link shadow-sm hover:shadow-xl"
                        >
                          {visitLabel || ''} <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-[var(--vd-muted)]/40 rounded-[3rem] border border-[var(--vd-border)]">
            <div className="w-20 h-20 bg-white shadow-sm border border-[var(--vd-border)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--vd-muted-fg)]">
              <Leaf className="h-6 w-6" />
            </div>
            {emptyTitle ? (
              <h3 className="text-2xl font-bold text-[var(--vd-fg)] mb-2">{emptyTitle}</h3>
            ) : null}
            {emptyBody ? <p className="text-[var(--vd-muted-fg)] text-lg">{emptyBody}</p> : null}
            {clearLabel ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-8 px-6 py-2 bg-[var(--vd-primary)]/20 text-[var(--vd-primary)] rounded-full text-sm font-bold hover:bg-[var(--vd-primary)]/30 transition-colors"
                type="button"
              >
                {clearLabel}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
