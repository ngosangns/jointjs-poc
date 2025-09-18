import type { Link } from '../interfaces';

export function validateLinkModel(link: Link): boolean {
  if (!link.id) return false;
  if (!link.source?.elementId) return false;
  if (!link.target?.elementId) return false;
  return true;
}
