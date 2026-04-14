export interface CaptureInterface {
  id: string;
  groupBy: string;
  groupByValue: string;
  subGroupValue?: string;
  poles: string[];
  startDate: number;
  endDate: number;
  createdDate: number;
}
