export interface Notification {
  id: string;
  type: string;
  poleIds: string[];
  severity: 'info' | 'warning' | 'error';
  createdDate: number;
  polesCount: number;
  read: boolean;
  captureId?: string;
}
