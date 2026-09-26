export type Severity = "High" | "Med";

export type AuditCategory =
  | "Value Proposition"
  | "Headline & Hook"
  | "Cognitive Load"
  | "Trust Signals"
  | "Call to Action"
  | "Objection Handling"
  | "Structure & Flow"
  | "Psychological Trigger"
  | "Social Proof"
  | "Friction Point";

export interface AuditPoint {
  id: number;
  category: AuditCategory | string;
  severity: Severity;
  issue: string;
  why_it_hurts: string;
  exact_rewrite: string;
}

export interface AuditResponse {
  points: AuditPoint[];
  input_summary: string;
}

export interface CheckoutSession {
  url: string;
}
