import type { Shape } from './Shape';
import type { Link } from './Link';

export interface Template {
  id: string;
  name: string;
  elements?: Shape[];
  links?: Link[];
}
