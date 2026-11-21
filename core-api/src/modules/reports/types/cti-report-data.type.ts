export interface CtiTargetSummary {
  id: string;
  value: string;
  type: string;
  assetCount: number;
  findingCount: number;
  highestThreatScore: number;
  lastScanAt: string | null;
}

export interface CtiAssetSummary {
  id: string;
  value: string;
  type: string;
  threatScore: number;
  confidence: number;
  source: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface CtiThreatDistribution {
  level: string;
  count: number;
  percent: number;
}

export interface CtiReportData {
  reportTitle: string;
  exportedAt: string;
  workspaceName: string;
  classification: string;
  systemName: string;
  logoBase64?: string;
  dateRange?: string;

  // Summary stats
  totalTargets: number;
  totalAssets: number;
  totalFindings: number;
  criticalThreats: number;
  avgThreatScore: number;

  // Distributions
  threatDistribution: CtiThreatDistribution[];
  assetsByType: Array<{ type: string; count: number }>;

  // Top items
  topThreats: CtiAssetSummary[];
  targets: CtiTargetSummary[];

  // Recent high-severity assets
  recentCritical: CtiAssetSummary[];
}
