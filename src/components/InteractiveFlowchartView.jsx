import React, { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  UserCheck,
  ChevronRight,
  RotateCcw,
  Play,
  Sparkles,
  Info,
  ExternalLink,
  Layers,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import { FLOWCHART_STAGES, TICKET_STATUSES } from '../utils/workflowRules.js';

export default function InteractiveFlowchartView({
  tickets = [],
  onNavigateToTracker,
  showToast,
}) {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [language, setLanguage] = useState('fil'); // 'fil' | 'en'
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationActive, setSimulationActive] = useState(false);

  const selectedStage = FLOWCHART_STAGES[selectedStageIndex];

  // Calculate live tickets in each stage
  const stageCounts = FLOWCHART_STAGES.map((stg) => {
    return tickets.filter((t) => t.status === stg.statusBadge).length;
  });

  const handleAdvanceSimulation = () => {
    if (simulationIndex < FLOWCHART_STAGES.length - 1) {
      const nextIdx = simulationIndex + 1;
      setSimulationIndex(nextIdx);
      setSelectedStageIndex(nextIdx);
      if (showToast) {
        const nextStage = FLOWCHART_STAGES[nextIdx];
        showToast(
          language === 'fil'
            ? `Sumulong sa Hakbang ${nextStage.step}: ${nextStage.titleFil}`
            : `Advanced to Stage ${nextStage.step}: ${nextStage.titleEn}`,
          'success'
        );
      }
    } else {
      setSimulationIndex(0);
      setSelectedStageIndex(0);
      if (showToast) {
        showToast(
          language === 'fil'
            ? 'Natapos ang simulasyon ng buong 8 hakbang! Ulitin mula simula.'
            : 'Completed 8-stage simulation! Reset to start.',
          'info'
        );
      }
    }
  };

  const handleResetSimulation = () => {
    setSimulationIndex(0);
    setSelectedStageIndex(0);
    setSimulationActive(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className={styles.glassPanel} style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <GitBranch size={16} className="text-cyan-400" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                DEPW OPERATIONAL BLUEPRINT • CITY OF MANILA
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {language === 'fil' ? 'Daloy ng Pagsasagawa ng Barangay Declogging' : 'Barangay Declogging Workflow Flowchart'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: '720px' }}>
              {language === 'fil'
                ? 'Opisyal na 8-yugtong proseso mula sa pagkatanggap ng sulat ng Barangay hanggang sa paglilinis at pag-archive ng rekord.'
                : 'Standard 8-stage operational pipeline from initial letter intake to engineering clearance, field desilting, and supervisor sign-off.'}
            </p>
          </div>

          {/* Controls: Language Toggle & Simulator Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(6, 15, 34, 0.75)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '3px',
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage('fil')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: language === 'fil' ? 'var(--accent-cyan)' : 'transparent',
                  color: language === 'fil' ? '#04162e' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                🇵🇭 Filipino
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: language === 'en' ? 'var(--accent-cyan)' : 'transparent',
                  color: language === 'en' ? '#04162e' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                🇺🇸 English
              </button>
            </div>

            <button
              type="button"
              className={styles.orangeActionBtn}
              onClick={() => {
                setSimulationActive(true);
                handleAdvanceSimulation();
              }}
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              <Play size={14} />
              <span>
                {language === 'fil'
                  ? simulationActive ? 'Isulong ang Sample Ticket' : 'Subukan ang Simulasyon'
                  : simulationActive ? 'Advance Sample Ticket' : 'Start Simulation'}
              </span>
            </button>

            {simulationActive && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleResetSimulation}
                style={{ padding: '7px 12px', fontSize: '12px' }}
                title="Reset simulation"
              >
                <RotateCcw size={14} />
                <span>{language === 'fil' ? 'I-reset' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Simulation Banner if active */}
        {simulationActive && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(249, 115, 22, 0.14)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} className="text-orange-400" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fed7aa' }}>
                {language === 'fil'
                  ? `Simulasyon Aktibo: Sample Request (DEO-2026-SIM) ay nasa Hakbang ${FLOWCHART_STAGES[simulationIndex].step} (${FLOWCHART_STAGES[simulationIndex].titleFil})`
                  : `Simulation Active: Sample Request (DEO-2026-SIM) is at Stage ${FLOWCHART_STAGES[simulationIndex].step} (${FLOWCHART_STAGES[simulationIndex].titleEn})`}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#fed7aa', opacity: 0.85 }}>
              {language === 'fil' ? 'Pindutin ang "Isulong" para sundan ang daloy' : 'Click "Advance" to follow the journey'}
            </span>
          </div>
        )}
      </div>

      {/* 8-Stage Interactive Pipeline Grid */}
      <div className={styles.flowchartStageGrid}>
        {FLOWCHART_STAGES.map((stage, idx) => {
          const isSelected = selectedStageIndex === idx;
          const isCurrentSim = simulationActive && simulationIndex === idx;
          const count = stageCounts[idx] || 0;

          return (
            <div
              key={stage.step}
              onClick={() => setSelectedStageIndex(idx)}
              className={`${styles.flowchartCard} ${isSelected ? styles.flowchartCardSelected : ''}`}
              style={{
                borderTop: isCurrentSim ? '3px solid #f97316' : undefined,
              }}
            >
              {/* Top metadata row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isSelected ? 'var(--accent-cyan)' : 'rgba(56, 189, 248, 0.16)',
                    color: isSelected ? '#04162e' : 'var(--text-primary)',
                  }}
                >
                  {stage.step}
                </span>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                  }}
                >
                  {stage.code}
                </span>

                {count > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '1px 6px',
                      borderRadius: '999px',
                    }}
                    title={`${count} active tickets in this stage`}
                  >
                    {count} {language === 'fil' ? 'aktibo' : 'active'}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                {language === 'fil' ? stage.titleFil : stage.titleEn}
              </h3>

              {/* Responsible Role Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <UserCheck size={12} className="text-sky-400 shrink-0" />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {language === 'fil' ? stage.responsibleRoleFil : stage.responsibleRoleEn}
                </span>
              </div>

              {/* Plain summary */}
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {language === 'fil' ? stage.plainDescriptionFil : stage.plainDescriptionEn}
              </p>

              {/* Footer status link */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--glass-border)', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  Status: <strong style={{ color: 'var(--accent-cyan)' }}>{stage.statusBadge}</strong>
                </span>
                <ChevronRight size={14} style={{ color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Comprehensive Inspector Drawer */}
      {selectedStage && (
        <div className={styles.glassPanel} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '6px',
                    background: 'var(--accent-cyan)',
                    color: '#04162e',
                  }}
                >
                  STAGE {selectedStage.step}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {selectedStage.code}
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'fil' ? selectedStage.titleFil : selectedStage.titleEn}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onNavigateToTracker && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => onNavigateToTracker(selectedStage.statusBadge)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <ExternalLink size={13} />
                  <span>
                    {language === 'fil'
                      ? `Tingnan sa Tracker (${stageCounts[selectedStageIndex] || 0})`
                      : `View in Smart Tracker (${stageCounts[selectedStageIndex] || 0})`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 3-Column Detailed Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {/* Column 1: Plain Language Meaning & Responsibility */}
            <div className={styles.glassCard} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Info size={14} className="text-cyan-400" />
                <span className={styles.fieldLabel} style={{ margin: 0 }}>
                  {language === 'fil' ? 'Paliwanag at Responsableng Opisyal' : 'Explanation & Responsible Unit'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.55, marginTop: '6px' }}>
                {language === 'fil' ? selectedStage.plainDescriptionFil : selectedStage.plainDescriptionEn}
              </p>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'fil' ? 'Responsableng Tanggapan:' : 'Designated Responsible Unit:'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  {language === 'fil' ? selectedStage.responsibleRoleFil : selectedStage.responsibleRoleEn}
                </div>
              </div>
            </div>

            {/* Column 2: Requirements & Inputs */}
            <div className={styles.glassCard} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <FileText size={14} className="text-amber-400" />
                <span className={styles.fieldLabel} style={{ margin: 0 }}>
                  {language === 'fil' ? 'Mga Kinakailangang Rekisito' : 'Required Inputs & Documents'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {(language === 'fil' ? selectedStage.requiredInputsFil : selectedStage.requiredInputsEn).map(
                  (req, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Column 3: Next Step & Official Safeguard */}
            <div className={styles.glassCard} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className={styles.fieldLabel} style={{ margin: 0 }}>
                  {language === 'fil' ? 'Susunod na Hakbang at Regulasyon' : 'Expected Action & Safeguard'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '6px' }}>
                {language === 'fil' ? 'Inaasahang Aksyon ng Kawani:' : 'Expected Operational Action:'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '2px', lineHeight: 1.45 }}>
                {language === 'fil' ? selectedStage.expectedNextActionFil : selectedStage.expectedNextActionEn}
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                  {language === 'fil' ? 'Patakaran sa Pamamahala:' : 'Administrative Policy Safeguard:'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                  {language === 'fil' ? selectedStage.officialNoteFil : selectedStage.officialNoteEn}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
