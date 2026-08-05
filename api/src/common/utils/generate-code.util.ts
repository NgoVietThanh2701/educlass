import { customAlphabet } from 'nanoid';
import slugify from 'slugify';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const generateSlugCode = () => {
  return nanoid();
};

export function generateSlug(title: string): string {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'vi',
  });

  return `${baseSlug}-${generateSlugCode()}`;
}
