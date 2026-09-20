export type PriceBasis = string;
export type SortKey = "psf_asc" | "total_asc";
export type UnitTag = "lowest_floor" | "ground_floor" | "overpriced_high_floor";

export interface PriceColumn {
  key: string;
  label: string;
}

export interface NamedPrice {
  key: string;
  label: string;
  amount: number;
}

export interface Profile {
  id: string;
  email: string | null;
  credits_balance: number;
  free_credit_month: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  price_basis: PriceBasis;
  price_columns: PriceColumn[];
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  file_name: string;
  file_type: "pdf" | "png" | "jpg";
  page_count: number;
  file_hash: string | null;
  status: "uploaded" | "processing" | "succeeded" | "failed";
  extraction_confidence: number | null;
  error_message: string | null;
}

export interface Explainability {
  premium_pct?: number;
  threshold?: number;
  percentile?: number;
  comparison_basis?: string;
  prev_floor?: string;
  prev_price?: number;
  this_price?: number;
}

export interface Unit {
  id: string;
  project_id: string;
  source_document_id: string | null;
  tower: string | null;
  floor_raw: string;
  floor_sort_key: number;
  unit_no: string;
  layout: string | null;
  saleable_area_sqft: number;
  prices: NamedPrice[];
  price_original: number | null;
  price_plan_a: number | null;
  price_plan_b: number | null;
  computed_price: number | null;
  psf: number | null;
  tags: UnitTag[];
  explainability: Explainability;
  extraction_confidence: number;
}

export interface ShortlistItem {
  id: string;
  project_id: string;
  unit_id: string;
  rank: number;
}
