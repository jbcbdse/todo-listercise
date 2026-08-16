export const FlagKey = {
  Priorities: "priorities",
  CompletedSparkles: "completed_sparkles",
} as const;

export type FlagKey = (typeof FlagKey)[keyof typeof FlagKey];
