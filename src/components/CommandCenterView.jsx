import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  Clock,
  Droplets,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  History,
  CheckCircle2,
  Layers,
  Filter,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import { api } from '../services/api.js';
import { MANILA_16_DISTRICTS, TICKET_STATUSES } from '../utils/workflowRules.js';
import ThresholdAlertNotification from './ThresholdAlertNotification.jsx';

const CHART_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f97316', '#f43f5e', '#a855f7', '#2dd4bf'];

export default function CommandCenterView({
  tickets = [],
  metricsData: externalMetricsData = null,
  onInspectTicketAudit,
  onOpenTicketAudit,
  onOpenSmartTracker,
  onNavigateTab,
  showToast,
}) {
  const [metricsData, setMetricsData] = useState(externalMetricsData);
  const [loading, setLoading] = useState(false);
  const [waterMetricFocus, setWaterMetricFocus] = useState('all'); // 'all' | 'gas' | 'turbidity'
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');

  useEffect(() => {
    if (externalMetricsData) {
      setMetricsData(externalMetricsData);
    }
  }, [externalMetricsData]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getMetrics();
      setMetricsData(data);
    } catch (err) {
      if (showToast) showToast(`Telemetry refresh error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [tickets.length]);

  const filteredTickets = useMemo(() => {
    if (selectedDistrictFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.district === selectedDistrictFilter);
  }, [tickets, selectedDistrictFilter]);

  // Active Projects by Manila District & Type for BarChart
  const districtProjectData = useMemo(() => {
    const map = {};
    filteredTickets.forEach((t) => {
      const dist = t.district || 'Unassigned';
      if (!map[dist]) {
        map[dist] = {
          district: dist,
          Declogging: 0,
          Desilting: 0,
          RepairAndClearance: 0,
          total: 0,
        };
      }
      if (t.requestType === 'Declogging') {
        map[dist].Declogging += 1;
      } else if (t.requestType === 'Desilting') {
        map[dist].Desilting += 1;
      } else {
        map[dist].RepairAndClearance += 1;
      }
      map[dist].total += 1;
    });

    const arr = Object.values(map);
    if (arr.length === 0) {
      return [
        { district: 'Tondo', Declogging: 2, Desilting: 1, RepairAndClearance: 1 },
        { district: 'Sampaloc', Declogging: 2, Desilting: 0, RepairAndClearance: 1 },
        { district: 'Ermita', Declogging: 1, Desilting: 1, RepairAndClearance: 0 },
        { district: 'Quiapo', Declogging: 1, Desilting: 1, RepairAndClearance: 0 },
      ];
    }
    return arr;
  }, [filteredTickets]);

  // Status distribution for PieChart
  const statusPieData = useMemo(() => {
    const counts = {};
    filteredTickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredTickets]);

  const quarterlyResolutionTrends = metricsData?.quarterlyResolutionTrends || [
    { week: 'Oct W1', avgResolutionDays: 4.6, slaTargetDays: 3.5, completedCount: 11, activeProjects: 18 },
    { week: 'Oct W2', avgResolutionDays: 4.1, slaTargetDays: 3.5, completedCount: 15, activeProjects: 21 },
    { week: 'Oct W3', avgResolutionDays: 3.4, slaTargetDays: 3.5, completedCount: 19, activeProjects: 16 },
    { week: 'Oct W4', avgResolutionDays: 2.8, slaTargetDays: 3.5, completedCount: 23, activeProjects: 14 },
    { week: 'Nov W1 (Proj)', avgResolutionDays: 2.5, slaTargetDays: 3.5, completedCount: 26, activeProjects: 12 },
    { week: 'Nov W2 (Proj)', avgResolutionDays: 2.3, slaTargetDays: 3.5, completedCount: 28, activeProjects: 10 },
  ];

  const waterQualityTrends = metricsData?.waterQualityTrends || [
    { period: 'Oct 01', dissolvedOxygen: 4.2, h2sPpm: 8.4, turbidityNtu: 68, ammoniaMgL: 3.1, flowIndex: 62 },
    { period: 'Oct 05', dissolvedOxygen: 4.6, h2sPpm: 7.2, turbidityNtu: 61, ammoniaMgL: 2.8, flowIndex: 68 },
    { period: 'Oct 10', dissolvedOxygen: 5.1, h2sPpm: 5.9, turbidityNtu: 52, ammoniaMgL: 2.4, flowIndex: 74 },
    { period: 'Oct 15', dissolvedOxygen: 5.5, h2sPpm: 4.5, turbidityNtu: 44, ammoniaMgL: 1.9, flowIndex: 81 },
    { period: 'Oct 20', dissolvedOxygen: 6.1, h2sPpm: 3.2, turbidityNtu: 36, ammoniaMgL: 1.5, flowIndex: 88 },
    { period: 'Oct 23', dissolvedOxygen: 6.4, h2sPpm: 2.4, turbidityNtu: 29, ammoniaMgL: 1.2, flowIndex: 92 },
  ];

  const recentAuditHistory = metricsData?.recentHistory || [];
  const qSummary = metricsData?.quarterSummary || {
    quarter: 'Q4 2026 (Oct – Dec)',
    avgResolutionDays: 3.1,
    previousQuarterAvgDays: 4.8,
    improvementPercent: 35.4,
    waterQualityCompliance: 92.4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Command Center Header Banner */}
      <div className={styles.glassPanel} style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Activity size={18} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#38bdf8' }}>
                DEPW MANILA EXECUTIVE TELEMETRY • {qSummary.quarter}
              </span>
            </div>
            <h1 className={styles.pageHeading} style={{ fontSize: '28px', margin: '4px 0 0' }}>
              Operations Command Center: Active Projects, Water Quality & Resolution Analytics
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <select
              className={styles.glassSelect}
              style={{ width: 'auto', minWidth: '185px', fontSize: '14px', fontWeight: 600 }}
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              aria-label="Filter Command Center by Manila District"
            >
              <option value="ALL">All 16 Manila Districts</option>
              {MANILA_16_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.legislativeDistrict})
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={fetchMetrics}
              disabled={loading}
              style={{ fontSize: '14px' }}
            >
              <RefreshCw size={15} />
              <span>{loading ? 'Syncing...' : 'Refresh Telemetry'}</span>
            </button>

            {(onOpenSmartTracker || onNavigateTab) && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => {
                  if (onOpenSmartTracker) onOpenSmartTracker();
                  else if (onNavigateTab) onNavigateTab('tracker');
                }}
                style={{ fontSize: '14px' }}
              >
                <span>Open Smart Tracker</span>
                <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 4 Quarterly Executive KPI Cards */}
        <div className={styles.metricGrid} style={{ marginTop: '20px' }}>
          <div className={styles.metricTile}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.04em' }}>
                ACTIVE DECLOGGING PROJECTS
              </span>
              <Layers size={18} color="#38bdf8" />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '32px', fontWeight: 800 }}>{filteredTickets.length}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Across {Object.keys(metricsData?.byDistrict || {}).length || 5} Manila districts
            </div>
          </div>

          <div className={styles.metricTile}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.04em' }}>
                Q4 RESOLUTION TIME AVERAGE
              </span>
              <Clock size={18} color="#34d399" />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '32px', fontWeight: 800 }}>{qSummary.avgResolutionDays}d</div>
            <div style={{ fontSize: '14px', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <TrendingDown size={15} /> {qSummary.improvementPercent}% faster vs Q3 ({qSummary.previousQuarterAvgDays}d)
            </div>
          </div>

          <div className={styles.metricTile}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#818cf8', letterSpacing: '0.04em' }}>
                WATER QUALITY COMPLIANCE
              </span>
              <Droplets size={18} color="#818cf8" />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '32px', fontWeight: 800 }}>{qSummary.waterQualityCompliance}%</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              DO: 6.4 mg/L • H2S: 2.4 ppm (Safe Threshold)
            </div>
          </div>

          <div className={styles.metricTile}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.04em' }}>
                SERVER AUDIT TRAIL EVENTS
              </span>
              <History size={18} color="#fbbf24" />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '32px', fontWeight: 800 }}>{recentAuditHistory.length}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              100% status transitions & field edits logged
            </div>
          </div>
        </div>
      </div>

      {/* Water Quality & Drainage Safety Threshold Notification Component */}
      <ThresholdAlertNotification
        currentReadings={waterQualityTrends[waterQualityTrends.length - 1] || {
          h2sPpm: 2.4,
          dissolvedOxygen: 6.4,
          turbidityNtu: 29,
          ammoniaMgL: 1.2,
          flowIndex: 92,
        }}
        onNavigateToLab={() => onNavigateTab && onNavigateTab('bioscience')}
      />

      {/* Primary Charts Grid: Resolution Time Averages & Water Quality Trends */}
      <div className={styles.splitGrid}>
        {/* Chart 1: Current Quarter Resolution Time Averages vs SLA Target */}
        <div className={styles.glassPanel} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                QUARTERLY SERVICE VELOCITY (Q4 2026)
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '3px 0 0 0' }}>
                Resolution Time Averages (Days) vs. SLA Benchmark
              </h3>
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}>
              Target SLA: &lt;= 3.5 Days
            </span>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quarterlyResolutionTrends} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="resDaysGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(7, 16, 38, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="avgResolutionDays"
                  name="Avg Resolution (Days)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#resDaysGrad)"
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="slaTargetDays"
                  name="SLA Target (3.5d)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Drainage Water Quality & Gas Safety Trends */}
        <div className={styles.glassPanel} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ENVIRONMENTAL SENSOR TELEMETRY
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '3px 0 0 0' }}>
                Drainage Water Quality & Culvert Gas Trends
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'DO & Gas (mg/L • ppm)' },
                { id: 'turbidity', label: 'Turbidity & Flow (%)' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  className={waterMetricFocus === btn.id ? styles.primaryBtn : styles.secondaryBtn}
                  style={{ padding: '5px 10px', fontSize: '11px' }}
                  onClick={() => setWaterMetricFocus(btn.id)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waterQualityTrends} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(7, 16, 38, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                {waterMetricFocus === 'all' ? (
                  <>
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="dissolvedOxygen"
                      name="Dissolved Oxygen (mg/L)"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="h2sPpm"
                      name="H2S Culvert Gas (ppm)"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="ammoniaMgL"
                      name="Ammonia (mg/L)"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="flowIndex"
                      name="Hydraulic Flow Efficiency (%)"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="turbidityNtu"
                      name="Suspended Silt Turbidity (NTU)"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid: Active Declogging Projects by District & Workflow Status Distribution */}
      <div className={styles.splitGrid}>
        {/* Chart 3: Active Declogging Projects by District */}
        <div className={styles.glassPanel} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              DISTRICT WORKLOAD DISTRIBUTION
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '3px 0 0 0' }}>
              Active Declogging, Desilting & Repair Projects by Manila District
            </h3>
          </div>

          <div style={{ width: '100%', height: '270px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtProjectData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="district" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(7, 16, 38, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar isAnimationActive={false} dataKey="Declogging" name="Drainage Declogging" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="Desilting" name="Canal Desilting" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="RepairAndClearance" name="Manhole & Gutter Works" stackId="a" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Workflow Status Breakdown */}
        <div className={styles.glassPanel} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              PIPELINE STAGE BREAKDOWN
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '3px 0 0 0' }}>
              Tickets by Engineering Workflow Status
            </h3>
          </div>

          <div style={{ width: '100%', height: '270px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(7, 16, 38, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Server-Side Audit Trail Stream */}
      <div className={styles.glassPanel} style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SERVER-SIDE AUDIT LOGGING ENGINE (SQLITE + FIRESTORE)
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '3px 0 0 0' }}>
              Recent Ticket Status Transitions & Field Edits
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Click any audit entry to inspect its dedicated Audit Log tab in the Smart Tracker
          </span>
        </div>

        <div className={styles.dataTableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Ticket ID</th>
                <th>Event Type</th>
                <th>Status Transition</th>
                <th>Summary & Modified Fields</th>
                <th>Recorded By</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditHistory.slice(0, 8).map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.monoText} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className={styles.monoText} style={{ fontWeight: 700, color: '#38bdf8' }}>
                    {entry.ticketId}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background:
                          entry.eventType === 'STATUS_TRANSITION'
                            ? 'rgba(56, 189, 248, 0.16)'
                            : entry.eventType === 'FIELD_EDIT'
                            ? 'rgba(245, 158, 11, 0.18)'
                            : 'rgba(16, 185, 129, 0.16)',
                        color:
                          entry.eventType === 'STATUS_TRANSITION'
                            ? '#7dd3fc'
                            : entry.eventType === 'FIELD_EDIT'
                            ? '#fde68a'
                            : '#6ee7b7',
                      }}
                    >
                      {entry.eventType}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <span style={{ opacity: 0.75 }}>{entry.previousStatus}</span>
                    {' → '}
                    <strong style={{ color: '#38bdf8' }}>{entry.newStatus}</strong>
                  </td>
                  <td style={{ fontSize: '12px', maxWidth: '360px' }}>
                    <div>{entry.actionTaken}</div>
                    {entry.changedFields && entry.changedFields.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {entry.changedFields.slice(0, 3).map((cf, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(148, 163, 184, 0.14)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {cf.label}: {cf.before} → {cf.after}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{entry.actorName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{entry.actorRole}</div>
                  </td>
                  <td>
                    {(onInspectTicketAudit || onOpenTicketAudit) && (
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                        onClick={() => {
                          if (onInspectTicketAudit) onInspectTicketAudit(entry.ticketId);
                          else if (onOpenTicketAudit) onOpenTicketAudit(entry.ticketId);
                        }}
                      >
                        Audit Tab
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
