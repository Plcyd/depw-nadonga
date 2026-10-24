import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Droplets,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  Wind,
  Gauge,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import { evaluateWaterDrainageSafety } from '../utils/workflowRules.js';

export default function ThresholdAlertNotification({
  currentReadings = {
    h2sPpm: 2.4,
    dissolvedOxygen: 6.4,
    turbidityNtu: 29,
    ammoniaMgL: 1.2,
    flowIndex: 92,
  },
  onNavigateToLab,
}) {
  const [simulationMode, setSimulationMode] = useState('live'); // 'live' | 'gas_spike' | 'silt_choke' | 'anoxia'
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Determine active readings based on simulation toggle
  const activeReadings = useMemo(() => {
    if (simulationMode === 'gas_spike') {
      return {
        h2sPpm: 12.8, // Critical breach >= 10 ppm
        dissolvedOxygen: 4.8, // Warning <= 5.0 mg/L
        turbidityNtu: 42,
        ammoniaMgL: 2.4, // Warning >= 2.0 mg/L
        flowIndex: 78,
      };
    }
    if (simulationMode === 'silt_choke') {
      return {
        h2sPpm: 4.2, // Warning >= 3.0 ppm
        dissolvedOxygen: 4.1, // Warning <= 5.0 mg/L
        turbidityNtu: 88, // Critical breach >= 80 NTU
        ammoniaMgL: 1.8,
        flowIndex: 38, // Critical breach <= 50%
      };
    }
    if (simulationMode === 'anoxia') {
      return {
        h2sPpm: 8.6, // Warning >= 5.0 ppm
        dissolvedOxygen: 2.1, // Critical breach <= 3.0 mg/L
        turbidityNtu: 74, // Warning >= 50 NTU
        ammoniaMgL: 3.6, // Critical breach >= 3.0 mg/L
        flowIndex: 48, // Critical breach <= 50%
      };
    }
    // Default live readings
    return currentReadings;
  }, [simulationMode, currentReadings]);

  const evaluation = useMemo(() => {
    return evaluateWaterDrainageSafety(activeReadings);
  }, [activeReadings]);

  if (dismissed) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className={styles.secondaryBtn}
          style={{ fontSize: '11px', padding: '4px 10px' }}
        >
          <Activity size={13} className="text-cyan-400" />
          <span>Show Safety Threshold Monitor</span>
        </button>
      </div>
    );
  }

  const isCritical = evaluation.overallStatus === 'CRITICAL';
  const isWarning = evaluation.overallStatus === 'WARNING';
  const isNormal = evaluation.overallStatus === 'NORMAL';

  // Visual status theme tokens
  const containerStyle = isCritical
    ? {
        background: 'rgba(88, 14, 28, 0.72)',
        borderColor: 'rgba(244, 63, 94, 0.65)',
        boxShadow: '0 8px 30px -6px rgba(244, 63, 94, 0.35)',
      }
    : isWarning
    ? {
        background: 'rgba(74, 45, 12, 0.68)',
        borderColor: 'rgba(245, 158, 11, 0.65)',
        boxShadow: '0 8px 30px -6px rgba(245, 158, 11, 0.3)',
      }
    : {
        background: 'rgba(6, 44, 34, 0.58)',
        borderColor: 'rgba(52, 211, 153, 0.45)',
        boxShadow: '0 8px 24px -6px rgba(16, 185, 129, 0.25)',
      };

  const statusBadge = isCritical ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/25 border border-rose-400 text-rose-200 animate-pulse">
      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
      CRITICAL SAFETY BREACH
    </span>
  ) : isWarning ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/25 border border-amber-400 text-amber-200">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      CAUTION: ELEVATED THRESHOLD
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 border border-emerald-400 text-emerald-200">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      ALL PARAMETERS SAFE
    </span>
  );

  return (
    <section
      aria-label="Water Quality & Drainage Threshold Safety Monitor"
      data-testid="threshold-alert-container"
      className="p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3"
      style={containerStyle}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isCritical
                ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                : isWarning
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
            }`}
          >
            {isCritical ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
                SAFETY TELEMETRY MONITOR
              </span>
              {statusBadge}
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              {isCritical
                ? `${evaluation.criticalCount} metric(s) exceeded critical hazardous safety limits!`
                : isWarning
                ? `${evaluation.warningCount} metric(s) elevated above standard operational guidelines.`
                : 'All 5 Water Quality & Drainage Conveyance Metrics are within safe regulatory thresholds.'}
            </div>
          </div>
        </div>

        {/* Action Controls & Simulation Quick-Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-700/60 rounded-lg p-1 text-xs">
            <span className="text-[10px] font-mono text-slate-400 px-1 hidden sm:inline">
              TEST:
            </span>
            <button
              type="button"
              onClick={() => setSimulationMode('live')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                simulationMode === 'live'
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setSimulationMode('gas_spike')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                simulationMode === 'gas_spike'
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              H2S Spike (12.8 ppm)
            </button>
            <button
              type="button"
              onClick={() => setSimulationMode('silt_choke')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                simulationMode === 'silt_choke'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Silt Choke (88 NTU)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand metric cards' : 'Collapse metric cards'}
            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer"
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss safety monitor notification"
            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Visual Metric Color Indicator Cards (Expandable) */}
      {!collapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-white/10">
          {evaluation.items.map((item) => {
            const isCrit = item.status === 'CRITICAL';
            const isWarn = item.status === 'WARNING';
            const isNorm = item.status === 'NORMAL';

            // Distinct visual color indicator styling per card
            const itemStyle = isCrit
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : isWarn
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100';

            const indicatorColor = isCrit
              ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
              : isWarn
              ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              : 'bg-emerald-400 shadow-[0_0_8px_#34d399]';

            const statusText = isCrit
              ? 'EXCEEDED'
              : isWarn
              ? 'ELEVATED'
              : 'OPTIMAL';

            const statusTextColor = isCrit
              ? 'text-rose-400'
              : isWarn
              ? 'text-amber-400'
              : 'text-emerald-400';

            return (
              <div
                key={item.key}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${itemStyle}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-white truncate" title={item.label}>
                      {item.label}
                    </span>
                    <span
                      aria-label={`Status: ${item.status}`}
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${indicatorColor}`}
                    />
                  </div>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-mono text-lg font-extrabold text-white">
                      {item.value}
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">{item.unit}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Safe: {item.safeRange}</span>
                    <span className={`font-bold ${statusTextColor}`}>{statusText}</span>
                  </div>
                  <div className="text-[10px] text-slate-200 line-clamp-1" title={item.message}>
                    {item.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Engineering Action Strip when breached */}
      {!collapsed && (isCritical || isWarning) && (
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="font-bold text-amber-300">Recommended DEPW Action:</span>
            <span>
              {isCritical
                ? 'Disclose hazard to Area Engineer. Deploy vacuum flusher truck and test forced-air ventilation.'
                : 'Schedule maintenance inspection before sediment restricts culvert capacity.'}
            </span>
          </div>

          {onNavigateToLab && (
            <button
              type="button"
              onClick={onNavigateToLab}
              className={styles.secondaryBtn}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Open Bioscience Lab Analytics →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
