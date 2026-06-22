// Config-driven admin scaffold. Each content domain is declared once as a
// `DomainConfig`; one shared list view and one shared form view consume these
// configs, so adding a domain is (mostly) a config entry plus any custom widget.
//
// The backend Zod schemas remain the single source of truth for validation; the
// `required` flags here only drive light client-side checks before submit.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'date'
  | 'url'
  | 'string-array' // array-of-strings editor (add/remove rows)
  | 'category-ref' // single-select dropdown of categories (stores a category id)
  | 'tech-picker' // multi-select of skill ids (stores skill ids)
  | 'markdown' // markdown editor (client-only; stores raw markdown text)
  | 'select'; // single-select of fixed enum options (stores the option value)

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[]; // for `select`
}

export interface ColumnConfig {
  key: string;
  label: string;
}

export interface DomainConfig {
  slug: string; // route segment + sidebar key, e.g. 'projects' / 'media-socials'
  label: string; // sidebar/title text
  apiPath: string; // e.g. '/api/projects' (appended to NEXT_PUBLIC_API_URL); writes target this
  // Admin read path when it differs from `apiPath` (posts reads /api/posts/all to see
  // drafts, but still writes to /api/posts). Defaults to `apiPath` when unset.
  adminListPath?: string;
  adminAuthRead?: boolean; // admin read needs a Firebase token (posts: drafts are private)
  idKind: 'uuid' | 'slug'; // which id format the write routes validate
  singleton?: boolean; // about: edit-only, no list/create/delete
  reorderable?: boolean; // skills, categories: per-item order PATCH
  columns: ColumnConfig[];
  fields: FieldConfig[];
}

