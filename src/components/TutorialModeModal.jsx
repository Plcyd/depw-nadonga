import React, { useState } from 'react';
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
  MapPin,
  FileCheck,
  Layers,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  FileText,
  Lock,
  Eye,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import {
  TUTORIAL_LESSONS,
  getWhatShouldIDoNext,
  TICKET_STATUSES,
  FLOWCHART_STAGES,
  MANILA_16_DISTRICTS,
  generateSampleRequestLetter,
} from '../utils/workflowRules.js';

export default function TutorialModeModal({
  isOpen,
  onClose,
  showToast,
  onCompleteTutorial,
}) {
  // Step 0 = Welcome Screen; Steps 1-12 = Lessons 1-12
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState('fil'); // 'fil' | 'en'

  // Interactive Lesson 1: Manila District Explorer
  const [selectedExplorerDistrict, setSelectedExplorerDistrict] = useState('Tondo');

  // Interactive Lesson 2: Simulated Navigation Explorer
  const [simulatedTab, setSimulatedTab] = useState('command');

  // Interactive Lesson 3: Simulated Sensor Threshold State
  const [simulatedGasPpm, setSimulatedGasPpm] = useState(1.8);

  // Interactive Lesson 4: Practice Search & Filter Sandbox
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Interactive Lesson 5: Practice Ticket Inspector Tabs
  const [inspectorActiveTab, setInspectorActiveTab] = useState('overview');

  // Interactive Lesson 6: Selected Flowchart Stage
  const [selectedFlowStageIdx, setSelectedFlowStageIdx] = useState(0);

  // Interactive Lesson 7: Safety Checklist Simulator
  const [safetyChecks, setSafetyChecks] = useState([
    { id: 'gas', label: 'Atmospheric Multigas Test (H2S < 3.0 ppm)', done: true },
    { id: 'witness', label: 'Barangay Kagawad / Tanod Witness Present', done: true },
    { id: 'traffic', label: 'Traffic Marshall & Safety Cones Deployed', done: false },
    { id: 'harness', label: 'Safety Harness & Tri-pod Hoist Inspected', done: false },
  ]);

  // Interactive Lesson 8: Practice Form Data
  const [practiceForm, setPracticeForm] = useState({
    barangay: 'Barangay 128, Zone 10',
    district: 'Tondo',
    streetAddress: 'Velasquez cor. Estero de Vitas Rd.',
    requesterName: 'Kagawad Danilo Santos',
    description: 'Debris and compacted silt accumulation choking drainage culvert.',
  });
  const [practiceFormSubmitted, setPracticeFormSubmitted] = useState(false);

  // Interactive Lesson 9: Live Practice Ticket State & Audit Trail
  const [practiceTicket, setPracticeTicket] = useState({
    ticketId: 'DEO-2026-PRACTICE',
    barangay: 'Barangay 128, Zone 10',
    district: 'Tondo',
    streetAddress: 'Velasquez cor. Estero de Vitas Rd.',
    status: 'For Verification',
    priority: 'High Priority',
    auditTrail: [
      {
        id: 'aud-001',
        timestamp: '10/24/2026, 08:30 AM',
        action: 'TICKET_CREATED',
        summary: 'Logged practice declogging request [DEMO DATA - SIMULATED]',
        author: 'Receiving Desk',
      },
    ],
  });

  if (!isOpen) return null;

  const totalLessons = TUTORIAL_LESSONS.length; // 12
  const activeLessonIdx = currentStep - 1; // 0 to 11 when currentStep >= 1
  const activeLesson = TUTORIAL_LESSONS[activeLessonIdx] || TUTORIAL_LESSONS[0];

  const handleStartTutorial = () => {
    setCurrentStep(1);
  };

  const handleExitTutorial = () => {
    if (onCompleteTutorial) onCompleteTutorial();
    onClose();
  };

  const handleSkipForNow = () => {
    if (onCompleteTutorial) onCompleteTutorial();
    if (showToast) {
      showToast(
        language === 'fil'
          ? 'Maaari mong muling panoorin ang gabay anumang oras gamit ang "Step-by-Step Guide" button sa itaas.'
          : 'You can replay this guide anytime using the "Step-by-Step Guide" button in the top bar.',
        'info'
      );
    }
    onClose();
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep < totalLessons) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Completed last lesson
      if (onCompleteTutorial) onCompleteTutorial();
      if (showToast) {
        showToast(
          language === 'fil'
            ? 'Binabati kita! Natapos mo ang lahat ng 12 aralin ng DEPW Assist.'
            : 'Congratulations! You completed all 12 lessons of DEPW Assist.',
          'success'
        );
      }
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkipCurrentLesson = () => {
    if (currentStep < totalLessons) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleExitTutorial();
    }
  };

  const handleRestartLesson = () => {
    // Reset any local states for this lesson
    if (currentStep === 7) {
      setSafetyChecks((prev) => prev.map((item) => ({ ...item, done: false })));
    } else if (currentStep === 8) {
      setPracticeFormSubmitted(false);
    } else if (currentStep === 9) {
      setPracticeTicket({
        ticketId: 'DEO-2026-PRACTICE',
        barangay: 'Barangay 128, Zone 10',
        district: 'Tondo',
        streetAddress: 'Velasquez cor. Estero de Vitas Rd.',
        status: 'For Verification',
        priority: 'High Priority',
        auditTrail: [
          {
            id: 'aud-001',
            timestamp: new Date().toLocaleTimeString(),
            action: 'TICKET_CREATED',
            summary: 'Reset practice ticket state [DEMO DATA - SIMULATED]',
            author: 'Receiving Desk',
          },
        ],
      });
    }
    if (showToast) {
      showToast(
        language === 'fil' ? 'Na-restart ang kasalukuyang aralin.' : 'Restarted current lesson.',
        'info'
      );
    }
  };

  // Practice Sandbox: Advance Status (Lesson 9)
  const handleAdvancePractice = () => {
    const flow = [
      'For Verification',
      'Pending Evaluation',
      'Inspection Scheduled',
      'Scheduled for Implementation',
      'In Progress',
      'Completed',
      'Closed',
    ];
    const currIdx = flow.indexOf(practiceTicket.status);
    if (currIdx < flow.length - 1) {
      const nextStatus = flow[currIdx + 1];
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setPracticeTicket((prev) => ({
        ...prev,
        status: nextStatus,
        auditTrail: [
          ...prev.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowStr,
            action: 'STATUS_TRANSITION',
            summary: `Transitioned status: ${prev.status} → ${nextStatus}`,
            author: 'Practice Liaison Officer',
          },
        ],
      }));
      if (showToast) {
        showToast(
          language === 'fil'
            ? `Nailipat ang status sa: ${nextStatus}`
            : `Advanced status to: ${nextStatus}`,
          'success'
        );
      }
    } else {
      // Loop back to start
      setPracticeTicket((prev) => ({
        ...prev,
        status: 'For Verification',
        auditTrail: [
          ...prev.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: 'STATUS_TRANSITION',
            summary: 'Reset practice cycle to initial verification',
            author: 'Practice Sandbox',
          },
        ],
      }));
      if (showToast) {
        showToast(
          language === 'fil'
            ? 'Na-reset pabalik sa simula ang praktis ticket!'
            : 'Reset practice ticket to beginning!',
          'info'
        );
      }
    }
  };

  const nextActionAdvice = getWhatShouldIDoNext(practiceTicket, language);

  return (
    <div
      className={styles.tutorialBackdrop}
      onClick={handleExitTutorial}
      role="dialog"
      aria-modal="true"
      aria-label="DEPW Assist Beginner Tutorial"
    >
      <div
        className={styles.tutorialModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '1px solid var(--glass-border)',
        }}
      >
        {/* City of Manila Official Skyline Architectural Banner Strip */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <img
            src="/assets/aistudio/image_f915b5a7.png"
            alt="City of Manila Skyline & Official Republic of the Philippines Header"
            className={styles.skylineBannerImg}
          />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-navy-mid)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Manila City & DEPW Seals */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img
                src="/assets/aistudio/image_5aec6efb.png"
                alt="Manila Seal"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
              <img
                src="/assets/aistudio/image_81ca72a0.png"
                alt="DEPW Seal"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--accent-cyan)',
                }}
              >
                DEPARTMENT OF ENGINEERING OFFICE • CITY OF MANILA
              </div>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>DEPW Assist</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  {currentStep === 0
                    ? language === 'fil'
                      ? 'Panimulang Gabay'
                      : 'Welcome Guide'
                    : language === 'fil'
                    ? `Aralin ${currentStep} ng ${totalLessons}`
                    : `Lesson ${currentStep} of ${totalLessons}`}
                </span>
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Language Switch */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(4, 12, 28, 0.8)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage('fil')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
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
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
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
              onClick={handleExitTutorial}
              aria-label="Exit Tutorial"
              title={language === 'fil' ? 'Umalis sa Tutorial' : 'Exit Tutorial'}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stepper / Progress Bar (When inside lessons 1-12) */}
        {currentStep > 0 && (
          <div
            style={{
              padding: '10px 20px',
              background: 'rgba(4, 10, 24, 0.55)',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {language === 'fil'
                  ? `Aralin ${currentStep} ng ${totalLessons}:`
                  : `Lesson ${currentStep} of ${totalLessons}:`}{' '}
                <span style={{ color: 'var(--text-primary)' }}>
                  {language === 'fil' ? activeLesson.titleFil : activeLesson.titleEn}
                </span>
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {language === 'fil' ? activeLesson.badgeFil : activeLesson.badgeEn}
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div
              style={{
                height: '4px',
                width: '100%',
                background: 'rgba(148, 163, 184, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(currentStep / totalLessons) * 100}%`,
                  background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
                  transition: 'width 240ms ease',
                }}
              />
            </div>

            {/* Quick-Jump Lesson Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
            >
              {TUTORIAL_LESSONS.map((lesson) => {
                const isCurrent = currentStep === lesson.id;
                const isPassed = currentStep > lesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setCurrentStep(lesson.id)}
                    className={`${styles.lessonPill} ${isCurrent ? styles.lessonPillActive : ''} ${
                      isPassed ? styles.lessonPillDone : ''
                    }`}
                    title={language === 'fil' ? lesson.titleFil : lesson.titleEn}
                  >
                    {lesson.id}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div style={{ padding: '22px', overflowY: 'auto' }}>
          {/* ======================================================== */}
          {/* STEP 0: WELCOME SCREEN (Shown First for New Users & Replay) */}
          {/* ======================================================== */}
          {currentStep === 0 && (
            <div>
              <div className={styles.welcomeHeroCard} style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(56, 189, 248, 0.2)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-cyan)',
                      shrink: 0,
                    }}
                  >
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {language === 'fil'
                        ? 'OPISYAL NA PANIMULANG GABAY'
                        : 'OFFICIAL SYSTEM ORIENTATION'}
                    </div>
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {language === 'fil'
                        ? 'Maligayang Pagdating sa DEPW Assist'
                        : 'Welcome to DEPW Assist'}
                    </h3>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                    margin: '0 0 16px',
                  }}
                >
                  {language === 'fil'
                    ? 'Ang DEPW Assist ay ang opisyal na command center ng Department of Engineering and Public Works (DEPW) ng Lungsod ng Maynila. Dito pinoproseso, sinusuri, iniinspeksyon, at inaaprubahan ang bawat kahilingan sa paglilinis ng drainage at estero mula sa 16 na kinikilalang distrito ng Maynila.'
                    : 'DEPW Assist is the official public works operations center for the Department of Engineering and Public Works (City of Manila). It organizes, inspects, coordinates, and tracks all barangay declogging and drainage requests across Manila’s 16 recognized districts.'}
                </p>

                {/* 3 Core System Pillars */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '18px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <Layers size={14} />
                      <span>
                        {language === 'fil' ? '8 Yugto ng Daloy' : '8-Stage Pipeline'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {language === 'fil'
                        ? 'Mula sa pagtanggap ng sulat hanggang sa pirma ng pasasalamat ng Barangay.'
                        : 'From initial transmittal receipt to signed barangay project closeout.'}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#6ee7b7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>
                        {language === 'fil' ? 'Audit Trail at Etika' : 'Immutable Audit Log'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {language === 'fil'
                        ? 'Ligtas na talaan ng bawat pagbabago sang-ayon sa RA 6713 at RA 10173.'
                        : 'Cryptographically verifiable record of status changes under RA 6713.'}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>
                        {language === 'fil' ? 'Kaligtasan sa Imburnal' : 'Confined Space Safety'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {language === 'fil'
                        ? 'Pagsusuri sa mapanganib na gas (H2S < 3 ppm) bago pumasok ang tauhan.'
                        : 'Atmospheric multigas testing safeguards field crews before entry.'}
                    </div>
                  </div>
                </div>

                {/* 3 Prominent Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleStartTutorial}
                    className={`${styles.primaryBtn} ${styles.largeTouchBtn}`}
                    style={{
                      flex: '1 1 200px',
                      fontSize: '14px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    }}
                  >
                    <BookOpen size={16} />
                    <span>
                      {language === 'fil'
                        ? 'Simulan ang Tutorial (12 Aralin)'
                        : 'Start Guided Tutorial (12 Lessons)'}
                    </span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipForNow}
                    className={`${styles.secondaryBtn} ${styles.largeTouchBtn}`}
                    style={{ flex: '1 1 150px' }}
                  >
                    <span>{language === 'fil' ? 'Laktawan Muna' : 'Skip for Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExitTutorial}
                    className={`${styles.secondaryBtn} ${styles.largeTouchBtn}`}
                    style={{
                      flex: '0 1 110px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                    }}
                  >
                    <X size={14} />
                    <span>{language === 'fil' ? 'Umalis' : 'Exit'}</span>
                  </button>
                </div>
              </div>

              {/* Gentle reassurance note */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Info size={16} className="text-cyan-400 shrink-0" />
                <span>
                  {language === 'fil'
                    ? 'Maaari mong laktawan o muling buksan ang gabay anumang oras gamit ang "Step-by-Step Guide" button sa kanang itaas ng sistema.'
                    : 'You can skip or replay this guide at any time by clicking the "Step-by-Step Guide" button in the upper right header.'}
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEPS 1 to 12: GUIDED LESSONS */}
          {/* ======================================================== */}
          {currentStep >= 1 && (
            <div>
              {/* Title & Summary */}
              <div style={{ marginBottom: '16px' }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    margin: '0 0 6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {language === 'fil' ? activeLesson.titleFil : activeLesson.titleEn}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {language === 'fil' ? activeLesson.summaryFil : activeLesson.summaryEn}
                </p>
              </div>

              {/* Numbered Instructions */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: '8px',
                  }}
                >
                  {language === 'fil' ? 'Mga Hakbang sa Araling Ito:' : 'Numbered Instructions:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(language === 'fil'
                    ? activeLesson.numberedInstructionsFil
                    : activeLesson.numberedInstructionsEn
                  ).map((stepText, idx) => (
                    <div
                      key={idx}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(56, 189, 248, 0.2)',
                          border: '1px solid rgba(56, 189, 248, 0.5)',
                          color: 'var(--accent-cyan)',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shrink: 0,
                          marginTop: '1px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {stepText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ======================================================== */}
              {/* DEDICATED INTERACTIVE SANDBOX PER LESSON */}
              {/* ======================================================== */}

              {/* Lesson 1: Manila District Explorer */}
              {currentStep === 1 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    🗺️ {language === 'fil' ? 'Subukan: Pumili ng Distrito ng Maynila' : 'Interactive: Explore Manila Districts'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                    }}
                  >
                    {['Tondo', 'Sampaloc', 'Binondo', 'Ermita', 'Paco', 'Quiapo'].map((dist) => (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => setSelectedExplorerDistrict(dist)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background:
                            selectedExplorerDistrict === dist
                              ? 'var(--accent-cyan)'
                              : 'rgba(15, 23, 42, 0.7)',
                          color: selectedExplorerDistrict === dist ? '#04162e' : 'var(--text-secondary)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(2, 132, 199, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>{selectedExplorerDistrict} District:</strong>{' '}
                    {selectedExplorerDistrict === 'Tondo' &&
                      'Primary drainage outfall to Estero de Vitas and Sunog Apog. Monitored for coastal tidal surge and sediment.'}
                    {selectedExplorerDistrict === 'Sampaloc' &&
                      'España Blvd lateral box culvert corridor discharging to Estero de Valencia & Alix. Supported by Valencia Pumping Station.'}
                    {selectedExplorerDistrict === 'Binondo' &&
                      'Commercial hub with interconnected Estero de Binondo and Estero de la Reina. Specialized water jetters clear food grease.'}
                    {selectedExplorerDistrict === 'Ermita' &&
                      'Coastal urban zone discharging to Manila Bay. Main storm lines protect major tourism and government centers.'}
                    {selectedExplorerDistrict === 'Paco' &&
                      'Estero de Paco rehabilitation corridor and linear parks. Paco Pumping Station controls water elevation.'}
                    {selectedExplorerDistrict === 'Quiapo' &&
                      'Historic commercial district with Estero de Quiapo leading into Pasig River. High silt trap clearance.'}
                  </div>
                </div>
              )}

              {/* Lesson 2: Simulated Navigation Tabs */}
              {currentStep === 2 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    🧭 {language === 'fil' ? 'Subukan ang mga Tab sa Itaas:' : 'Simulated Navigation Tabs:'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                    }}
                  >
                    {[
                      { id: 'command', label: 'Command Center' },
                      { id: 'tracker', label: 'Smart Tracker' },
                      { id: 'flowchart', label: 'Flowchart' },
                      { id: 'map', label: 'GIS Map' },
                      { id: '3d', label: '3D Culvert' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSimulatedTab(tab.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background:
                            simulatedTab === tab.id
                              ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                              : 'rgba(15, 23, 42, 0.7)',
                          color: '#ffffff',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {simulatedTab === 'command' &&
                      'Command Center: Displays overall declogging stats, KPIs, and real-time safety threshold warnings.'}
                    {simulatedTab === 'tracker' &&
                      'Smart Tracker & Audit: Searchable database of all barangay tickets with immutable history logs.'}
                    {simulatedTab === 'flowchart' &&
                      'Workflow Flowchart: Interactive 8-stage visual pipeline from receipt to closure.'}
                    {simulatedTab === 'map' &&
                      'Manila Street Map GIS: Pinpoints flood hotspots and barangay request locations across Manila.'}
                    {simulatedTab === '3d' &&
                      '3D Culvert & Truck Twin: Visualizes underground pipe cross-sections and jetting truck equipment.'}
                  </div>
                </div>
              )}

              {/* Lesson 3: Water Quality & Confined Gas Threshold Demo */}
              {currentStep === 3 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    ⚠️ {language === 'fil' ? 'Subukan ang Sensor Gas Simulator:' : 'Simulated Multigas Sensor Alarm:'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setSimulatedGasPpm(1.8)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: simulatedGasPpm === 1.8 ? '#059669' : 'rgba(15, 23, 42, 0.7)',
                        color: '#ffffff',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      🟢 {language === 'fil' ? 'Ligtas (1.8 ppm)' : 'Safe (1.8 ppm)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedGasPpm(6.2)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: simulatedGasPpm === 6.2 ? '#d97706' : 'rgba(15, 23, 42, 0.7)',
                        color: '#ffffff',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      🟡 {language === 'fil' ? 'Babala (6.2 ppm)' : 'Warning (6.2 ppm)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedGasPpm(12.5)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: simulatedGasPpm === 12.5 ? '#dc2626' : 'rgba(15, 23, 42, 0.7)',
                        color: '#ffffff',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      🔴 {language === 'fil' ? 'Kritikal (12.5 ppm)' : 'Critical (12.5 ppm)'}
                    </button>
                  </div>

                  {/* Simulated Threshold Notification Card */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background:
                        simulatedGasPpm >= 10
                          ? 'rgba(239, 68, 68, 0.18)'
                          : simulatedGasPpm >= 5
                          ? 'rgba(245, 158, 11, 0.16)'
                          : 'rgba(16, 185, 129, 0.14)',
                      border: `1px solid ${
                        simulatedGasPpm >= 10
                          ? '#f87171'
                          : simulatedGasPpm >= 5
                          ? '#fbbf24'
                          : '#34d399'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <AlertTriangle
                      size={20}
                      color={
                        simulatedGasPpm >= 10
                          ? '#ef4444'
                          : simulatedGasPpm >= 5
                          ? '#f59e0b'
                          : '#10b981'
                      }
                      className="shrink-0"
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                      <strong>
                        H2S Culvert Gas Level: {simulatedGasPpm} ppm (Safe threshold &lt; 3.0 ppm).
                      </strong>
                      <div>
                        {simulatedGasPpm >= 10
                          ? 'HAZARDOUS CONCENTRATION EXCEEDED: Evacuate culvert immediately! Do not deploy personnel.'
                          : simulatedGasPpm >= 5
                          ? 'ELEVATED GAS DETECTED: Ventilate manhole with industrial blowers before permitting entry.'
                          : 'OPTIMAL SAFE CONDITIONS: Within permissible confined-space safety parameters.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson 4: Practice Search & Filtering */}
              {currentStep === 4 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    🔍 {language === 'fil' ? 'Subukan Maghanap sa Smart Tracker:' : 'Practice Searching & Filtering:'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                        }}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          language === 'fil'
                            ? 'Mag-type hal. "Velasquez" o "128"...'
                            : 'Type e.g. "Velasquez" or "128"...'
                        }
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 30px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid var(--glass-border)',
                          color: '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid var(--glass-border)',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="For Verification">For Verification</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Filtered Sample Item Preview */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        DEO-2026-001
                      </span>{' '}
                      • Barangay 128, Zone 10 — Velasquez St.
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: 'var(--accent-cyan)',
                        fontWeight: 700,
                      }}
                    >
                      For Verification
                    </span>
                  </div>
                </div>
              )}

              {/* Lesson 5: Ticket Details & Audit Diff Preview */}
              {currentStep === 5 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    📋 {language === 'fil' ? 'Subukan ang mga Tab ng Ticket Inspector:' : 'Ticket Inspector Tab Navigation:'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {['overview', 'checklist', 'audit'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setInspectorActiveTab(tab)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background:
                            inspectorActiveTab === tab
                              ? 'var(--accent-cyan)'
                              : 'rgba(15, 23, 42, 0.7)',
                          color: inspectorActiveTab === tab ? '#04162e' : 'var(--text-secondary)',
                          border: '1px solid var(--glass-border)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {tab === 'audit' ? 'Audit Log & Diff' : tab}
                      </button>
                    ))}
                  </div>

                  {inspectorActiveTab === 'overview' && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Reference ID:</strong> DEO-2026-001 • <strong>Barangay:</strong> Brgy 128, Zone 10 •{' '}
                      <strong>Coordinating Official:</strong> Kagawad Danilo Santos •{' '}
                      <strong>Street:</strong> Velasquez cor. Estero de Vitas Rd.
                    </div>
                  )}

                  {inspectorActiveTab === 'checklist' && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      ☑️ Ocular culvert depth inspected (0.8m silt) <br />
                      ☑️ Atmospheric gas safety check (H2S = 1.4 ppm &lt; 3.0 ppm safe) <br />
                      ☐ Barangay Kagawad signature verified
                    </div>
                  )}

                  {inspectorActiveTab === 'audit' && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div style={{ color: '#38bdf8', fontWeight: 700 }}>
                        [STATUS_TRANSITION] 10/24/2026 08:45 AM by Engr. M. Ramos (DEPW)
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Field: status | Before: &quot;For Verification&quot; → After: &quot;Pending Evaluation&quot;
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson 6: 8-Stage Pipeline Exploration */}
              {currentStep === 6 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    🪜 {language === 'fil' ? 'Pumili ng Hakbang sa Pipeline:' : 'Click a Stage to Inspect Requirements:'}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    {FLOWCHART_STAGES.map((st, i) => (
                      <button
                        key={st.step}
                        type="button"
                        onClick={() => setSelectedFlowStageIdx(i)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background:
                            selectedFlowStageIdx === i
                              ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                              : 'rgba(15, 23, 42, 0.7)',
                          color: '#ffffff',
                          border: '1px solid var(--glass-border)',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {st.step} {st.code}
                      </button>
                    ))}
                  </div>

                  {/* Details of Selected Stage */}
                  {FLOWCHART_STAGES[selectedFlowStageIdx] && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        Stage {FLOWCHART_STAGES[selectedFlowStageIdx].step}:{' '}
                        {language === 'fil'
                          ? FLOWCHART_STAGES[selectedFlowStageIdx].titleFil
                          : FLOWCHART_STAGES[selectedFlowStageIdx].titleEn}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <strong>{language === 'fil' ? 'Tungkulin:' : 'Responsible:'}</strong>{' '}
                        {language === 'fil'
                          ? FLOWCHART_STAGES[selectedFlowStageIdx].responsibleRoleFil
                          : FLOWCHART_STAGES[selectedFlowStageIdx].responsibleRoleEn}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <strong>{language === 'fil' ? 'Paliwanag:' : 'Description:'}</strong>{' '}
                        {language === 'fil'
                          ? FLOWCHART_STAGES[selectedFlowStageIdx].plainDescriptionFil
                          : FLOWCHART_STAGES[selectedFlowStageIdx].plainDescriptionEn}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson 7: Confined Space Safety Protocols */}
              {currentStep === 7 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    🛡️ {language === 'fil' ? 'Subukan ang Safety Checklist:' : 'Practice Safety Inspection Checklist:'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {safetyChecks.map((chk) => (
                      <label
                        key={chk.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={chk.done}
                          onChange={() =>
                            setSafetyChecks((prev) =>
                              prev.map((c) => (c.id === chk.id ? { ...c, done: !c.done } : c))
                            )
                          }
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ textDecoration: chk.done ? 'line-through' : 'none' }}>
                          {chk.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Lesson 8: Creating a Fictional Practice Request */}
              {currentStep === 8 && (
                <div className={styles.sandboxContainer}>
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
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                      }}
                    >
                      📝 {language === 'fil' ? 'Praktis Form sa Pag-encode' : 'Practice Request Intake Form'}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      [DEMO DATA - SIMULATED]
                    </span>
                  </div>

                  {!practiceFormSubmitted ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            Barangay
                          </label>
                          <input
                            type="text"
                            value={practiceForm.barangay}
                            onChange={(e) =>
                              setPracticeForm({ ...practiceForm, barangay: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid var(--glass-border)',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            District
                          </label>
                          <input
                            type="text"
                            value={practiceForm.district}
                            onChange={(e) =>
                              setPracticeForm({ ...practiceForm, district: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid var(--glass-border)',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Street Location / Canal Segment
                        </label>
                        <input
                          type="text"
                          value={practiceForm.streetAddress}
                          onChange={(e) =>
                            setPracticeForm({ ...practiceForm, streetAddress: e.target.value })
                          }
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid var(--glass-border)',
                            color: '#ffffff',
                            fontSize: '11px',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setPracticeForm({
                              barangay: 'Barangay 412, Zone 42',
                              district: 'Sampaloc',
                              streetAddress: 'España Blvd cor. Maceda St.',
                              requesterName: 'Kagawad Maria Santos',
                              description: 'Deep silt blocking storm runoff towards Estero de Valencia.',
                            });
                            if (showToast) {
                              showToast(
                                language === 'fil'
                                  ? 'Napunuan ng sample data ang form!'
                                  : 'Auto-populated sample details!',
                                'info'
                              );
                            }
                          }}
                          className={styles.secondaryBtn}
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                        >
                          <Sparkles size={12} className="text-cyan-400" />
                          <span>{language === 'fil' ? 'Punan ng Sample Data' : 'Quick Fill Sample'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPracticeFormSubmitted(true);
                            if (showToast) {
                              showToast(
                                language === 'fil'
                                  ? 'Matagumpay na naitala ang praktis ticket! [SIMULATED]'
                                  : 'Practice ticket created successfully! [SIMULATED]',
                                'success'
                              );
                            }
                          }}
                          className={styles.primaryBtn}
                          style={{ fontSize: '11px', padding: '5px 14px' }}
                        >
                          <CheckCircle2 size={12} />
                          <span>{language === 'fil' ? 'Isumite ang Praktis Ticket' : 'Submit Practice Ticket'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#6ee7b7', marginBottom: '4px' }}>
                        ✓ Matagumpay na Nalikha: DEO-2026-PRACTICE
                      </div>
                      <div>
                        {practiceForm.barangay} • {practiceForm.streetAddress}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setPracticeFormSubmitted(false)}
                          className={styles.secondaryBtn}
                          style={{ fontSize: '10px', padding: '3px 8px' }}
                        >
                          {language === 'fil' ? 'Muling Subukan' : 'Create Another Sample'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson 9: Updating Status Safely & Audit Trail */}
              {currentStep === 9 && (
                <div className={styles.sandboxContainer}>
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
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                      }}
                    >
                      🔄 {language === 'fil' ? 'Subukan ang Status Transition:' : 'Interactive Status Advancement:'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#0284c7',
                        color: '#ffffff',
                      }}
                    >
                      {practiceTicket.status}
                    </span>
                  </div>

                  {/* Recommendation helper box */}
                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#6ee7b7' }}>
                      💡 {language === 'fil' ? 'Ano ang gagawin mo ngayon?' : 'What should you do next?'}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {nextActionAdvice.action}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {nextActionAdvice.detail}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className={styles.orangeActionBtn}
                    onClick={handleAdvancePractice}
                    style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: '12px', marginBottom: '10px' }}
                  >
                    <ArrowRight size={14} />
                    <span>
                      {practiceTicket.status === 'Closed'
                        ? language === 'fil'
                          ? 'Ulitin ang Praktis Mula Simula'
                          : 'Restart Practice Cycle'
                        : language === 'fil'
                        ? 'Pindutin Para I-advance ang Status'
                        : 'Click to Advance to Next Stage'}
                    </span>
                  </button>

                  {/* Live Simulated Audit Log */}
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Server Audit Log [SIMULATED]:
                  </div>
                  <div
                    style={{
                      maxHeight: '80px',
                      overflowY: 'auto',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {practiceTicket.auditTrail.map((entry) => (
                      <div key={entry.id} style={{ color: '#cbd5e1', marginBottom: '3px' }}>
                        <span style={{ color: '#38bdf8' }}>[{entry.timestamp}]</span> {entry.summary} ({entry.author})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lesson 10: Official Request Letter & Transmittal Format */}
              {currentStep === 10 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    📄 {language === 'fil' ? 'Silipin ang Opisyal na Liham (Transmittal Letter):' : 'Official Barangay Transmittal Preview:'}
                  </div>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '11px',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      REF NO: REF-BRGY-DEO-2026-001 • CITY OF MANILA
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Date: October 24, 2026 • Attention: Department of Engineering and Public Works
                    </div>
                    <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      &quot;Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig...&quot;
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson 11: Privacy, Ethics & Responsible AI */}
              {currentStep === 11 && (
                <div className={styles.sandboxContainer}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    🔒 {language === 'fil' ? 'Mga Panuntunan sa Proteksyon ng Datos:' : 'Data Privacy & Ethics Standards:'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" style={{ marginTop: '2px' }} />
                      <span>
                        <strong>Republic Act 10173 (Data Privacy Act):</strong> Personal phone numbers and home addresses are never published to public endpoints.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" style={{ marginTop: '2px' }} />
                      <span>
                        <strong>Republic Act 6713 (Code of Conduct):</strong> Requests must be acknowledged promptly with full transparency.
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" style={{ marginTop: '2px' }} />
                      <span>
                        <strong>Human-Supervised AI:</strong> AI drafts liaison emails, but only authorized DEPW engineers can approve and transmit records.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson 12: Tutorial Completion Celebration */}
              {currentStep === 12 && (
                <div
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.2) 0%, transparent 70%), var(--bg-navy-elevated)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px',
                    padding: '18px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      color: '#6ee7b7',
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#f0fdf4' }}>
                    {language === 'fil' ? 'Binabati Kita! Ganap Ka Nang Handa.' : 'Congratulations! You are Ready to Operate.'}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>
                    {language === 'fil'
                      ? 'Natapos mo ang buong kurso sa DEPW Assist. Handa ka nang maglingkod para sa maayos at ligtas na daloy ng tubig sa bawat barangay sa Maynila.'
                      : 'You have mastered the DEPW Assist workflow. You are ready to log, inspect, schedule, and track barangay declogging projects.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleExitTutorial}
                    className={`${styles.primaryBtn} ${styles.largeTouchBtn}`}
                    style={{
                      margin: '0 auto',
                      fontSize: '13px',
                      background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                    }}
                  >
                    <span>{language === 'fil' ? 'Pumasok sa Command Center' : 'Enter Command Center'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Key Bullet Highlights */}
              <div
                className={styles.glassCard}
                style={{ padding: '12px 16px', marginBottom: '14px' }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: '8px',
                  }}
                >
                  {language === 'fil' ? 'Tandaan:' : 'Key Takeaways:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(language === 'fil'
                    ? activeLesson.highlightsFil
                    : activeLesson.highlightsEn
                  ).map((hl, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" style={{ marginTop: '2px' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {hl}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gentle Pro-Tip */}
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Info size={14} className="text-amber-400 shrink-0" />
                <span style={{ fontSize: '11px', color: '#fef08a' }}>
                  <strong>Tip:</strong>{' '}
                  {language === 'fil' ? activeLesson.tipFil : activeLesson.tipEn}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-navy-mid)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {currentStep === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              City of Manila Department of Engineering Office
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleRestartLesson}
                style={{ padding: '6px 10px', fontSize: '11px' }}
                title={language === 'fil' ? 'Ulitin ang Araling Ito' : 'Restart Current Lesson'}
              >
                <RotateCcw size={13} />
                <span>{language === 'fil' ? 'Ulitin ang Aralin' : 'Restart Lesson'}</span>
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleSkipCurrentLesson}
                style={{ padding: '6px 10px', fontSize: '11px' }}
                title={language === 'fil' ? 'Laktawan ang Araling Ito' : 'Skip Lesson'}
              >
                <span>{language === 'fil' ? 'Laktawan' : 'Skip Lesson'}</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStep > 0 && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handlePrevStep}
                style={{ padding: '7px 14px', fontSize: '12px' }}
              >
                <ChevronLeft size={14} />
                <span>{language === 'fil' ? 'Nakaraan' : 'Back'}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleNextStep}
              style={{
                padding: '7px 18px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              }}
            >
              <span>
                {currentStep === 0
                  ? language === 'fil'
                    ? 'Simulan ang Tutorial'
                    : 'Start Tutorial'
                  : currentStep === totalLessons
                  ? language === 'fil'
                    ? 'Tapusin ang Gabay'
                    : 'Complete Guide'
                  : language === 'fil'
                  ? 'Susunod na Hakbang'
                  : 'Next Step'}
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
