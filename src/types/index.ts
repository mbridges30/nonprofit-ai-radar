export type Tier = "ready_now" | "strategic_growth" | "advanced_impact";

export type Category =
  | "Fundraising & Donor Relations"
  | "Program Delivery & Services"
  | "Operations & Admin"
  | "Marketing & Communications"
  | "Advocacy & Policy"
  | "Volunteer Management"
  | "Data & Impact Measurement";

export const CATEGORIES: Category[] = [
  "Fundraising & Donor Relations",
  "Program Delivery & Services",
  "Operations & Admin",
  "Marketing & Communications",
  "Advocacy & Policy",
  "Volunteer Management",
  "Data & Impact Measurement",
];

export const TIER_CONFIG: Record<
  Tier,
  { label: string; color: string; ringIndex: number; scoreRange: [number, number] }
> = {
  ready_now: {
    label: "Ready Now",
    color: "#22c55e",
    ringIndex: 0,
    scoreRange: [70, 100],
  },
  strategic_growth: {
    label: "Strategic Growth",
    color: "#f59e0b",
    ringIndex: 1,
    scoreRange: [40, 69],
  },
  advanced_impact: {
    label: "Advanced Impact",
    color: "#3b82f6",
    ringIndex: 2,
    scoreRange: [1, 39],
  },
};

export interface UseCase {
  id: number;
  title: string;
  description: string;
  source_url: string | null;
  source_name: string | null;
  category: Category;
  tier: Tier;
  score: number;
  implementation_notes: string | null;
  example_orgs: string | null;
  date_found: string;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  cases_found: number;
  error: string | null;
}

export type NonprofitType =
  | "Education & Research"
  | "Health & Human Services"
  | "Arts & Culture"
  | "Environment & Conservation"
  | "Faith-Based"
  | "Animal Welfare"
  | "International Development"
  | "Community Development"
  | "Youth Development"
  | "Advocacy & Civil Rights"
  | "Cross-Sector";

export const NONPROFIT_TYPES: NonprofitType[] = [
  "Education & Research",
  "Health & Human Services",
  "Arts & Culture",
  "Environment & Conservation",
  "Faith-Based",
  "Animal Welfare",
  "International Development",
  "Community Development",
  "Youth Development",
  "Advocacy & Civil Rights",
  "Cross-Sector",
];

export type Geography =
  | "Global"
  | "North America"
  | "Europe"
  | "UK & Ireland"
  | "Asia Pacific"
  | "Africa"
  | "Latin America"
  | "Middle East";

export const GEOGRAPHIES: Geography[] = [
  "Global",
  "North America",
  "Europe",
  "UK & Ireland",
  "Asia Pacific",
  "Africa",
  "Latin America",
  "Middle East",
];

export interface NewsArticle {
  id: number;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  discovered_at: string;
  summary: string | null;
  category: Category;
  categories_json: string | null;
  nonprofit_type: NonprofitType;
  geography: Geography;
  relevance_score: number | null;
  tags_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsAgentRun {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  articles_found: number;
  error: string | null;
}
