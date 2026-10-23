import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Grid,
  Copy,
  Check,
  Volume2,
  ShieldCheck,
  FileText,
  Compass,
  Wrench,
  ArrowRight,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import {
  WORKFLOW_STAGES,
  LEGISLATIVE_DISTRICTS,
  MANILA_16_DISTRICTS,
  calculateDashboardMetrics,
} from '../utils/workflowRules.js';
import { api } from '../services/api.js';

const SLIDES = [
  {
    number: '01',
    title: 'HANDLING OF BARANGAY DECLOGGING REQUESTS',
    shortTitle: 'Title & Vision',
    speakerNotes:
      'Magandang araw po sa lahat. Today we present our proposed AI-Assisted Workflow and Smart Tracker for handling Barangay Declogging Requests at the Department of Engineering Office. Please note that all records shown today are fictional training examples.',
  },
  {
    number: '02',
    title: 'Understanding Barangay Declogging Requests',
    shortTitle: 'Understanding Requests',
    speakerNotes:
      'Ano po ba ang declogging request? Barangay officials submit requests when canals, gutters, or storm drains accumulate silt and debris. Proper maintenance helps support water flow, while actual scheduling and approval always depend on authorized engineering personnel.',
  },
  {
    number: '03',
    title: 'Sample Barangay Request Letter',
    shortTitle: 'Sample Request Letter',
    speakerNotes:
      'Narito po ang isang fictional sample letter mula sa Barangay 123 SAMPLE through Kagawad Juan D. Cruz. Notice how clearly it states the street segment and observed silt buildup without fabricating any official approval stamps.',
  },
  {
    number: '04',
    title: 'From Request to Resolution',
    shortTitle: '8-Stage Liaison Workflow',
    speakerNotes:
      'Sinusundan po natin ang walo (8) na malinaw na hakbang: Receive, Verify, Register, Endorse, Inspect, Schedule, Implement, at Close. Click any stage to inspect the responsible role and expected next action.',
  },
  {
    number: '05',
    title: 'Transforming Manual Work into Organized Digital Coordination',
    shortTitle: 'Before & After (Triple-A)',
    speakerNotes:
      'Sa kaliwa, makikita ang hamon ng manual logbooks. Sa kanan, ang proposed Triple-A Framework: Automate repetitive recording, Assist staff with draft templates, and uphold Accountability through human verification.',
  },
  {
    number: '06',
    title: 'Smart Tracker: One View of Every Request',
    shortTitle: 'Smart Tracker Dashboard',
    speakerNotes:
      'Ito po ang puso ng sistema: ang Smart Tracker. All top metrics—Total Requests, Pending Verification, Pending Evaluation, Inspection Scheduled, and Completed—are dynamically calculated from our persistent database.',
  },
  {
    number: '07',
    title: 'Innovation with Accountability',
    shortTitle: 'Privacy, AI Ethics & Seal',
    speakerNotes:
      'We pair innovation with strict governance: Data Minimization, Privacy & Consent, Responsible AI with dummy data for demos, Human Verification, and the symbolism of the Philippine Transparency Seal.',
  },
  {
    number: '08',
    title: 'Better Tracking. Better Coordination. Better Public Service.',
    shortTitle: 'Conclusion & Q&A',
    speakerNotes:
      'Bilang pagtatapos: Organization, Efficiency, at Accountability. AI will not replace responsible public servants—used wisely, it can help them serve more effectively. Maraming salamat po, and we welcome your questions.',
  },
];

