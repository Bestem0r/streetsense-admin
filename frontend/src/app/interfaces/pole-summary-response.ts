export interface PoleSummaryResponse {
  dates: {
    capturedDate: number;
    count: number;
  }[];
  countyData: {
    county: string;
    municipalities: string[];
  }[];
  availableCounties: string[];
  availableMunicipalities: string[];
}