// Sidebar order.
export const registry: DomainConfig[] = [
  {
    slug: 'about',
    label: 'About',
    apiPath: '/api/about',
    idKind: 'uuid',
    singleton: true,
    columns: [],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
    ],
  },
  {
    slug: 'skills',
    label: 'Skills',
    apiPath: '/api/skills',
    idKind: 'slug',
    reorderable: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'categoryId', label: 'Category' },
      { key: 'order', label: 'Order' },
      { key: 'isShow', label: 'Visible' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'categoryId', label: 'Category', type: 'category-ref', required: true },
      { key: 'iconClass', label: 'Icon Class', type: 'text' },
      { key: 'iconImage', label: 'Icon Image URL', type: 'url' },
      { key: 'isShow', label: 'Visible', type: 'boolean' },
      { key: 'order', label: 'Order', type: 'number' },
    ],
  },
  {
    slug: 'categories',
    label: 'Categories',
    apiPath: '/api/categories',
    idKind: 'slug',
    reorderable: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'order', label: 'Order' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'order', label: 'Order', type: 'number' },
    ],
  },
  {
    slug: 'projects',
    label: 'Projects',
    apiPath: '/api/projects',
    idKind: 'uuid',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'technologies', label: 'Technologies', type: 'tech-picker' },
      { key: 'role', label: 'Role', type: 'string-array' },
      { key: 'category', label: 'Category', type: 'string-array' },
      { key: 'url', label: 'URL', type: 'url' },
      { key: 'githubUrl', label: 'GitHub URL', type: 'url' },
      { key: 'youtubeUrl', label: 'YouTube URL', type: 'url' },
    ],
  },
  {
    slug: 'experiences',
    label: 'Experiences',
    apiPath: '/api/experiences',
    idKind: 'uuid',
    columns: [
      { key: 'company', label: 'Company' },
      { key: 'position', label: 'Position' },
      { key: 'startDate', label: 'Start Date' },
    ],
    fields: [
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'position', label: 'Position', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'string-array', required: true },
      { key: 'location', label: 'Location', type: 'text', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date' },
    ],
  },
  {
    slug: 'educations',
    label: 'Educations',
    apiPath: '/api/educations',
    idKind: 'uuid',
    columns: [
      { key: 'institution', label: 'Institution' },
      { key: 'title', label: 'Title' },
    ],
    fields: [
      { key: 'institution', label: 'Institution', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'certifications',
    label: 'Certifications',
    apiPath: '/api/certifications',
    idKind: 'uuid',
    columns: [
      { key: 'company_name', label: 'Company' },
      { key: 'title', label: 'Title' },
      { key: 'issued', label: 'Issued' },
    ],
    fields: [
      { key: 'company_name', label: 'Company', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'issued', label: 'Issued', type: 'date', required: true },
      { key: 'expires', label: 'Expires', type: 'date' },
      { key: 'url', label: 'URL', type: 'url' },
    ],
  },
  {
    slug: 'achievements',
    label: 'Achievements',
    apiPath: '/api/achievements',
    idKind: 'uuid',
    columns: [
      { key: 'event_name', label: 'Event' },
      { key: 'org_name', label: 'Organization' },
      { key: 'date', label: 'Date' },
    ],
    fields: [
      { key: 'event_name', label: 'Event Name', type: 'text', required: true },
      { key: 'org_name', label: 'Organization', type: 'text', required: true },
      { key: 'achievement', label: 'Achievement', type: 'text' },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'descriptions', label: 'Descriptions', type: 'string-array', required: true },
      { key: 'githubUrl', label: 'GitHub URLs', type: 'string-array' },
      { key: 'resultUrl', label: 'Result URLs', type: 'string-array' },
    ],
  },
  {
    slug: 'media-socials',
    label: 'Media Socials',
    apiPath: '/api/media-socials',
    idKind: 'uuid',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'url', label: 'URL' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'url', label: 'URL', type: 'url', required: true },
      { key: 'iconClass', label: 'Icon Class', type: 'text', required: true },
    ],
  },
  {
    slug: 'posts',
    label: 'Posts',
    apiPath: '/api/posts',
    adminListPath: '/api/posts/all', // admin list reads drafts too
    adminAuthRead: true,
    idKind: 'uuid',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'publishedAt', label: 'Published' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { key: 'cover', label: 'Cover Image URL', type: 'url' },
      { key: 'content', label: 'Content', type: 'markdown', required: true },
      { key: 'tags', label: 'Tags', type: 'string-array' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
        ],
      },
    ],
  },
];

export const bySlug: Record<string, DomainConfig> = Object.fromEntries(
  registry.map((domain) => [domain.slug, domain]),
);

// Presentation-only sidebar grouping (DD2). `registry` stays the source of truth for
// order, labels, and fields; this only buckets the domains into sidebar sections. The
// singleton (about) sits under Profile like any other link.
export const navGroups: { label: string; slugs: string[] }[] = [
  { label: 'Profile', slugs: ['about', 'media-socials'] },
  { label: 'Portfolio', slugs: ['projects', 'skills', 'categories'] },
  { label: 'Resume', slugs: ['experiences', 'educations', 'certifications', 'achievements'] },
  { label: 'Blog', slugs: ['posts'] },
];

// Fail loudly if a domain is added to `registry` without being placed in exactly one
// nav group, so the sidebar can never silently drop (or duplicate) a section.
const groupedSlugs = navGroups.flatMap((group) => group.slugs);
const missingFromGroups = registry
  .map((domain) => domain.slug)
  .filter((slug) => !groupedSlugs.includes(slug));
const unknownInGroups = groupedSlugs.filter((slug) => !bySlug[slug]);
if (
  missingFromGroups.length > 0 ||
  unknownInGroups.length > 0 ||
  groupedSlugs.length !== new Set(groupedSlugs).size
) {
  throw new Error(
    `navGroups must cover every registry slug exactly once ` +
      `(missing: ${missingFromGroups.join(', ') || 'none'}; ` +
      `unknown: ${unknownInGroups.join(', ') || 'none'})`,
  );
}
