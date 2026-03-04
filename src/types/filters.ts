import { Sector } from "./investment";

export interface FilterState {
  country: string | null;
  investmentId: string | null;
  sector: Sector | null;
}
