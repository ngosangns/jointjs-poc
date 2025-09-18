export interface HistoryEntry<TPayload = unknown> {
  id: string;
  timestamp: number;
  action: string;
  payload?: TPayload; // ideally a diff structure
}
