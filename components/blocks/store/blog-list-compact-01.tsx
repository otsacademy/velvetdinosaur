import type { ComponentConfig } from "@measured/puck";

import {
  BlogListCompact01,
  type BlogListCompactPost,
} from "@/components/blog-list-compact-01";

export type BlogListCompact01BlockProps = {
  id?: string;
  heading?: string;
  description?: string;
  posts?: BlogListCompactPost[];
  show?: boolean | "true" | "false";
  emptyMessage?: string;
};

export const blogListCompact01Config: ComponentConfig<BlogListCompact01BlockProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "text" },
    show: {
      type: "select",
      options: [
        { label: "Hide", value: "false" },
        { label: "Show", value: "true" },
      ],
    },
    emptyMessage: { type: "text" },
    posts: {
      type: "array",
      arrayFields: {
        id: { type: "text" },
        title: { type: "text" },
        href: { type: "text" },
        excerpt: { type: "textarea" },
        category: { type: "text" },
        date: { type: "text" },
        readTime: { type: "text" },
        views: { type: "text" },
        thumbnail: { type: "text" },
        authorName: { type: "text" },
        authorAvatar: { type: "text" },
      },
    },
  },
  defaultProps: {
    heading: "",
    description: "",
    posts: [],
    show: "false",
    emptyMessage: "",
  },
  render: (props) => <BlogListCompact01 {...props} />,
};
