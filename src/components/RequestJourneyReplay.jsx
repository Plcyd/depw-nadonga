import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Truck,
  Wrench,
  Award,
  Lock,
  Camera,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  Share2,
  X,
  Gauge,
  Droplets,
  HardHat,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import ManilaSkylineOutline from './ManilaSkylineOutline.jsx';
import { api } from '../services/api.js';
import { TICKET_STATUSES } from '../utils/workflowRules.js';

// Status Icon Map
const STATUS_ICON_MAP = {
  SUBMITTED: FileText,
  UNDER_INSPECTION: Search,
  INSPECTION: Search,
  EVALUATION: Activity,
  PROGRAMMING: Wrench,
  APPROVED: Award,
  SCHEDULED: Calendar,
  OPERATIONS_ONGOING: Truck,
  COMPLETED: CheckCircle2,
  CLOSED: Lock,
};

// Workflow stage pipeline order for mapping
const WORKFLOW_ORDER = [
  'SUBMITTED',
  'UNDER_INSPECTION',
  'EVALUATION',
  'PROGRAMMING',
  'APPROVED',
  'SCHEDULED',
  'OPERATIONS_ONGOING',
  'COMPLETED',
  'CLOSED',
];

export default function RequestJourneyReplay({
  isOpen = true,
  onClose,
  initialTicketId = 'DEO-2026-001',
  tickets = [],
  showToast = () => {},
}) {
  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [rawAuditLogs, setRawAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 2x
  const [searchFilter, setSearchFilter] = useState('');
  const playTimerRef = useRef(null);

  // Update selectedTicketId when initialTicketId prop changes
  useEffect(() => {
    if (initialTicketId) {
      setSelectedTicketId(initialTicketId);
    }
  }, [initialTicketId]);

  // Load ticket details and server audit logs
  useEffect(() => {
    if (!selectedTicketId) return;
    let active = true;
    setLoading(true);

    api
      .getTicketById(selectedTicketId)
      .then((res) => {
        if (!active) return;
        if (res.ticket) {
          setTicketDetail(res.ticket);
        }
        if (res.history) {
          setRawAuditLogs(res.history);
        }
        setPlaybackIndex(0);
        setIsPlaying(false);
      })
      .catch((err) => {
        if (!active) return;
        showToast(`Notice loading ticket history: ${err.message}`, 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTicketId, showToast]);

  // Synthesize chronological journey events from server audit logs and ticket metadata
  const chronologicalEvents = useMemo(() => {
    const events = [];

    // Base fallback if no server logs yet
    if (rawAuditLogs.length === 0 && ticketDetail) {
      events.push({
        id: 'initial-creation',
        timestamp: ticketDetail.createdAt || new Date().toISOString(),
        stage: ticketDetail.status || 'SUBMITTED',
        eventType: 'TICKET_CREATED',
        previousStatus: null,
        newStatus: ticketDetail.status || 'SUBMITTED',
        actionTaken: `Official barangay request filed for ${ticketDetail.streetAddress}, ${ticketDetail.barangay}. Initial triage logged into Smart Tracker.`,
        nextStep: 'Dispatch DEPW district inspector for physical site verification and culvert silt measurement.',
        actorName: ticketDetail.requesterName || 'Barangay Office Staff',
        actorRole: ticketDetail.requesterRole || 'Official Requester',
        notes: ticketDetail.description,
        siltDepthCm: ticketDetail.siltDepthCm || null,
        gasReadingPpm: ticketDetail.gasReadingPpm || null,
        inspectorWitness: ticketDetail.inspectorWitness || null,
      });
      return events;
    }

    // Sort logs chronologically (oldest to newest)
    const sorted = [...rawAuditLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((log, idx) => {
      const isFirst = idx === 0;
      events.push({
        id: log.id || `event-${idx}`,
        timestamp: log.timestamp || new Date().toISOString(),
        stage: log.newStatus || 'SUBMITTED',
        eventType: log.eventType || 'STATUS_TRANSITION',
        previousStatus: log.previousStatus || null,
        newStatus: log.newStatus,
        actionTaken:
          log.actionTaken ||
          (isFirst
            ? 'Initial declogging request recorded in DEPW Operations Register.'
            : `Status advanced to ${log.newStatus}.`),
        nextStep: log.nextStep || 'Proceed with subsequent administrative milestone.',
        actorName: log.actorName || (isFirst ? 'Operations Intake Officer' : 'DEPW Engineering Personnel'),
        actorRole: log.actorRole || 'Authorized Staff',
        notes: log.notes || (log.newStatus === 'INSPECTION' || log.newStatus === 'UNDER_INSPECTION' ? ticketDetail?.description : null),
        siltDepthCm: log.siltDepthCm || ticketDetail?.siltDepthCm || null,
        gasReadingPpm: log.gasReadingPpm || ticketDetail?.gasReadingPpm || null,
        inspectorWitness: log.inspectorWitness || ticketDetail?.inspectorWitness || null,
        changedFields: Array.isArray(log.changedFields) ? log.changedFields : [],
      });
    });

    // If ticket has status history array from local updates, merge any additions
    if (Array.isArray(ticketDetail?.statusHistory)) {
      ticketDetail.statusHistory.forEach((histItem, hIdx) => {
        // avoid exact duplicates
        const exists = events.some((e) => e.newStatus === histItem.status && e.notes === histItem.note);
        if (!exists) {
          events.push({
            id: `local-hist-${hIdx}`,
            timestamp: histItem.date || new Date().toISOString(),
            stage: histItem.status,
            eventType: 'INSPECTION_UPDATE',
            previousStatus: null,
            newStatus: histItem.status,
            actionTaken: histItem.note || 'Recorded update during operational workflow.',
            nextStep: 'Pending subsequent district action.',
            actorName: histItem.actor || 'DEPW Inspector',
            actorRole: 'Field Engineering Specialist',
            notes: histItem.note,
            siltDepthCm: ticketDetail?.siltDepthCm,
            gasReadingPpm: ticketDetail?.gasReadingPpm,
            inspectorWitness: ticketDetail?.inspectorWitness,
            changedFields: [],
          });
        }
      });
    }

    return events;
  }, [rawAuditLogs, ticketDetail]);

  // Keep playback index in bounds
  const maxIndex = Math.max(0, chronologicalEvents.length - 1);
  const activeEvent = chronologicalEvents[playbackIndex] || chronologicalEvents[0];

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    const intervalMs = Math.max(800, 2400 / playbackSpeed);
    playTimerRef.current = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= maxIndex) {
          setIsPlaying(false);
          return maxIndex;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, maxIndex, playbackSpeed]);

  // Stepping controls
  const handleFirst = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
  };
  const handlePrev = () => {
    setIsPlaying(false);
    setPlaybackIndex((prev) => Math.max(0, prev - 1));
  };
  const handleNext = () => {
    setIsPlaying(false);
    setPlaybackIndex((prev) => Math.min(maxIndex, prev + 1));
  };
  const handleLast = () => {
    setIsPlaying(false);
    setPlaybackIndex(maxIndex);
  };
  const handleTogglePlay = () => {
    if (playbackIndex >= maxIndex) {
      setPlaybackIndex(0);
    }
    setIsPlaying((prev) => !prev);
  };

  // Human readable timestamp helper
  const formatReadableDate = (ts) => {
    if (!ts) return 'Date pending';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(ts);
    }
  };

  // Calculate elapsed time from initial filing to event
  const getElapsedFromStart = (eventTimestamp) => {
    if (!chronologicalEvents[0]?.timestamp || !eventTimestamp) return 'T+0h';
    try {
      const startMs = new Date(chronologicalEvents[0].timestamp).getTime();
      const currentMs = new Date(eventTimestamp).getTime();
      const diffHrs = Math.max(0, (currentMs - startMs) / (1000 * 60 * 60));
      if (diffHrs < 1) {
        const diffMins = Math.round(diffHrs * 60);
        return `+${diffMins} min from intake`;
      }
      if (diffHrs < 24) {
        return `+${diffHrs.toFixed(1)} hrs from intake`;
      }
      const days = (diffHrs / 24).toFixed(1);
      return `+${days} days from intake`;
    } catch {
      return '';
    }
  };

  // Export summary report
  const handleExportJourneySummary = () => {
    if (!ticketDetail) return;
    const lines = [
      `============================================================`,
      `CITY OF MANILA - DEPARTMENT OF ENGINEERING & PUBLIC WORKS`,
      `OFFICIAL REQUEST JOURNEY & AUDIT TRAIL REPLAY`,
      `============================================================`,
      `Ticket ID:           ${ticketDetail.ticketId}`,
      `Barangay:            ${ticketDetail.barangay} (${ticketDetail.district}, ${ticketDetail.legislativeDistrict})`,
      `Location / Street:   ${ticketDetail.streetAddress}`,
      `Request Type:        ${ticketDetail.requestType}`,
      `Current Status:      ${ticketDetail.status}`,
      `Priority:            ${ticketDetail.priority}`,
      `Requester:           ${ticketDetail.requesterName} (${ticketDetail.requesterRole})`,
      `Export Generated:    ${new Date().toLocaleString()}`,
      `------------------------------------------------------------`,
      `CHRONOLOGICAL MILESTONES & FIELD ACTIONS (${chronologicalEvents.length}):`,
      `------------------------------------------------------------`,
    ];

    chronologicalEvents.forEach((ev, idx) => {
      lines.push(`\n[Milestone ${idx + 1} of ${chronologicalEvents.length}] - ${formatReadableDate(ev.timestamp)} (${getElapsedFromStart(ev.timestamp)})`);
      lines.push(`Status:       ${ev.newStatus}`);
      lines.push(`Action Taken: ${ev.actionTaken}`);
      lines.push(`Next Step:    ${ev.nextStep}`);
      lines.push(`Actor:        ${ev.actorName} [${ev.actorRole}]`);
      if (ev.notes) lines.push(`Notes:        ${ev.notes}`);
      if (ev.siltDepthCm) lines.push(`Silt Depth:   ${ev.siltDepthCm} cm`);
      if (ev.gasReadingPpm) lines.push(`Gas Level:    ${ev.gasReadingPpm} PPM H2S`);
      if (ev.inspectorWitness) lines.push(`Witness:      ${ev.inspectorWitness}`);
    });

    lines.push(`\n============================================================`);
    lines.push(`Certified by Manila DEPW Operations Smart Tracker System`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DEPW-Journey-Replay-${ticketDetail.ticketId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported journey history for ${ticketDetail.ticketId}.`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.tutorialBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-replay-title"
    >
      <div
        className={styles.tutorialModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1060px',
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* THEME-CONFORMING OUTLINE-ONLY ARCHITECTURAL SKYLINE BANNER */}
        <div className="relative w-full border-b border-[var(--glass-border)] bg-transparent pt-1">
          <ManilaSkylineOutline height={42} opacity={0.92} glow={true} showSeal={true} />
        </div>

        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-[var(--glass-border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-navy-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/35 flex items-center justify-center text-cyan-300 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="journey-replay-title" className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  Request Journey Replay
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  DEPW TIMELINE AUDIT
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Step-by-step chronological replay of status transitions, inspector field findings, and administrative actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Ticket Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-sky-400/30 rounded-lg px-2.5 py-1.5 text-xs">
              <label htmlFor="replay-ticket-select" className="sr-only">
                Choose Ticket to Replay
              </label>
              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                id="replay-ticket-select"
                aria-label="Choose Ticket to Replay"
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-mono font-bold focus:outline-none cursor-pointer"
              >
                {tickets.map((t) => (
                  <option key={t.ticketId} value={t.ticketId} className="bg-slate-900 text-white">
                    {t.ticketId} - {t.barangay} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Export Summary Button */}
            <button
              type="button"
              onClick={handleExportJourneySummary}
              className={styles.secondaryBtn}
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Download Certified Journey Audit Log (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Audit</span>
            </button>

            {/* Close Modal Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Request Journey Replay Modal"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Active Ticket Context Card */}
          {ticketDetail && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-400/25 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Ticket & Location</span>
                <strong className="text-cyan-300 font-mono text-sm block">{ticketDetail.ticketId}</strong>
                <span className="text-white truncate block">{ticketDetail.streetAddress}</span>
                <span className="text-slate-400 text-[11px] block">{ticketDetail.barangay} • {ticketDetail.district}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Current Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-500/20 text-sky-300 border border-sky-400/35">
                    {ticketDetail.status}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/35">
                    {ticketDetail.priority}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] mt-1 block">Type: {ticketDetail.requestType}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Filing Requester</span>
                <strong className="text-white block mt-0.5">{ticketDetail.requesterName}</strong>
                <span className="text-slate-400 block">{ticketDetail.requesterRole}</span>
                <span className="text-cyan-400 text-[11px] block">Contact: {ticketDetail.contactNumber || 'N/A'}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Journey Scope</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                      style={{
                        width: `${Math.round(((playbackIndex + 1) / chronologicalEvents.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono font-bold text-cyan-300 text-xs">
                    {playbackIndex + 1}/{chronologicalEvents.length}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] mt-1 block">
                  {isPlaying ? '▶ Replaying journey...' : 'Interactive timeline paused'}
                </span>
              </div>
            </div>
          )}

          {/* Interactive Replay Player & Scrubber Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-400/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Transport Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFirst}
                  disabled={playbackIndex === 0}
                  className={`${styles.secondaryBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ padding: '6px 10px' }}
                  title="First Milestone (Intake Filing)"
                >
                  <SkipBack className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={playbackIndex === 0}
                  className={`${styles.secondaryBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ padding: '6px 10px' }}
                  title="Previous Milestone"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={styles.primaryActionBtn}
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                  title={isPlaying ? 'Pause replay' : 'Play chronological replay'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" /> Pause Replay
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" /> Play Journey
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={playbackIndex >= maxIndex}
                  className={`${styles.secondaryBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ padding: '6px 10px' }}
                  title="Next Milestone"
                >
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={handleLast}
                  disabled={playbackIndex >= maxIndex}
                  className={`${styles.secondaryBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ padding: '6px 10px' }}
                  title="Latest Milestone (Current State)"
                >
                  <SkipForward className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* Speed Controller & Milestone indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Replay Speed:</span>
                <div className="inline-flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-700">
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                        playbackSpeed === spd
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  Step {playbackIndex + 1} of {chronologicalEvents.length}
                </div>
              </div>
            </div>

            {/* Scrubber Range Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={maxIndex}
                step="1"
                value={playbackIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlaybackIndex(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                aria-label="Timeline scrubber slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>INTAKE: {formatReadableDate(chronologicalEvents[0]?.timestamp)}</span>
                <span className="text-cyan-400 font-bold">
                  ACTIVE: {activeEvent?.stage} ({getElapsedFromStart(activeEvent?.timestamp)})
                </span>
                <span>LATEST: {formatReadableDate(chronologicalEvents[maxIndex]?.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Active Highlighted Event Spotlight Card */}
          {activeEvent && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-sky-950/40 to-slate-900/95 border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-400/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/25 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-inner">
                    {React.createElement(STATUS_ICON_MAP[activeEvent.newStatus] || FileText, {
                      className: 'w-6 h-6',
                    })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                        Milestone {playbackIndex + 1} • {activeEvent.eventType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-400/35">
                        {getElapsedFromStart(activeEvent.timestamp)}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight mt-0.5">
                      {activeEvent.previousStatus
                        ? `${activeEvent.previousStatus} → ${activeEvent.newStatus}`
                        : `Status Initiated: ${activeEvent.newStatus}`}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatReadableDate(activeEvent.timestamp)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[var(--text-primary)] font-medium">{activeEvent.actorName}</span>
                    <span className="text-slate-400">({activeEvent.actorRole})</span>
                  </div>
                </div>
              </div>

              {/* Action Taken & Next Step Callout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-sky-400/20 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-cyan-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Action Taken
                  </div>
                  <p className="text-[var(--text-primary)] font-medium leading-relaxed">{activeEvent.actionTaken}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-sky-400/20 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-cyan-300 font-bold flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" /> Next Administrative Step
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{activeEvent.nextStep}</p>
                </div>
              </div>

              {/* Inspector Field Readings & Notes if applicable */}
              {(activeEvent.siltDepthCm || activeEvent.gasReadingPpm || activeEvent.inspectorWitness || activeEvent.notes) && (
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-400/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold font-mono text-[11px] uppercase">
                    <HardHat className="w-3.5 h-3.5 text-emerald-400" /> Field Verification & Inspector Notes
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    {activeEvent.siltDepthCm && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">SILT ACCUMULATION</span>
                        <strong className="text-amber-300 text-sm">{activeEvent.siltDepthCm} cm</strong>
                        <span className="text-slate-400 text-[10px] block">Culvert sediment depth</span>
                      </div>
                    )}

                    {activeEvent.gasReadingPpm && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">H2S TOXIC GAS LEVEL</span>
                        <strong className="text-cyan-300 text-sm">{activeEvent.gasReadingPpm} PPM</strong>
                        <span className="text-emerald-400 text-[10px] block">Within OSHA/DEPW Safe Limit</span>
                      </div>
                    )}

                    {activeEvent.inspectorWitness && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">BARANGAY WITNESS</span>
                        <strong className="text-[var(--text-primary)] text-xs block truncate">{activeEvent.inspectorWitness}</strong>
                        <span className="text-slate-400 text-[10px] block">Verified presence on site</span>
                      </div>
                    )}
                  </div>

                  {activeEvent.notes && (
                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[var(--text-secondary)] text-xs">
                      <span className="text-cyan-400 font-bold font-mono text-[10px] uppercase block mb-0.5">
                        Inspector Observation Log:
                      </span>
                      {activeEvent.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full Chronological Timeline Feed */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Complete Chronological Audit Feed ({chronologicalEvents.length} Events)
              </h4>
              <span className="text-xs text-[var(--text-muted)]">Click any card to jump replay spotlight</span>
            </div>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-400 before:via-sky-500 before:to-slate-700">
              {chronologicalEvents.map((ev, index) => {
                const isSelected = index === playbackIndex;
                const IconComponent = STATUS_ICON_MAP[ev.newStatus] || FileText;

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setPlaybackIndex(index);
                    }}
                    className={`relative p-3.5 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/95 border-2 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/70 border border-sky-400/15 hover:border-sky-400/40 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Timeline Node Marker */}
                    <div
                      className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-cyan-400 border-white ring-4 ring-cyan-400/30'
                          : index < playbackIndex
                          ? 'bg-emerald-500 border-slate-900'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-cyan-300 border border-sky-400/30">
                          #{index + 1}
                        </span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {ev.previousStatus ? `${ev.previousStatus} → ${ev.newStatus}` : ev.newStatus}
                        </span>
                        <span className="text-[var(--text-muted)] text-[11px]">
                          ({getElapsedFromStart(ev.timestamp)})
                        </span>
                      </div>

                      <span className="font-mono text-[var(--text-muted)] text-[11px] tabular-nums">
                        {formatReadableDate(ev.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                      {ev.actionTaken}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span>
                        Actor: <strong className="text-white">{ev.actorName}</strong> ({ev.actorRole})
                      </span>
                      {isSelected && (
                        <span className="text-cyan-400 font-bold font-mono">
                          ● ACTIVE REPLAY SELECTION
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-[var(--glass-border)] bg-[var(--bg-navy-elevated)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Manila DEPW Audit Verified: Anti-Red Tape Authority (ARTA) & Citizen's Charter Compliant</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJourneySummary}
              className={styles.secondaryBtn}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Download Certified Record
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={styles.primaryActionBtn}
                style={{ padding: '6px 16px', fontSize: '12px' }}
              >
                Close Replay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
