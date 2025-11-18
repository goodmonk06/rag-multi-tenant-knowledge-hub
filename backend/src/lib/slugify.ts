/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(base: string, existingSlugs: string[]): string {
  let slug = slugify(base);
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${slugify(base)}-${counter}`;
    counter++;
  }

  return slug;
}