export default function PresentationDeck({
  tickets = [],
  onOpenSmartTracker,
  onSelectTicketForMap,
  onOpenCreateModal,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [groupName, setGroupName] = useState('Group 4 — Engineering Liaison & Process Innovation Team');
  const [presentationDate, setPresentationDate] = useState('October 23, 2026');
  const [selectedWorkflowIndex, setSelectedWorkflowIndex] = useState(2);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState('');
  const [slideSearch, setSlideSearch] = useState('');
  const [slideStatusFilter, setSlideStatusFilter] = useState('ALL');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');

  const metrics = calculateDashboardMetrics(tickets);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const sampleLetterText = `Date: October 20, 2026
To: Department of Engineering Office
From: Barangay 123 SAMPLE
Through: Juan D. Cruz, Barangay Kagawad — DUMMY NAME
Subject: Request for Drainage Declogging at Sample Street

“Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig. Hinihiling po namin ang inyong pagsusuri at koordinasyon para sa posibleng iskedyul ng operasyon. Maraming salamat po.”`;

  const handleCopyLetter = () => {
    navigator.clipboard?.writeText(sampleLetterText);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleSpeakLetter = async () => {
    setTtsLoading(true);
    setTtsError('');
    try {
      const result = await api.generateTtsAudio({
        text: 'Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig.',
        voice: 'Kore',
      });
      if (result.audioBase64) {
        const audio = new Audio(`data:${result.mimeType || 'audio/wav'};base64,${result.audioBase64}`);
        await audio.play();
      }
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : 'TTS playback unavailable');
    } finally {
      setTtsLoading(false);
    }
  };

  const filteredSlideTickets = tickets.filter((t) => {
    const q = slideSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.ticketId.toLowerCase().includes(q) ||
      t.barangay.toLowerCase().includes(q) ||
      t.district.toLowerCase().includes(q);
    const matchesStatus = slideStatusFilter === 'ALL' || t.status === slideStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeStage = WORKFLOW_STAGES[selectedWorkflowIndex] || WORKFLOW_STAGES[0];
  const slideMeta = SLIDES[currentSlide];

  return (
    <section aria-label="Interactive Presentation Deck" className="space-y-5">
      {/* Top Presentation Control Strip */}
      <div className={`${styles.glassPanel} flex flex-wrap items-center justify-between gap-4 py-3 px-5`}>
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/image_81ca72a0.png"
            alt="Department of Engineering and Public Works Manila Seal"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-contain bg-white/90 p-0.5"
          />
          <div>
            <div className="text-xs font-semibold tracking-wider text-sky-300">
              DEPARTMENT OF ENGINEERING OFFICE • TRAINING DEMO • DUMMY DATA
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="tabular-nums text-cyan-400">
                {slideMeta.number} / 08
              </span>
              <span aria-hidden="true">·</span>
              <span>{slideMeta.shortTitle}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs hidden lg:block">
          <div className="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-sky-400/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
              style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className={styles.secondaryBtn}
          >
            <span className="inline-flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </span>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className={styles.primaryActionBtn}
          >
            <span className="inline-flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowOverview((v) => !v)}
            aria-label="Toggle Slide Overview"
            className={styles.secondaryBtn}
          >
            <span className="inline-flex items-center gap-1.5">
              <Grid className="w-4 h-4" /> Overview
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            aria-label="Toggle Speaker Notes"
            className={styles.secondaryBtn}
          >
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Notes
            </span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen Presentation"
            className={styles.secondaryBtn}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide Overview Jump Drawer */}
      {showOverview && (
        <div className={`${styles.glassPanel} grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5`}>
          {SLIDES.map((s, idx) => (
            <button
              key={s.number}
              type="button"
              onClick={() => {
                setCurrentSlide(idx);
                setShowOverview(false);
              }}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                idx === currentSlide
                  ? 'bg-sky-500/25 border-cyan-400 text-white'
                  : 'bg-slate-900/60 border-sky-400/15 text-slate-300 hover:border-sky-400/40'
              }`}
            >
              <div className="text-xs font-mono text-cyan-400 font-bold">SLIDE {s.number}</div>
              <div className="text-xs font-semibold mt-1 line-clamp-2">{s.shortTitle}</div>
            </button>
          ))}
        </div>
      )}

      {/* Main Slide Stage */}
      <div className={`${styles.glassPanel} min-h-[540px] flex flex-col justify-between relative overflow-hidden`}>
        {/* SLIDE 1 — PREMIUM TITLE SCREEN */}
        {currentSlide === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-4">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_5aec6efb.png"
                  alt="Official Seal of Lungsod ng Maynila"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full bg-white p-1 object-contain shadow-md"
                />
                <img
                  src="/assets/aistudio/image_81ca72a0.png"
                  alt="Department of Engineering and Public Works Manila Seal"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full bg-white p-1 object-contain shadow-md"
                />
                <div className="text-xs font-medium text-sky-300">
                  <div>REPUBLIC OF THE PHILIPPINES • CITY OF MANILA</div>
                  <div className="text-amber-300 font-semibold">
                    DUMMY DATA / TRAINING DEMONSTRATION
                  </div>
                </div>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                HANDLING OF BARANGAY DECLOGGING REQUESTS
              </h1>

              <p className="text-lg sm:text-xl text-sky-200 font-medium max-w-2xl">
                AI-Assisted Workflow, Request Tracking, and Service Coordination
              </p>

              <div className="pt-2 text-sm text-slate-300">
                <span className="font-semibold text-white">Department:</span> Department of Engineering Office (DEPW Manila)
              </div>

              {/* Editable Placeholders for Group Name & Presentation Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-xl">
                <div>
                  <label htmlFor="pres-group-name" className="block text-xs text-sky-300 mb-1">
                    Presenter / Group Name Placeholder
                  </label>
                  <input
                    id="pres-group-name"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={styles.inputControl}
                  />
                </div>
                <div>
                  <label htmlFor="pres-date" className="block text-xs text-sky-300 mb-1">
                    Presentation Date Placeholder
                  </label>
                  <input
                    id="pres-date"
                    type="text"
                    value={presentationDate}
                    onChange={(e) => setPresentationDate(e.target.value)}
                    className={styles.inputControl}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={nextSlide}
                  className={styles.primaryActionBtn}
                >
                  Start Presentation Tour →
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide(5)}
                  className={styles.secondaryBtn}
                >
                  Jump to Slide 06 (Smart Tracker)
                </button>
              </div>
            </div>

            {/* Right: Glossy Glass Dashboard Illustration & Floating Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/90 via-slate-900/90 to-blue-950/90 border border-sky-400/30 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
                  <span className="text-xs font-mono text-cyan-300">
                    DEO COMMAND VIEW • SAMPLE DATA
                  </span>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {tickets.length} RECORDED REQUESTS
                  </span>
                </div>

                {/* Floating Translucent Status Cards */}
                <div className="space-y-3">
                  <div className={styles.glassCardInteractive}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-300">STAGE 01–02</span>
                      <span className="text-xs text-sky-200">Brgy 456 SAMPLE</span>
                    </div>
                    <div className="font-bold text-white mt-1">Request Received</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Intake logged with reference number DEO-2026-002 and completeness verification checklist.
                    </p>
                  </div>

                  <div className={styles.glassCardInteractive}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-300">STAGE 03–04</span>
                      <span className="text-xs text-sky-200">Brgy 123 SAMPLE</span>
                    </div>
                    <div className="font-bold text-white mt-1">Pending Evaluation</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Endorsed to Engineering Evaluation Team for drainage profile review (DEO-2026-001).
                    </p>
                  </div>

                  <div className={styles.glassCardInteractive}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-300">STAGE 05–06</span>
                      <span className="text-xs text-sky-200">Brgy 789 SAMPLE</span>
                    </div>
                    <div className="font-bold text-white mt-1">Inspection Coordination</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Ocular assessment coordinated with Barangay officials prior to operational queuing (DEO-2026-003).
                    </p>
                  </div>
                </div>

                {/* Abstract Drainage Infrastructure Line SVG */}
                <svg
                  viewBox="0 0 400 64"
                  className="w-full h-14 opacity-80"
                  aria-label="Abstract drainage infrastructure flow lines"
                >
                  <path
                    d="M 10 32 Q 100 8, 200 32 T 390 32"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                  <path
                    d="M 10 48 Q 100 24, 200 48 T 390 48"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                  />
                  <circle cx="75" cy="21" r="4" fill="#06b6d4" />
                  <circle cx="200" cy="32" r="5" fill="#38bdf8" />
                  <circle cx="325" cy="42" r="4" fill="#60a5fa" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2 — UNDERSTANDING THE REQUEST */}
        {currentSlide === 1 && (
          <div className="space-y-6 my-auto">
            <div className="space-y-2">
              <div className="text-xs font-mono text-cyan-400">SLIDE 02 • SERVICE CONTEXT & MANILA DISTRICTS</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Understanding Barangay Declogging Requests
              </h2>
              <p className="text-sm sm:text-base text-slate-200 max-w-4xl">
                A declogging request seeks assistance in removing obstructions from public drainage systems, canals, gutters, and storm drains. Proper drainage maintenance supports water flow and can help reduce localized flooding. Barangay Officials may submit requests for evaluation and coordination.
              </p>
            </div>

            {/* 3 Glossy Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={styles.glassCardInteractive}>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">1. REQUEST INTAKE</h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  Barangay officials submit a formal letter identifying the obstructed street segment, drainage structure, and local point person for coordination.
                </p>
              </div>

              <div className={styles.glassCardInteractive}>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 mb-3">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">2. DRAINAGE ASSESSMENT</h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  Engineering personnel review completeness, verify the canal or culvert location, and conduct a site inspection when needed to determine required equipment.
                </p>
              </div>

              <div className={styles.glassCardInteractive}>
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-3">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">3. FIELD OPERATIONS</h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  Once evaluated and scheduled by authorized supervisors, maintenance teams perform declogging, desilting, and debris haulage in coordination with the Barangay.
                </p>
              </div>
            </div>

            {/* Visual Process Strip */}
            <div className="p-4 rounded-xl bg-slate-900/75 border border-sky-400/25">
              <div className="text-xs font-mono text-sky-300 mb-2">
                END-TO-END COORDINATION FLOW (SUBJECT TO AUTHORIZED APPROVAL & PROCEDURES)
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-white">
                <span className="px-3 py-1.5 rounded bg-sky-500/20 border border-sky-400/30">
                  Barangay Request
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="px-3 py-1.5 rounded bg-sky-500/20 border border-sky-400/30">
                  Engineering Review
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="px-3 py-1.5 rounded bg-sky-500/20 border border-sky-400/30">
                  Inspection
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="px-3 py-1.5 rounded bg-sky-500/20 border border-sky-400/30">
                  Scheduling
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-400/30">
                  Field Operations
                </span>
              </div>
            </div>

            {/* Manila 6 Legislative Districts & 16 Recognized Districts Reference */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-sky-200">
                  City of Manila Coverage: 6 Legislative Districts & 16 Recognized Districts
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDistrictFilter('ALL')}
                    className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                      selectedDistrictFilter === 'ALL'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    All 6 Legislative Districts
                  </button>
                  {LEGISLATIVE_DISTRICTS.map((ld) => (
                    <button
                      key={ld.id}
                      type="button"
                      onClick={() => setSelectedDistrictFilter(ld.id)}
                      className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                        selectedDistrictFilter === ld.id
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ld.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LEGISLATIVE_DISTRICTS.filter(
                  (ld) => selectedDistrictFilter === 'ALL' || ld.id === selectedDistrictFilter
                ).map((ld) => (
                  <div
                    key={ld.id}
                    className="p-3 rounded-lg bg-slate-900/60 border border-sky-400/15 text-xs space-y-1"
                  >
                    <div className="font-bold text-cyan-300">{ld.name}</div>
                    <div className="text-slate-300">{ld.coverage}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-400">
                <strong className="text-slate-200">16 Specific Districts of Manila:</strong>{' '}
                {MANILA_16_DISTRICTS.map((d) => d.name).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3 — INTERACTIVE SAMPLE REQUEST LETTER */}
        {currentSlide === 2 && (
          <div className="space-y-5 my-auto">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-cyan-400">SLIDE 03 • DOCUMENT MOCKUP</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Sample Barangay Request Letter
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLetter}
                  className={styles.secondaryBtn}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {copiedLetter ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedLetter ? 'Copied Sample Text' : 'Copy Letter Text'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleSpeakLetter}
                  disabled={ttsLoading}
                  className={styles.primaryActionBtn}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    {ttsLoading ? 'Synthesizing Audio...' : 'Listen (Gemini TTS)'}
                  </span>
                </button>
              </div>
            </div>

            {ttsError && (
              <div className="text-xs text-amber-300 bg-amber-950/50 border border-amber-500/30 rounded-lg px-3 py-2">
                Audio Readout Note: {ttsError}
              </div>
            )}

            {/* Realistic Frosted Document Panel */}
            <div className={styles.documentSheet}>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/image_5aec6efb.png"
                    alt="Lungsod ng Maynila Seal"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      FICTIONAL BARANGAY TRANSMITTAL • DUMMY TEMPLATE
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      BARANGAY 123 SAMPLE — CITY OF MANILA
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-slate-600">
                  <div>DOC REF: REF-BRGY-DEO-2026-001</div>
                  <div className="text-amber-700 font-bold">NOT AN OFFICIAL GOVERNMENT DOCUMENT</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5 bg-slate-100 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-600">Date:</span>{' '}
                  <span className="font-bold text-slate-900">October 20, 2026</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">To:</span>{' '}
                  <span className="font-bold text-slate-900">Department of Engineering Office</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">From:</span>{' '}
                  <span className="font-bold text-slate-900">Barangay 123 SAMPLE</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Through:</span>{' '}
                  <span className="font-bold text-slate-900">
                    Juan D. Cruz, Barangay Kagawad — DUMMY NAME
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-600">Subject:</span>{' '}
                  <span className="font-bold text-slate-900">
                    Request for Drainage Declogging at Sample Street
                  </span>
                </div>
              </div>

              <blockquote className="text-base sm:text-lg leading-relaxed text-slate-800 font-medium bg-white p-5 rounded-lg border border-slate-200 shadow-inner">
                “Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig. Hinihiling po namin ang inyong pagsusuri at koordinasyon para sa posibleng iskedyul ng operasyon. Maraming salamat po.”
              </blockquote>

              <div className="mt-5 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>WATERMARK: DUMMY TEMPLATE • TRAINING DEMONSTRATION ONLY</span>
                <span>No signatures, personal phone numbers, or official stamps are fabricated.</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4 — END-TO-END LIAISON WORKFLOW */}
        {currentSlide === 3 && (
          <div className="space-y-6 my-auto">
            <div>
              <div className="text-xs font-mono text-cyan-400">SLIDE 04 • INTERACTIVE 8-STAGE TIMELINE</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                From Request to Resolution
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Click any stage below to inspect the responsible role, sample status, and expected next administrative or engineering action.
              </p>
            </div>

            {/* 8 Stage Interactive Timeline Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {WORKFLOW_STAGES.map((st, idx) => {
                const isSelected = idx === selectedWorkflowIndex;
                const isCompleted = idx < selectedWorkflowIndex;
                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setSelectedWorkflowIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/30 border-cyan-300 shadow-lg'
                        : isCompleted
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-slate-200'
                        : 'bg-slate-900/60 border-sky-400/15 text-slate-300 hover:border-sky-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-cyan-300">{st.step}</span>
                      <span>{isCompleted ? 'DONE' : isSelected ? 'ACTIVE' : 'PENDING'}</span>
                    </div>
                    <div className="font-extrabold text-sm text-white mt-1.5">{st.code}</div>
                    <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">{st.title}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Stage Detail Inspector */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-400/30 grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
              <div className="lg:col-span-2 space-y-2">
                <div className="text-xs font-mono text-cyan-300">
                  STAGE {activeStage.step} — {activeStage.code}
                </div>
                <h3 className="text-xl font-bold text-white">{activeStage.title}</h3>
                <p className="text-sm text-slate-200">{activeStage.description}</p>
              </div>
              <div className="space-y-2 text-xs bg-slate-950/75 p-4 rounded-lg border border-sky-400/20">
                <div>
                  <span className="text-slate-400">Responsible Role:</span>
                  <div className="font-semibold text-white mt-0.5">{activeStage.responsibleRole}</div>
                </div>
                <div>
                  <span className="text-slate-400">Sample Tracker Status:</span>
                  <div className="font-mono text-cyan-300 mt-0.5">{activeStage.sampleStatus}</div>
                </div>
                <div>
                  <span className="text-slate-400">Expected Next Action:</span>
                  <div className="text-slate-200 mt-0.5">{activeStage.expectedNextAction}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5 — BEFORE AND AFTER: TRIPLE-A APPLICATION */}
        {currentSlide === 4 && (
          <div className="space-y-6 my-auto">
            <div>
              <div className="text-xs font-mono text-cyan-400">SLIDE 05 • PROCESS IMPROVEMENT FRAMEWORK</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Transforming Manual Work into Organized Digital Coordination
              </h2>
              <p className="text-xs text-amber-300 mt-1">
                Proposed Triple-A Framework for this training demonstration (not an official policy; no fabricated performance percentages).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
              {/* LEFT PANEL: BEFORE */}
              <div className="lg:col-span-5 p-5 rounded-xl bg-rose-950/25 border border-rose-400/25 space-y-3">
                <div className="text-xs font-mono text-rose-300 font-bold">
                  LEFT PANEL: BEFORE — MANUAL PROCESS
                </div>
                <h3 className="text-lg font-bold text-white">Fragmented Paper & Manual Follow-Ups</h3>
                <ul className="space-y-2 text-sm text-slate-200 list-disc pl-5">
                  <li>Handwritten logbooks.</li>
                  <li>Difficult record retrieval.</li>
                  <li>Repeated manual follow-ups.</li>
                  <li>Inconsistent status visibility.</li>
                  <li>Risk of duplicate entries.</li>
                  <li>Time spent preparing repetitive documents.</li>
                </ul>
              </div>

              {/* Center Visual Transformation Bridge */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-cyan-300 mt-1">TRIPLE-A</span>
              </div>

              {/* RIGHT PANEL: AFTER */}
              <div className="lg:col-span-5 p-5 rounded-xl bg-sky-950/35 border border-cyan-400/35 space-y-3">
                <div className="text-xs font-mono text-cyan-300 font-bold">
                  RIGHT PANEL: AFTER — AI-ASSISTED PROCESS
                </div>
                <h3 className="text-lg font-bold text-white">Structured Smart Tracker & Human-Reviewed AI</h3>
                <ul className="space-y-2 text-sm text-slate-200 list-disc pl-5">
                  <li>Organized Smart Tracker database & spreadsheet export.</li>
                  <li>Consistent request and letter templates.</li>
                  <li>Automatic timestamps when configured.</li>
                  <li>Structured status monitoring.</li>
                  <li>Easier search and record retrieval.</li>
                  <li>AI-assisted drafting with human review.</li>
                  <li>Configurable notifications where supported.</li>
                </ul>
              </div>
            </div>

            {/* Triple-A Framework Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300 font-bold">PILLAR 01</div>
                <div className="text-base font-bold text-white mt-1">A — AUTOMATE</div>
                <p className="text-xs text-slate-300 mt-1">
                  Automate repetitive administrative steps where appropriate, such as ticket ID generation and intake timestamp logging.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300 font-bold">PILLAR 02</div>
                <div className="text-base font-bold text-white mt-1">A — ASSIST</div>
                <p className="text-xs text-slate-300 mt-1">
                  Assist personnel with AI-generated drafts, missing-information checks, and concise record summaries.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300 font-bold">PILLAR 03</div>
                <div className="text-base font-bold text-white mt-1">A — ACCOUNTABILITY</div>
                <p className="text-xs text-slate-300 mt-1">
                  Accountability through organized tracking, human verification, and documented status history actions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6 — SMART TRACKER DASHBOARD */}
        {currentSlide === 5 && (
          <div className="space-y-5 my-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-cyan-400">
                  SLIDE 06 • LIVE OPERATIONS DASHBOARD (SAMPLE DATA)
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Smart Tracker: One View of Every Request
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className={styles.orangeActionBtn}
                >
                  + Add Sample Request
                </button>
                <button
                  type="button"
                  onClick={onOpenSmartTracker}
                  className={styles.primaryActionBtn}
                >
                  Open Full Smart Tracker Workspace →
                </button>
              </div>
            </div>

            {/* 5 Top Metric Cards Calculated from Sample Dataset */}
            <div className={styles.metricGrid}>
              <div className={styles.metricTile}>
                <div className="text-xs font-mono text-slate-300">TOTAL REQUESTS</div>
                <div className={styles.metricValue}>{metrics.totalRequests}</div>
              </div>
              <div className={styles.metricTile}>
                <div className="text-xs font-mono text-amber-300">PENDING VERIFICATION</div>
                <div className={styles.metricValue}>{metrics.pendingVerification}</div>
              </div>
              <div className={styles.metricTile}>
                <div className="text-xs font-mono text-sky-300">PENDING EVALUATION</div>
                <div className={styles.metricValue}>{metrics.pendingEvaluation}</div>
              </div>
              <div className={styles.metricTile}>
                <div className="text-xs font-mono text-cyan-300">INSPECTION SCHEDULED</div>
                <div className={styles.metricValue}>{metrics.inspectionScheduled}</div>
              </div>
              <div className={styles.metricTile}>
                <div className="text-xs font-mono text-emerald-300">COMPLETED REQUESTS</div>
                <div className={styles.metricValue}>{metrics.completedRequests}</div>
              </div>
            </div>

            {/* Quick Search & Filter inside Slide 6 */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={slideSearch}
                onChange={(e) => setSlideSearch(e.target.value)}
                placeholder="Search Ticket ID or sample barangay..."
                aria-label="Search tickets in Slide 6"
                className={`${styles.inputControl} max-w-xs`}
              />
              <select
                value={slideStatusFilter}
                onChange={(e) => setSlideStatusFilter(e.target.value)}
                aria-label="Filter by status in Slide 6"
                className={`${styles.inputControl} max-w-xs`}
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending Evaluation">Pending Evaluation</option>
                <option value="For Verification">For Verification</option>
                <option value="Inspection Scheduled">Inspection Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              {(slideSearch || slideStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSlideSearch('');
                    setSlideStatusFilter('ALL');
                  }}
                  className={styles.secondaryBtn}
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Main Request Table */}
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Date Received</th>
                    <th>Ticket ID</th>
                    <th>Barangay</th>
                    <th>Request Type</th>
                    <th>Status</th>
                    <th>Action Taken</th>
                    <th>Next Step</th>
                    <th>Map</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlideTickets.slice(0, 5).map((t) => (
                    <tr key={t.ticketId}>
                      <td className="tabular-nums">{t.dateReceived}</td>
                      <td className="tabular-nums font-bold text-cyan-300">{t.ticketId}</td>
                      <td>{t.barangay}</td>
                      <td>{t.requestType}</td>
                      <td>
                        <span className="font-medium text-sky-200">{t.status}</span>
                      </td>
                      <td>{t.actionTaken}</td>
                      <td>{t.nextStep}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onSelectTicketForMap && onSelectTicketForMap(t)}
                          className="text-xs text-cyan-300 hover:underline cursor-pointer"
                        >
                          View on Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE 7 — DATA PRIVACY, AI ETHICS, AND RESPONSIBLE USE */}
        {currentSlide === 6 && (
          <div className="space-y-5 my-auto">
            <div>
              <div className="text-xs font-mono text-cyan-400">SLIDE 07 • GOVERNANCE, ETHICS & TRANSPARENCY</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Innovation with Accountability
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300">CARD 1</div>
                <h3 className="text-base font-bold text-white mt-1">DATA MINIMIZATION</h3>
                <p className="text-xs text-slate-300 mt-1.5">
                  Only collect information necessary for authorized service processing.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300">CARD 2</div>
                <h3 className="text-base font-bold text-white mt-1">PRIVACY AND CONSENT</h3>
                <p className="text-xs text-slate-300 mt-1.5">
                  Provide an appropriate privacy notice before collecting personal contact details. Obtain consent when required by applicable rules and use approved channels.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300">CARD 3</div>
                <h3 className="text-base font-bold text-white mt-1">RESPONSIBLE AI</h3>
                <p className="text-xs text-slate-300 mt-1.5">
                  Do not upload confidential records or unnecessary personal information to unauthorized AI services. Use dummy data for demonstrations.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-xs font-mono text-cyan-300">CARD 4</div>
                <h3 className="text-base font-bold text-white mt-1">HUMAN VERIFICATION</h3>
                <p className="text-xs text-slate-300 mt-1.5">
                  Authorized personnel must review AI-generated letters, summaries, and recommendations before official use.
                </p>
              </div>
            </div>

            {/* Shield Illustration & Warning */}
            <div className="p-4 rounded-xl bg-sky-950/60 border border-cyan-400/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-sm font-extrabold tracking-wide text-white">
                    “PRIVACY BY DESIGN. HUMAN OVERSIGHT. RESPONSIBLE PUBLIC SERVICE.”
                  </div>
                  <div className="text-xs text-amber-300 mt-0.5">
                    Important Notice: AI cannot independently authorize public works operations. Follow approved policies and applicable privacy laws.
                  </div>
                </div>
              </div>
            </div>

            {/* Philippine Transparency Seal Symbolism Section using Uploaded Asset */}
            <div className="p-4 rounded-xl bg-slate-900/75 border border-sky-400/20 flex flex-col sm:flex-row items-center gap-4">
              <img
                src="/assets/aistudio/image_79da53c5.png"
                alt="Philippine Transparency Seal"
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-contain shrink-0 bg-white/95 rounded-full p-1"
              />
              <div className="space-y-1 text-xs text-slate-200">
                <div className="font-bold text-sky-300 uppercase tracking-wider">
                  Philippine Transparency Seal — Symbolism
                </div>
                <p>
                  A pearl buried inside a tightly-shut shell is practically worthless. Government information is a pearl, meant to be shared with the public in order to maximize its inherent value. The Transparency Seal, depicted by a pearl shining out of an open shell, is a symbol of a policy shift towards openness in access to government information—solidifying the position of the Philippines as the Pearl of the Orient.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 8 — CONCLUSION AND Q&A */}
        {currentSlide === 7 && (
          <div className="space-y-6 my-auto">
            <div>
              <div className="text-xs font-mono text-cyan-400">SLIDE 08 • CONCLUSION & OPEN DISCUSSION</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Better Tracking. Better Coordination. Better Public Service.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={styles.glassCardInteractive}>
                <div className="text-sm font-mono font-bold text-cyan-400">01 — ORGANIZATION</div>
                <p className="text-base font-semibold text-white mt-2">
                  Every request has a recorded reference and status.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-sm font-mono font-bold text-cyan-400">02 — EFFICIENCY</div>
                <p className="text-base font-semibold text-white mt-2">
                  AI can assist with repetitive documentation and summaries.
                </p>
              </div>
              <div className={styles.glassCardInteractive}>
                <div className="text-sm font-mono font-bold text-cyan-400">03 — ACCOUNTABILITY</div>
                <p className="text-base font-semibold text-white mt-2">
                  Human review and official authorization remain essential.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/80 via-blue-950/80 to-slate-900/80 border border-cyan-400/35 text-center space-y-3">
              <blockquote className="text-lg sm:text-2xl font-bold text-white italic">
                “AI will not replace responsible public servants. Used wisely, it can help them serve more effectively.”
              </blockquote>
              <div className="text-sm text-sky-300 font-semibold">
                Thank You • Questions & Answers
              </div>
              <div className="text-xs text-slate-400">
                DEPARTMENT OF ENGINEERING OFFICE • TRAINING DEMONSTRATION • DUMMY DATA ONLY
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSlide(0)}
                  className={styles.secondaryBtn}
                >
                  Return to Slide 01
                </button>
                <button
                  type="button"
                  onClick={() => setShowOverview(true)}
                  className={styles.primaryActionBtn}
                >
                  Open Slide Overview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Slide Footer */}
        <div className="pt-4 mt-6 border-t border-sky-400/15 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>DEPARTMENT OF ENGINEERING OFFICE — CITY OF MANILA</span>
          <span>
            {groupName} · {presentationDate}
          </span>
          <span className="font-mono text-amber-300">TRAINING DEMO • DUMMY DATA</span>
        </div>
      </div>

      {/* Presenter Speaker Notes Bar */}
      {showNotes && (
        <div className={`${styles.glassPanel} py-3 px-5 bg-slate-950/80`}>
          <div className="text-xs font-mono text-cyan-300 mb-1">
            PRESENTER SPEAKER NOTES (FILIPINO-ENGLISH TALKING POINTS • SLIDE {slideMeta.number})
          </div>
          <p className="text-sm text-slate-200">{slideMeta.speakerNotes}</p>
        </div>
      )}
    </section>
  );
}
