export interface Experience {
  id: string;
  company: string;
  position: string;
  description: string[];
  location: string;
  startDate: string;
  endDate?: string;
  technologies?: string[];
}
