import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { CtiReportData } from '../../types/cti-report-data.type';
import { slate, palette } from '../theme';
import { CoverPage } from '../components/CoverPage';
import { ReportHeader } from '../components/ReportHeader';
import { ReportFooter } from '../components/ReportFooter';
import { SectionHeader } from '../components/SectionHeader';
import { MetricCard } from '../components/MetricCard';

import '../fonts';

const styles = StyleSheet.create({
  contentPage: {
    paddingHorizontal: 56,
    paddingTop: 56,
    paddingBottom: 48,
    fontFamily: 'Inter',
    fontSize: 9,
    color: slate[800],
    lineHeight: 1.6,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  tableHeader: {
    backgroundColor: slate[100],
    borderBottomWidth: 1,
    borderBottomColor: slate[300],
    display: 'flex',
    flexDirection: 'row',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: slate[200],
    display: 'flex',
    flexDirection: 'row',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  th: {
    fontSize: 7,
    fontWeight: '700',
    color: slate[600],
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: 'Inter',
    textTransform: 'uppercase' as any,
  },
  td: {
    fontSize: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontFamily: 'Inter',
  },
  badge: {
    fontSize: 7,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  sectionSpacing: { marginTop: 20 },
});

const threatColor = (score: number): string => {
  if (score >= 80) return palette.critical;
  if (score >= 60) return palette.high;
  if (score >= 40) return palette.medium;
  if (score >= 20) return palette.low;
  return palette.info;
};

const ThreatBadge: React.FC<{ score: number }> = ({ score }) => (
  <Text
    style={{
      ...styles.badge,
      backgroundColor: threatColor(score) + '20',
      color: threatColor(score),
    }}
  >
    {score}/100
  </Text>
);

export const CtiReportDocument: React.FC<{ data: CtiReportData }> = ({
  data,
}) => (
  <Document>
    {/* Cover */}
    <CoverPage
      title={data.reportTitle}
      systemName={data.systemName ?? 'Open Attack Surface Management'}
      classification={data.classification ?? 'Strictly Confidential'}
      exportedAt={data.exportedAt}
      logoBase64={data.logoBase64}
    />

    {/* Summary */}
    <Page size="A4" style={styles.contentPage}>
      <ReportHeader
        systemName={data.systemName}
        classification={data.classification}
      />
      <SectionHeader title="Executive Summary" />

      <View style={styles.row}>
        <MetricCard label="Targets" value={String(data.totalTargets)} />
        <MetricCard label="Assets" value={String(data.totalAssets)} />
        <MetricCard label="Findings" value={String(data.totalFindings)} />
        <MetricCard
          label="Critical Threats"
          value={String(data.criticalThreats)}
          color={palette.critical}
        />
        <MetricCard
          label="Avg Threat Score"
          value={`${data.avgThreatScore}/100`}
        />
      </View>

      {/* Threat Distribution */}
      <View style={styles.sectionSpacing}>
        <SectionHeader title="Threat Score Distribution" />
        <View>
          {data.threatDistribution.map((d) => (
            <View
              key={d.level}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={{ width: 120, fontSize: 8 }}>{d.level}</Text>
              <View
                style={{
                  width: `${Math.max(d.percent, 2)}%`,
                  height: 12,
                  backgroundColor: d.level.includes('Critical')
                    ? palette.critical
                    : d.level.includes('High')
                      ? palette.high
                      : d.level.includes('Medium')
                        ? palette.medium
                        : d.level.includes('Low')
                          ? palette.low
                          : palette.info,
                  borderRadius: 2,
                  maxWidth: '50%',
                }}
              />
              <Text style={{ fontSize: 8, marginLeft: 4 }}>
                {d.count} ({d.percent}%)
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Assets by Type */}
      <View style={styles.sectionSpacing}>
        <SectionHeader title="Assets by Type" />
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, width: '50%' }}>Type</Text>
          <Text style={{ ...styles.th, width: '25%' }}>Count</Text>
          <Text style={{ ...styles.th, width: '25%' }}>% of Total</Text>
        </View>
        {data.assetsByType.slice(0, 16).map((item, i) => (
          <View
            key={item.type}
            style={{
              ...styles.tableRow,
              ...(i % 2 ? styles.tableRowAlt : {}),
            }}
          >
            <Text style={{ ...styles.td, width: '50%', fontWeight: '600' }}>
              {item.type}
            </Text>
            <Text style={{ ...styles.td, width: '25%' }}>{item.count}</Text>
            <Text style={{ ...styles.td, width: '25%' }}>
              {data.totalAssets > 0
                ? Math.round((item.count / data.totalAssets) * 100)
                : 0}
              %
            </Text>
          </View>
        ))}
      </View>

      <ReportFooter />
    </Page>

    {/* Top Threats */}
    <Page size="A4" style={styles.contentPage}>
      <ReportHeader
        systemName={data.systemName}
        classification={data.classification}
      />
      <SectionHeader title="Top Threat Intelligence Assets" />

      <View style={styles.tableHeader}>
        <Text style={{ ...styles.th, width: '30%' }}>Value</Text>
        <Text style={{ ...styles.th, width: '15%' }}>Type</Text>
        <Text style={{ ...styles.th, width: '15%' }}>Threat Score</Text>
        <Text style={{ ...styles.th, width: '15%' }}>Confidence</Text>
        <Text style={{ ...styles.th, width: '25%' }}>Source</Text>
      </View>
      {data.topThreats.map((asset, i) => (
        <View
          key={asset.id}
          style={{
            ...styles.tableRow,
            ...(i % 2 ? styles.tableRowAlt : {}),
          }}
        >
          <Text
            style={{
              ...styles.td,
              width: '30%',
              fontFamily: 'Inter',
              fontSize: 7,
            }}
          >
            {asset.value.length > 40
              ? asset.value.slice(0, 37) + '...'
              : asset.value}
          </Text>
          <Text style={{ ...styles.td, width: '15%' }}>{asset.type}</Text>
          <View style={{ ...styles.td, width: '15%' }}>
            <ThreatBadge score={asset.threatScore} />
          </View>
          <Text style={{ ...styles.td, width: '15%' }}>
            {Math.round(asset.confidence * 100)}%
          </Text>
          <Text style={{ ...styles.td, width: '25%' }}>
            {asset.source ?? '-'}
          </Text>
        </View>
      ))}

      <ReportFooter />
    </Page>

    {/* Targets Overview */}
    <Page size="A4" style={styles.contentPage}>
      <ReportHeader
        systemName={data.systemName}
        classification={data.classification}
      />
      <SectionHeader title="CTI Targets Overview" />

      <View style={styles.tableHeader}>
        <Text style={{ ...styles.th, width: '30%' }}>Target</Text>
        <Text style={{ ...styles.th, width: '15%' }}>Type</Text>
        <Text style={{ ...styles.th, width: '15%' }}>Assets</Text>
        <Text style={{ ...styles.th, width: '20%' }}>Highest Threat</Text>
        <Text style={{ ...styles.th, width: '20%' }}>Last Scan</Text>
      </View>
      {data.targets.map((target, i) => (
        <View
          key={target.id}
          style={{
            ...styles.tableRow,
            ...(i % 2 ? styles.tableRowAlt : {}),
          }}
        >
          <Text style={{ ...styles.td, width: '30%', fontWeight: '600' }}>
            {target.value.length > 35
              ? target.value.slice(0, 32) + '...'
              : target.value}
          </Text>
          <Text style={{ ...styles.td, width: '15%' }}>{target.type}</Text>
          <Text style={{ ...styles.td, width: '15%' }}>
            {target.assetCount}
          </Text>
          <View style={{ ...styles.td, width: '20%' }}>
            <ThreatBadge score={target.highestThreatScore} />
          </View>
          <Text style={{ ...styles.td, width: '20%' }}>
            {target.lastScanAt
              ? target.lastScanAt.slice(0, 10)
              : 'Never'}
          </Text>
        </View>
      ))}

      <ReportFooter />
    </Page>
  </Document>
);
