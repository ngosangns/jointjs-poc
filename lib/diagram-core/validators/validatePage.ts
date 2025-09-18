import type { Page } from '../interfaces';

export function validatePageModel(page: Page): boolean {
  if (!page.id) return false;
  if (!page.name) return false;
  return true;
}
