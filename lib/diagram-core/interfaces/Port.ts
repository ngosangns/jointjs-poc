export type PortPosition = 'top' | 'right' | 'bottom' | 'left' | { x: number; y: number };

export interface Port {
  id: string;
  position: PortPosition;
  magnet?: boolean;
}
