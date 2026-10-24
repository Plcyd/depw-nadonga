import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Info,
  Sliders,
  BarChart3,
  Table2,
  GitBranch,
  AlertTriangle,
  Search,
  Eye,
  Type,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';

export default function TutorialManager({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  showToast,
  onThemeChange,
  onTextScaleToggle,
  onHighContrastToggle,
  onEasyModeToggle,
  currentTheme = 'navy-glass',
  isLargeText = false,
  isHighContrast = false,
  isEasyMode = false,
}) {
  // Check local storage on load
  const [internalIsOpen, setInternalIsOpen] = useState(() => {
    try {
      const completed =
        localStorage.getItem('tutorialCompleted') ||
        localStorage.getItem('depw_tutorial_completed');
      return completed !== 'true';
    } catch {
      return true;
    }
  });

  // Effective open state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Slide state: 0 to 5
  // 0: Welcome
  // 1: Dashboard & Safety Metrics
  // 2: Smart Tracker & Audit Trail
  // 3: 8-Stage Workflow & Safety Protocols
  // 4: Accessibility & Settings
  // 5: Practice Sandbox & Completion
  const [currentSlide, setCurrentSlide] = useState(0);
  const [language, setLanguage] = useState('fil'); // 'fil' | 'en'

  // Interactive state for Slide 1 (Dashboard / Thresholds)
  const [simulatedGasLevel, setSimulatedGasLevel] = useState(1.8);

  // Interactive state for Slide 2 (Tracker Search)
  const [trackerSearchTerm, setTrackerSearchTerm] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');

  // Interactive state for Slide 5 (Practice Ticket)
  const [practiceTicket, setPracticeTicket] = useState({
    ticketId: 'DEO-2026-PRACTICE',
    barangay: 'Barangay 128, Zone 10',
    district: 'Tondo',
    streetAddress: 'Velasquez cor. Estero de Vitas Rd.',
    status: 'For Verification',
    historyCount: 1,
  });

  const totalSlides = 6;

  const markCompleted = () => {
    try {
      localStorage.setItem('tutorialCompleted', 'true');
      localStorage.setItem('depw_tutorial_completed', 'true');
    } catch {
      // gracefully ignore storage failures
    }
    setInternalIsOpen(false);
    if (externalOnClose) externalOnClose();
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      markCompleted();
      if (showToast) {
        showToast(
          language === 'fil'
            ? 'Binabati kita! Handa ka nang gamitin ang DEPW Assist.'
            : 'Congratulations! You are ready to use DEPW Assist.',
          'success'
        );
      }
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    markCompleted();
    if (showToast) {
      showToast(
        language === 'fil'
          ? 'Nalampasan ang tutorial. Maaari mo itong buksang muli anumang oras.'
          : 'Tutorial skipped. You can replay it anytime from the top bar.',
        'info'
      );
    }
  };

  const handleRestart = () => {
    setCurrentSlide(0);
    setSimulatedGasLevel(1.8);
    setPracticeTicket({
      ticketId: 'DEO-2026-PRACTICE',
      barangay: 'Barangay 128, Zone 10',
      district: 'Tondo',
      streetAddress: 'Velasquez cor. Estero de Vitas Rd.',
      status: 'For Verification',
      historyCount: 1,
    });
    if (showToast) {
      showToast(
        language === 'fil' ? 'Naibalik sa simula ang tutorial.' : 'Restarted tutorial from beginning.',
        'info'
      );
    }
  };

  // Practice advance
  const handleAdvancePracticeTicket = () => {
    const statuses = [
      'For Verification',
      'Pending Evaluation',
      'Inspection Scheduled',
      'Scheduled for Implementation',
      'In Progress',
      'Completed',
      'Closed',
    ];
    const currIdx = statuses.indexOf(practiceTicket.status);
    const nextIdx = (currIdx + 1) % statuses.length;
    setPracticeTicket((prev) => ({
      ...prev,
      status: statuses[nextIdx],
      historyCount: prev.historyCount + 1,
    }));
    if (showToast) {
      showToast(
        language === 'fil'
          ? `Nailipat ang katayuan sa: ${statuses[nextIdx]}`
          : `Advanced practice status to: ${statuses[nextIdx]}`,
        'success'
      );
    }
  };

  if (!isOpen) return null;

  const slidesData = [
    {
      titleFil: 'Maligayang Pagdating sa DEPW Assist',
      titleEn: 'Welcome to DEPW Assist',
      categoryFil: 'Opisyal na Panimula • Lungsod ng Maynila',
      categoryEn: 'Official Orientation • City of Manila',
      instructionFil:
        'Ang DEPW Assist ay ang command center ng Department of Engineering and Public Works (DEPW) para sa mabilis at malinaw na paglilinis ng mga baradong kanal sa buong Maynila.',
      instructionEn:
        'DEPW Assist is the official public works command center for managing, inspecting, and executing barangay declogging and drainage requests across the City of Manila.',
    },
    {
      titleFil: 'Command Center Dashboard at Safety Metrics',
      titleEn: 'Command Center Dashboard & Safety Metrics',
      categoryFil: 'Suriin ang Datos at Kaligtasan sa Imburnal',
      categoryEn: 'Monitor Metrics & Culvert Gas Safety',
      instructionFil:
        'Tingnan ang kabuuang bilang ng mga aktibong declogging projects at ang awtomatikong alerto sa mapanganib na H2S gas (< 3.0 ppm safe limit) bago magpadala ng tauhan.',
      instructionEn:
        'Monitor active declogging operations, turnaround averages, and real-time alerts for hazardous H2S sewer gases (< 3.0 ppm safe limit) to safeguard field teams.',
    },
    {
      titleFil: 'Smart Tracker at Immutable Audit Trail',
      titleEn: 'Smart Tracker & Immutable Audit Trail',
      categoryFil: 'Paghahanap at Integridad ng Rekord',
      categoryEn: 'Search, Filters & Audit History',
      instructionFil:
        'Mabilisang hanapin ang anumang kahilingan gamit ang search bar o pagsala ayon sa Distrito ng Maynila. Lahat ng pagbabago ay may tamper-proof audit history alinsunod sa RA 6713.',
      instructionEn:
        'Locate any barangay request instantly by street or district. Every status change generates an immutable server audit diff preserving complete accountability.',
    },
    {
      titleFil: '8-Stage Workflow Pipeline at Inspection Protocols',
      titleEn: '8-Stage Workflow Pipeline & Safety Protocols',
      categoryFil: 'Daloy ng Trabaho mula Intake hanggang Closure',
      categoryEn: 'Workflow Stages from Intake to Closure',
      instructionFil:
        'Sundin ang 8 opisyal na yugto (Intake, Verify, Register, Endorse, Inspect, Schedule, Implement, Close). Walang nalalaktawang inspeksyon para ligtas ang bawat komunidad.',
      instructionEn:
        'Follow the transparent 8-stage pipeline. Engineering inspections, confined space testing, and signed barangay acknowledgments ensure full compliance.',
    },
    {
      titleFil: 'Accessibility, Typography at System Settings',
      titleEn: 'Accessibility, Typography & System Settings',
      categoryFil: 'Pagpili ng Tema, Font Size, at Contrast',
      categoryEn: 'Themes, Font Scaling, and High Contrast',
      instructionFil:
        'Maaari mong baguhin ang hitsura ng sistema: pumili ng maliwanag na tema (Daylight), paganahin ang mas malaking teksto (Large Text), o lakasan ang contrast para madaling mabasa.',
      instructionEn:
        'Customize your workspace for maximum readability: switch to Daylight Glass themes, activate Large Text scaling (115%), or turn on High Contrast mode.',
    },
    {
      titleFil: 'Ligtas na Pagsasanay (Practice) at Pagsisimula',
      titleEn: 'Hands-on Practice Sandbox & Completion',
      categoryFil: 'Subukan Nang Walang Kaba',
      categoryEn: 'Interactive Tryout & Certification',
      instructionFil:
        'Subukang magpalit ng status sa practice ticket sa ibaba. Hinding-hindi maaapektuhan ang totoong database ng opisina. Pagkatapos, handa ka nang pumasok sa live workspace!',
      instructionEn:
        'Test status advancement on the practice ticket below safely without affecting live City of Manila records. Click Enter Workspace when you are ready!',
    },
  ];

  const currentSlideData = slidesData[currentSlide];

  return (
    <div
      className={styles.tutorialBackdrop}
      onClick={handleSkip}
      role="dialog"
      aria-modal="true"
      aria-label="DEPW Assist Tutorial Manager"
    >
      <div
        className={styles.tutorialModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '95%',
        }}
      >
        {/* City of Manila Official Skyline Strip */}
        <div style={{ width: '100%', height: '54px', overflow: 'hidden' }}>
          <img
            src="/assets/aistudio/image_f915b5a7.png"
            alt="City of Manila Skyline Header"
            className={styles.skylineBannerImg}
          />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-navy-mid)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img
                src="/assets/aistudio/image_5aec6efb.png"
                alt="Manila Seal"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <img
                src="/assets/aistudio/image_81ca72a0.png"
                alt="DEPW Seal"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-cyan)',
                }}
              >
                {language === 'fil'
                  ? 'MANILA DEPW • GABAY SA PAGGAMIT'
                  : 'MANILA DEPW • SYSTEM TUTORIAL'}
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                DEPW Assist Welcome & Tutorial
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language Switcher */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(4, 12, 28, 0.85)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage('fil')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: language === 'fil' ? 'var(--accent-cyan)' : 'transparent',
                  color: language === 'fil' ? '#04162e' : 'var(--text-secondary)',
                }}
              >
                🇵🇭 Tagalog
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: language === 'en' ? 'var(--accent-cyan)' : 'transparent',
                  color: language === 'en' ? '#04162e' : 'var(--text-secondary)',
                }}
              >
                🇺🇸 English
              </button>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              aria-label="Close Tutorial"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Slide Step Progress Bar & Indicators */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(4, 10, 26, 0.6)',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              {language === 'fil'
                ? `Slide ${currentSlide + 1} ng ${totalSlides}: `
                : `Slide ${currentSlide + 1} of ${totalSlides}: `}
              <span style={{ color: 'var(--accent-cyan)' }}>
                {language === 'fil' ? currentSlideData.categoryFil : currentSlideData.categoryEn}
              </span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {Math.round(((currentSlide + 1) / totalSlides) * 100)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: '5px',
              width: '100%',
              background: 'rgba(148, 163, 184, 0.25)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((currentSlide + 1) / totalSlides) * 100}%`,
                background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
                transition: 'width 240ms ease',
              }}
            />
          </div>

          {/* Slide Jump Buttons */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 0, label: '01 Welcome' },
              { id: 1, label: '02 Dashboard' },
              { id: 2, label: '03 Tracker' },
              { id: 3, label: '04 Workflow' },
              { id: 4, label: '05 Settings' },
              { id: 5, label: '06 Practice' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(s.id)}
                className={`${styles.lessonPill} ${currentSlide === s.id ? styles.lessonPillActive : ''}`}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  minHeight: '34px',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Slide Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '62vh' }}>
          {/* Slide Heading & Big Readable Instruction (17-19px target) */}
          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 10px',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}
            >
              {language === 'fil' ? currentSlideData.titleFil : currentSlideData.titleEn}
            </h3>
            <p
              style={{
                fontSize: '17px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {language === 'fil' ? currentSlideData.instructionFil : currentSlideData.instructionEn}
            </p>
          </div>

          {/* ======================================================== */}
          {/* SLIDE 0: WELCOME & MANDATE */}
          {/* ======================================================== */}
          {currentSlide === 0 && (
            <div>
              <div
                style={{
                  background: 'rgba(15, 31, 68, 0.8)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}
                >
                  🏛️ {language === 'fil' ? 'Pangunahing Tungkulin ng Sistema:' : 'Core System Mandate:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <strong>{language === 'fil' ? 'Digital na Talaan:' : 'Digital Intake:'}</strong>{' '}
                      {language === 'fil'
                        ? 'Wala nang nawawalang papel. Bawat sulat ng barangay ay may Reference ID.'
                        : 'Zero paper loss. Every barangay transmittal receives a permanent reference ID.'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <strong>{language === 'fil' ? 'Pagsusuri at Kaligtasan:' : 'Ocular & Gas Safety:'}</strong>{' '}
                      {language === 'fil'
                        ? 'Pagsusuri sa gas (H2S < 3.0 ppm) at ocular visit bago magbaba ng kagamitan.'
                        : 'Atmospheric multigas testing safeguards crews before opening deep culverts.'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <strong>{language === 'fil' ? 'Audit Trail at Transparency:' : 'Immutable Audit Trail:'}</strong>{' '}
                      {language === 'fil'
                        ? 'Nakatala kung sino ang nagpalit ng katayuan at kailan ito ginawa (RA 6713).'
                        : 'Cryptographic logs track all field updates in compliance with RA 6713.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 1: DASHBOARD & THRESHOLDS */}
          {/* ======================================================== */}
          {currentSlide === 1 && (
            <div>
              {/* Highlighted Dashboard Metric Cards Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--accent-cyan)',
                    boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
                    borderRadius: '12px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {language === 'fil' ? 'Kabuuang Kahilingan' : 'Total Requests'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    34
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Q4 Declogging Cycle
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                    {language === 'fil' ? 'Naka-iskedyul sa Operasyon' : 'Scheduled Operations'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    8
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Jetting & Vacuum Crews
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7' }}>
                    {language === 'fil' ? 'Bilis ng Pag-aksyon' : 'Resolution Average'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    3.8 days
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Citizen&apos;s Charter Standard
                  </div>
                </div>
              </div>

              {/* Interactive Sensor Threshold Test */}
              <div className={styles.sandboxContainer}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  ⚠️ {language === 'fil' ? 'Subukan ang Color Indicators ng Sensor Alert:' : 'Interactive Threshold Simulator:'}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setSimulatedGasLevel(1.8)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: simulatedGasLevel === 1.8 ? '#059669' : 'rgba(15, 23, 42, 0.7)',
                      color: '#ffffff',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                    }}
                  >
                    🟢 {language === 'fil' ? 'Ligtas (1.8 ppm)' : 'Safe (1.8 ppm)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedGasLevel(6.2)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: simulatedGasLevel === 6.2 ? '#d97706' : 'rgba(15, 23, 42, 0.7)',
                      color: '#ffffff',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                    }}
                  >
                    🟡 {language === 'fil' ? 'Babala (6.2 ppm)' : 'Warning (6.2 ppm)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedGasLevel(12.5)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: simulatedGasLevel === 12.5 ? '#dc2626' : 'rgba(15, 23, 42, 0.7)',
                      color: '#ffffff',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                    }}
                  >
                    🔴 {language === 'fil' ? 'Kritikal (12.5 ppm)' : 'Critical (12.5 ppm)'}
                  </button>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background:
                      simulatedGasLevel >= 10
                        ? 'rgba(220, 38, 38, 0.2)'
                        : simulatedGasLevel >= 5
                        ? 'rgba(217, 119, 6, 0.2)'
                        : 'rgba(5, 150, 105, 0.18)',
                    border: `1.5px solid ${
                      simulatedGasLevel >= 10
                        ? '#ef4444'
                        : simulatedGasLevel >= 5
                        ? '#f59e0b'
                        : '#10b981'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <AlertTriangle
                    size={24}
                    color={
                      simulatedGasLevel >= 10
                        ? '#f87171'
                        : simulatedGasLevel >= 5
                        ? '#fbbf24'
                        : '#34d399'
                    }
                    className="shrink-0"
                  />
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong>
                      H2S Culvert Gas Level: {simulatedGasLevel} ppm (Safe limit &lt; 3.0 ppm).
                    </strong>
                    <div>
                      {simulatedGasLevel >= 10
                        ? 'HAZARD EXCEEDED: Evacuate culvert immediately. Do not dispatch field workers!'
                        : simulatedGasLevel >= 5
                        ? 'ELEVATED GAS DETECTED: Ventilate manhole with air blowers before entry.'
                        : 'SAFE CONFINED SPACE: Optimal conditions for inspection and silt extraction.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 2: SMART TRACKER & AUDIT */}
          {/* ======================================================== */}
          {currentSlide === 2 && (
            <div>
              <div className={styles.sandboxContainer}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  🔍 {language === 'fil' ? 'Subukan ang Live Search sa Tracker:' : 'Live Search & Filter Sandbox:'}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="text"
                      value={trackerSearchTerm}
                      onChange={(e) => setTrackerSearchTerm(e.target.value)}
                      placeholder={
                        language === 'fil'
                          ? 'I-type hal. "Velasquez" o "128"...'
                          : 'Type e.g. "Velasquez" or "128"...'
                      }
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid var(--accent-cyan)',
                        color: '#ffffff',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <select
                    value={selectedDistrictFilter}
                    onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid var(--glass-border)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    <option value="ALL">All Districts</option>
                    <option value="Tondo">Tondo (1st & 2nd Dist)</option>
                    <option value="Sampaloc">Sampaloc (4th Dist)</option>
                    <option value="Binondo">Binondo (3rd Dist)</option>
                  </select>
                </div>

                {/* Filtered Sample Item Preview with Diff */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      DEO-2026-001
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      Pending Evaluation
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Barangay 128, Zone 10 — Velasquez St. cor. Estero de Vitas Rd.
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: '#cbd5e1',
                    }}
                  >
                    <span style={{ color: '#38bdf8' }}>[AUDIT DIFF]</span> status: &quot;For Verification&quot; → &quot;Pending Evaluation&quot; (Author: Engr. M. Ramos)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 3: 8-STAGE WORKFLOW */}
          {/* ======================================================== */}
          {currentSlide === 3 && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  marginBottom: '16px',
                }}
              >
                {[
                  { step: '01', title: 'INTAKE', desc: 'Receive and stamp Barangay letter' },
                  { step: '02', title: 'VERIFY', desc: 'Confirm street landmarks and Kagawad' },
                  { step: '03', title: 'REGISTER', desc: 'Assign unique DEO tracking number' },
                  { step: '04', title: 'ENDORSE', desc: 'Technical review by civil engineer' },
                  { step: '05', title: 'INSPECT', desc: 'On-site ocular and H2S gas check' },
                  { step: '06', title: 'SCHEDULE', desc: 'Assign jetting truck and road crew' },
                  { step: '07', title: 'IMPLEMENT', desc: 'Suck silt and restore water conveyance' },
                  { step: '08', title: 'CLOSE', desc: 'Signed Barangay acknowledgment' },
                ].map((st) => (
                  <div
                    key={st.step}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      Stage {st.step} • {st.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {st.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 4: ACCESSIBILITY & SETTINGS */}
          {/* ======================================================== */}
          {currentSlide === 4 && (
            <div>
              <div
                style={{
                  background: 'rgba(15, 31, 68, 0.8)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                  }}
                >
                  ⚙️ {language === 'fil' ? 'Subukan ang Accessibility Controls:' : 'Test Accessibility Toggles:'}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {/* Large Text Mode Toggle */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Type size={18} className="text-cyan-400" />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                          Large Text (115%)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onTextScaleToggle) onTextScaleToggle();
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isLargeText ? '#0284c7' : 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          border: 'none',
                        }}
                      >
                        {isLargeText ? 'ACTIVE' : 'ENABLE'}
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {language === 'fil'
                        ? 'Pinapalaki ang mga letra sa buong sistema para mas madaling mabasa.'
                        : 'Scales up fonts across the application for effortless readability.'}
                    </div>
                  </div>

                  {/* High Contrast Mode Toggle */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={18} className="text-cyan-400" />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                          High Contrast
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onHighContrastToggle) onHighContrastToggle();
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isHighContrast ? '#059669' : 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          border: 'none',
                        }}
                      >
                        {isHighContrast ? 'ACTIVE' : 'ENABLE'}
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {language === 'fil'
                        ? 'Matingkad na borders at matinding liwanag para sa madaling pagtingin.'
                        : 'Vivid high-contrast borders and maximized luminance contrast.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 5: PRACTICE SANDBOX & COMPLETION */}
          {/* ======================================================== */}
          {currentSlide === 5 && (
            <div>
              <div className={styles.sandboxContainer}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                    }}
                  >
                    🧪 {language === 'fil' ? 'Praktis Sandbox:' : 'Interactive Practice Ticket:'}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#0284c7',
                      color: '#ffffff',
                    }}
                  >
                    {practiceTicket.status}
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {practiceTicket.barangay} • {practiceTicket.streetAddress}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                    Audit Events Recorded: {practiceTicket.historyCount}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.orangeActionBtn}
                  onClick={handleAdvancePracticeTicket}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  <ArrowRight size={16} />
                  <span>
                    {practiceTicket.status === 'Closed'
                      ? language === 'fil'
                        ? 'Ulitin ang Praktis Mula Simula'
                        : 'Restart Practice Cycle'
                      : language === 'fil'
                      ? 'Pindutin Dito Para I-advance ang Katayuan'
                      : 'Click to Advance Practice Status'}
                  </span>
                </button>
              </div>

              {/* Enter Workspace Button */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={markCompleted}
                  className={`${styles.primaryBtn} ${styles.largeTouchBtn}`}
                  style={{
                    width: '100%',
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {language === 'fil'
                      ? 'Tapusin ang Gabay at Pumasok sa Workspace'
                      : 'Complete Tutorial & Enter Workspace'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar (Back, Next, Skip, Restart) */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-navy-mid)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Left Buttons: Restart & Skip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleRestart}
              style={{ fontSize: '13px', padding: '8px 14px' }}
              title={language === 'fil' ? 'Ulitin ang Tutorial' : 'Restart Tutorial'}
            >
              <RotateCcw size={14} />
              <span>{language === 'fil' ? 'Restart' : 'Restart'}</span>
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleSkip}
              style={{ fontSize: '13px', padding: '8px 14px' }}
              title={language === 'fil' ? 'Laktawan ang Tutorial' : 'Skip Tutorial'}
            >
              <span>{language === 'fil' ? 'Skip' : 'Skip'}</span>
            </button>
          </div>

          {/* Right Buttons: Back & Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentSlide > 0 && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleBack}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                <ChevronLeft size={16} />
                <span>{language === 'fil' ? 'Back' : 'Back'}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleNext}
              style={{
                fontSize: '14px',
                padding: '8px 22px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              }}
            >
              <span>
                {currentSlide === totalSlides - 1
                  ? language === 'fil'
                    ? 'Enter Workspace'
                    : 'Enter Workspace'
                  : language === 'fil'
                  ? 'Next'
                  : 'Next'}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
