export interface CaptureInterface {
  id: string;
  groupBy: string;
  groupKey: string;
  subGroupKey?: string;
  poles: string[];
  startDate: number;
  endDate: number;
  createdDate: number;
}
