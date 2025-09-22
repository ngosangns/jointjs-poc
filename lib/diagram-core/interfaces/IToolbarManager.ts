export type ToolbarMode = 'select' | 'pan';

export interface ToolbarModeChangeEvent {
  mode: ToolbarMode;
  previousMode: ToolbarMode;
}
