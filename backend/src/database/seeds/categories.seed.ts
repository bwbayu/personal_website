import { Category } from '../../categories/category.type';
import { toSlug } from '../../utils/slug.util';

// Skill categories, ordered by the legacy enum sequence (order 0..5). Doc ids are
// the name slug (toSlug), matching what skills' `categoryId` resolves to. This is
// the canonical category source shared by the migration seed and the prod patch.
const categoryNames = [
  'Programming Languages',
  'Web/Cross Platform Framework & Libraries',
  'DevOps Tools',
  'Databases',
  'Cloud Platforms',
  'Data/AI Framework & Libraries',
];

export const categoriesSeed: Category[] = categoryNames.map((name, order) => ({
  id: toSlug(name),
  name,
  order,
}));
