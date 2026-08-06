import slugify from 'slugify';

export function generateSlug(title: string): string {
  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'vi',
  });

  return slug || 'course';
}
