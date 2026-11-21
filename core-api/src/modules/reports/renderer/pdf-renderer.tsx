import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { QueryReportData } from '../types/query-report-data.type';
import type { ReportData } from '../types/report-data.type';
import type { VulnerabilityReportData } from '../types/vulnerability-report-data.type';
import { QueryReportDocument } from './query/QueryReportDocument';
import { SummaryReportDocument } from './summary/SummaryReportDocument';
import { VulnReportDocument } from './vuln/VulnReportDocument';
import { CtiReportDocument } from './cti/CtiReportDocument';
import type { CtiReportData } from '../types/cti-report-data.type';

// Ensure fonts are registered once
import './fonts';

/**
 * Render a report document to a PDF buffer.
 * Accepts 'SUMMARY', 'VULNERABILITY' or 'QUERY' with the matching data.
 */
export async function renderReportPdf(
  type: 'SUMMARY' | 'VULNERABILITY' | 'QUERY' | 'CTI',
  data: ReportData | VulnerabilityReportData | QueryReportData | CtiReportData,
): Promise<Buffer> {
  // Merge server-side fields into data
  const enrichedData = {
    ...data,
    systemName: 'Open Attack Surface Management',
    classification: 'Strictly Confidential',
  };

  if (type === 'VULNERABILITY') {
    return renderToBuffer(
      <VulnReportDocument data={enrichedData as VulnerabilityReportData} />,
    );
  }

  if (type === 'CTI') {
    return renderToBuffer(<CtiReportDocument data={enrichedData as CtiReportData} />);
  }

  if (type === 'QUERY') {
    return renderToBuffer(
      <QueryReportDocument data={enrichedData as QueryReportData} />,
    );
  }

  return renderToBuffer(
    <SummaryReportDocument data={enrichedData as ReportData} />,
  );
}
