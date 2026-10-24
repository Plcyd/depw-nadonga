import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation,
  Table2,
  Map,
  Box,
  Sparkles,
  FlaskConical,
  BarChart3,
  Palette,
  Menu,
  X,
  LogIn,
  LogOut,
  GitBranch,
  HelpCircle,
  Eye,
  Type,
  Sliders,
  Search,
  Navigation,
  RotateCcw,
} from 'lucide-react';
import styles from './styles/GlassSystem.module.css';
import PresentationDeck from './components/PresentationDeck.jsx';
import CommandCenterView from './components/CommandCenterView.jsx';
import SmartTrackerView from './components/SmartTrackerView.jsx';
import InteractiveFlowchartView from './components/InteractiveFlowchartView.jsx';
import TutorialManager from './components/TutorialManager.jsx';
import AccessibilitySettingsModal from './components/AccessibilitySettingsModal.jsx';
import GlobalCommandPalette from './components/GlobalCommandPalette.jsx';
import MobileFieldInspectionModal from './components/MobileFieldInspectionModal.jsx';
import RequestJourneyReplay from './components/RequestJourneyReplay.jsx';
import ManilaSkylineOutline from './components/ManilaSkylineOutline.jsx';
import StreetMapView from './components/StreetMapView.jsx';
import Drainage3DView from './components/Drainage3DView.jsx';
import AiLiaisonHubView from './components/AiLiaisonHubView.jsx';
import BioscienceLabView from './components/BioscienceLabView.jsx';
import { APP_THEMES } from './utils/workflowRules.js';
import { api } from './services/api.js';
import { initAuth, googleSignIn, logout } from './services/firebaseClient.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('command'); // 'command' | 'presentation' | 'tracker' | 'map' | '3d' | 'ai' | 'bioscience'
  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem('depw_theme_id') || 'navy-glass';
    } catch {
      return 'navy-glass';
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [fieldInspectionOpen, setFieldInspectionOpen] = useState(false);
  const [journeyReplayTicketId, setJourneyReplayTicketId] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      return localStorage.getItem('depw_reduced_motion') === 'true';
    } catch {
      return false;
    }
  });
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    try {
      const completed =
        localStorage.getItem('tutorialCompleted') ||
        localStorage.getItem('depw_tutorial_completed');
      return completed !== 'true';
    } catch {
      return true;
    }
  });
  const [easyMode, setEasyMode] = useState(() => {
    try {
      return localStorage.getItem('depw_easy_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [textScale, setTextScale] = useState(() => {
    try {
      return localStorage.getItem('depw_text_scale') || 'normal';
    } catch {
      return 'normal';
    }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('depw_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [metricsData, setMetricsData] = useState(null);

  const [selectedMapTicket, setSelectedMapTicket] = useState(null);
  const [focusedTrackerTicketId, setFocusedTrackerTicketId] = useState('DEO-2026-001');
  const [initialInspectorTab, setInitialInspectorTab] = useState('overview');
  const [initialOpenCreate, setInitialOpenCreate] = useState(false);
  const [trackerStatusFilter, setTrackerStatusFilter] = useState('ALL');

  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('depw_theme_id', themeId);
    } catch {
      // ignore storage errors
    }
    document.documentElement.setAttribute('data-theme', themeId);
  }, [themeId]);

  useEffect(() => {
    try {
      localStorage.setItem('depw_easy_mode', String(easyMode));
    } catch {
      // ignore
    }
    if (easyMode) {
      document.body.classList.add('easy-mode');
    } else {
      document.body.classList.remove('easy-mode');
    }
  }, [easyMode]);

  useEffect(() => {
    try {
      localStorage.setItem('depw_text_scale', textScale);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-text-scale', textScale);
  }, [textScale]);

  useEffect(() => {
    try {
      localStorage.setItem('depw_high_contrast', String(highContrast));
    } catch {
      // ignore
    }
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    try {
      localStorage.setItem('depw_reduced_motion', String(reducedMotion));
    } catch {
      // ignore
    }
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetAccessibilityDefaults = () => {
    setThemeId('navy-glass');
    setTextScale('normal');
    setHighContrast(false);
    setReducedMotion(false);
    setEasyMode(false);
    showToast('Reset all accessibility and appearance preferences to defaults.', 'info');
  };

  const handleSaveInspectionReport = (report) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === report.ticketId) {
          const updatedHistory = [
            ...(t.statusHistory || []),
            {
              status: 'INSPECTION',
              date: new Date().toISOString().split('T')[0],
              note: `Field inspection logged by ${report.inspectorName}. Silt depth: ${report.siltDepthCm}cm. ${report.notes || ''}`,
              actor: report.inspectorName,
            },
          ];
          return {
            ...t,
            siltDepthCm: report.siltDepthCm,
            gasReadingPpm: report.gasReadingPpm,
            inspectorWitness: report.kagawadWitness,
            statusHistory: updatedHistory,
            inspectionPhoto: report.photoPreview || t.inspectionPhoto,
            coordinates: report.gpsCoords || t.coordinates,
          };
        }
        return t;
      })
    );
    showToast(`Field Inspection Report logged for ${report.ticketId}.`, 'success');
  };

  const handleCompleteTutorial = useCallback(() => {
    try {
      localStorage.setItem('tutorialCompleted', 'true');
      localStorage.setItem('depw_tutorial_completed', 'true');
    } catch {
      // ignore
    }
    setTutorialOpen(false);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [ticketsRes, opsRes, metricsRes] = await Promise.all([
        api.getTickets(),
        api.getOperationsData(),
        api.getMetrics(),
      ]);
      const ticketList = Array.isArray(ticketsRes) ? ticketsRes : ticketsRes.tickets || [];
      setTickets(ticketList);
      setAssets(opsRes?.assets || []);
      setMetricsData(metricsRes || null);
    } catch (err) {
      showToast(`Notice loading backend records: ${err.message}`, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
    const unsub = initAuth(
      (signedInUser) => setUser(signedInUser),
      () => setUser(null)
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [fetchAllData]);

  const handleSignIn = async () => {
    try {
      const { user: u } = await googleSignIn();
      setUser(u);
      showToast(`Signed in as ${u.displayName || u.email}`, 'success');
    } catch (err) {
      showToast(`Sign-in notice: ${err.message}`, 'info');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    showToast('Signed out of Google Workspace session.', 'info');
  };

  const navItems = [
    { id: 'command', label: 'Command Center', icon: BarChart3 },
    { id: 'tracker', label: 'Smart Tracker & Audit', icon: Table2 },
    { id: 'flowchart', label: 'Workflow Flowchart', icon: GitBranch },
    { id: 'presentation', label: '01–08 Presentation Deck', icon: Presentation },
    { id: 'map', label: 'Manila Street Map GIS', icon: Map },
    { id: '3d', label: '3D Culvert & Truck Twin', icon: Box },
    { id: 'ai', label: 'AI & Gmail Liaison Hub', icon: Sparkles },
    { id: 'bioscience', label: 'Water & Bioscience Lab', icon: FlaskConical },
  ];

  const handleSelectNavTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className={styles.appShell} data-theme={themeId}>
      {/* Ambient Background Glows */}
      <div className={styles.ambientGlowTop} />
      <div className={styles.ambientGlowBottom} />

      {/* Official City of Manila Architectural Skyline Header Strip (Outline only, conforms to active theme) */}
      <div style={{ width: '100%', borderBottom: '1px solid var(--glass-border)', background: 'transparent' }}>
        <ManilaSkylineOutline height={32} opacity={0.92} glow={true} showSeal={true} />
      </div>

      {/* Persistent Command Center Top Bar */}
      <header className={styles.topCommandHeader}>
        <div className={styles.brandCluster}>
          <div className={styles.sealGroup}>
            <img
              src="/assets/aistudio/image_5aec6efb.png"
              alt="City of Manila Official Seal"
              className={styles.headerSealImg}
            />
            <img
              src="/assets/aistudio/image_81ca72a0.png"
              alt="Department of Engineering and Public Works Seal"
              className={styles.headerSealImg}
            />
            <img
              src="/assets/aistudio/image_79da53c5.png"
              alt="Philippine Transparency Seal"
              className={styles.headerSealImg}
            />
          </div>
          <div>
            <div className={styles.departmentEyebrow}>
              DEPARTMENT OF ENGINEERING OFFICE • CITY OF MANILA (DEPW)
            </div>
            <div className={styles.brandTitleRow}>
              <span className={styles.brandMainTitle}>
                Handling of Barangay Declogging Requests
              </span>
              <span className={styles.verifiedSystemBadge}>
                MANILA DEPW OPERATIONS
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Search (Cmd+K) + Journey Replay + Field Inspection + Settings & Accessibility + Guide + Theme + Auth */}
        <div className={styles.headerRightActions}>
          {/* Quick Search & Jump (Cmd+K) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className={styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '12px' }}
            title="Global Command Palette (Ctrl+K / Cmd+K)"
          >
            <Search size={14} className="text-cyan-400" />
            <span className="hidden md:inline">Quick Jump</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 border border-white/20 text-cyan-200">
              ⌘K
            </kbd>
          </button>

          {/* Request Journey Replay Tool */}
          <button
            type="button"
            onClick={() => setJourneyReplayTicketId(focusedTrackerTicketId || tickets[0]?.ticketId || 'DEO-2026-001')}
            className={styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '12px' }}
            title="Request Journey Replay (Chronological Milestone Audit)"
          >
            <RotateCcw size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Journey Replay</span>
          </button>

          {/* Mobile Field Inspection Tool */}
          <button
            type="button"
            onClick={() => setFieldInspectionOpen(true)}
            className={styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '12px' }}
            title="Field Inspection Checklist & GPS Verification Tool"
          >
            <Navigation size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Field Tool</span>
          </button>

          {/* Accessibility & Visual Settings Modal Trigger */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '12px' }}
            title="Accessibility & Theme Settings / Mga Setting ng Hitsura at Text"
          >
            <Sliders size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Step-by-Step Guide / Replay Tutorial Modal Button */}
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className={styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '12px' }}
            title="Replay Tutorial Guide / Muling Panoorin ang Gabay sa Paggamit"
          >
            <HelpCircle size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
            <span className="sm:hidden">Guide</span>
          </button>

          {/* Large Text Scaling Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setTextScale((prev) => {
                const next = prev === 'large' ? 'normal' : 'large';
                showToast(next === 'large' ? 'Large Text Mode enabled (115%).' : 'Normal Text Mode enabled.', 'info');
                return next;
              });
            }}
            className={textScale === 'large' ? styles.primaryBtn : styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '13px' }}
            title="Toggle Large Readable Text (115% scaling across whole application)"
          >
            <Type size={14} />
            <span className="hidden sm:inline">Text: {textScale === 'large' ? 'Large' : 'Normal'}</span>
            <span className="sm:hidden">{textScale === 'large' ? 'A+' : 'A'}</span>
          </button>

          {/* High Contrast Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setHighContrast((prev) => {
                const next = !prev;
                showToast(next ? 'High Contrast Mode activated.' : 'Standard Contrast activated.', 'info');
                return next;
              });
            }}
            className={highContrast ? styles.primaryBtn : styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '13px' }}
            title="Toggle High Contrast Mode for accessibility"
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Contrast: {highContrast ? 'High' : 'Normal'}</span>
            <span className="sm:hidden">{highContrast ? 'Hi' : 'Lo'}</span>
          </button>

          {/* Easy Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setEasyMode((prev) => {
                const next = !prev;
                showToast(next ? 'Easy Mode enabled: Larger fonts and simplified spacing.' : 'Standard Mode enabled.', 'info');
                return next;
              });
            }}
            className={easyMode ? styles.primaryBtn : styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '13px' }}
            title="Toggle Easy Mode (Larger fonts and higher contrast)"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Easy: {easyMode ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">{easyMode ? 'Easy ON' : 'Easy'}</span>
          </button>

          {/* Theme Selector (7 Themes with 3 Light Themes) */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-sky-400/25 rounded-lg px-2 py-1">
            <Palette size={13} className="text-cyan-300 shrink-0" />
            <label htmlFor="theme-selector" className="sr-only">
              Select Visual Theme
            </label>
            <select
              id="theme-selector"
              aria-label="Select Visual Theme"
              value={themeId}
              onChange={(e) => {
                setThemeId(e.target.value);
                const selected = APP_THEMES.find((t) => t.id === e.target.value);
                if (selected) {
                  showToast(`Activated theme: ${selected.name} (${selected.badge})`, 'info');
                }
              }}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {APP_THEMES.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.isLight ? '☀️ ' : '🌙 '} {t.name} ({t.badge})
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              style={{ padding: '7px 12px', fontSize: '12px' }}
              onClick={handleSignOut}
              title={`Signed in as ${user.email}`}
            >
              <LogOut size={14} />
              <span>{user.displayName?.split(' ')[0] || 'Sign Out'}</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryBtn}
              style={{ padding: '7px 12px', fontSize: '12px' }}
              onClick={handleSignIn}
            >
              <LogIn size={14} />
              <span>Workspace Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            aria-label="Toggle Mobile Navigation Menu"
            aria-expanded={mobileMenuOpen}
            className={`${styles.secondaryBtn} ${styles.mobileMenuBtn}`}
            style={{ padding: '7px 10px' }}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Workspace Navigation Tabs (Desktop Strip + Mobile Drawer) */}
        <nav
          className={`${styles.mainNavStrip} ${mobileMenuOpen ? styles.mainNavStripOpen : ''}`}
          aria-label="Primary Workspace Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navTabBtn} ${isActive ? styles.navTabBtnActive : ''}`}
                onClick={() => handleSelectNavTab(item.id)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Non-intrusive Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '22px',
            right: '22px',
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: '12px',
            background:
              toast.type === 'error'
                ? 'rgba(153, 27, 27, 0.94)'
                : 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Main Content Container */}
      <main className={styles.mainViewport}>
        {activeTab === 'command' && (
          <CommandCenterView
            tickets={tickets}
            metricsData={metricsData}
            onRefreshData={fetchAllData}
            onOpenTicketAudit={(ticketId) => {
              setFocusedTrackerTicketId(ticketId);
              setInitialInspectorTab('audit');
              setActiveTab('tracker');
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'flowchart' && (
          <InteractiveFlowchartView
            tickets={tickets}
            onNavigateToTracker={(status) => {
              setTrackerStatusFilter(status);
              setActiveTab('tracker');
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'presentation' && (
          <PresentationDeck
            tickets={tickets}
            onOpenSmartTracker={() => setActiveTab('tracker')}
            onSelectTicketForMap={(ticket) => {
              setSelectedMapTicket(ticket);
              setActiveTab('map');
            }}
            onOpenCreateModal={() => {
              setInitialOpenCreate(true);
              setActiveTab('tracker');
            }}
          />
        )}

        {activeTab === 'tracker' && (
          <SmartTrackerView
            tickets={tickets}
            onRefreshTickets={fetchAllData}
            onSelectTicketForMap={(ticket) => {
              setSelectedMapTicket(ticket);
              setActiveTab('map');
            }}
            onOpenLetterStudioWithTicket={() => {
              setActiveTab('ai');
            }}
            onOpenJourneyReplay={(ticketId) => {
              setJourneyReplayTicketId(ticketId || focusedTrackerTicketId);
            }}
            initialOpenCreate={initialOpenCreate}
            onCloseInitialCreate={() => setInitialOpenCreate(false)}
            focusedTicketId={focusedTrackerTicketId}
            initialInspectorTab={initialInspectorTab}
            initialStatusFilter={trackerStatusFilter}
          />
        )}

        {activeTab === 'map' && (
          <StreetMapView
            tickets={tickets}
            assets={assets}
            selectedMapTicket={selectedMapTicket}
            onSelectTicketOnTracker={(ticket) => {
              if (ticket?.ticketId) {
                setFocusedTrackerTicketId(ticket.ticketId);
              }
              setActiveTab('tracker');
            }}
            onUseCoordinatesForNewTicket={() => {
              setInitialOpenCreate(true);
              setActiveTab('tracker');
            }}
            showToast={showToast}
          />
        )}

        {activeTab === '3d' && <Drainage3DView tickets={tickets} />}

        {activeTab === 'ai' && (
          <AiLiaisonHubView
            tickets={tickets}
            user={user}
            onUserChange={setUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'bioscience' && <BioscienceLabView showToast={showToast} />}
      </main>

      {/* Full-screen Glassmorphism TutorialManager Overlay */}
      <TutorialManager
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        showToast={showToast}
        onThemeChange={(tId) => setThemeId(tId)}
        onTextScaleToggle={() => {
          setTextScale((prev) => {
            const next = prev === 'large' ? 'normal' : 'large';
            showToast(next === 'large' ? 'Large Text Mode activated (115% scaling).' : 'Standard Text Mode activated.', 'info');
            return next;
          });
        }}
        onHighContrastToggle={() => {
          setHighContrast((prev) => {
            const next = !prev;
            showToast(next ? 'High Contrast Mode activated.' : 'Standard Contrast activated.', 'info');
            return next;
          });
        }}
        onEasyModeToggle={() => {
          setEasyMode((prev) => {
            const next = !prev;
            showToast(next ? 'Easy Mode activated.' : 'Standard Mode activated.', 'info');
            return next;
          });
        }}
        currentTheme={themeId}
        isLargeText={textScale === 'large'}
        isHighContrast={highContrast}
        isEasyMode={easyMode}
      />

      {/* Comprehensive Accessibility & Theme Settings Modal */}
      <AccessibilitySettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={themeId}
        onThemeChange={(tId) => setThemeId(tId)}
        textScale={textScale}
        onTextScaleChange={(scale) => setTextScale(scale)}
        highContrast={highContrast}
        onHighContrastToggle={() => setHighContrast((prev) => !prev)}
        reducedMotion={reducedMotion}
        onReducedMotionToggle={() => setReducedMotion((prev) => !prev)}
        easyMode={easyMode}
        onEasyModeToggle={() => setEasyMode((prev) => !prev)}
        onResetDefaults={handleResetAccessibilityDefaults}
        showToast={showToast}
      />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <GlobalCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        tickets={tickets}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        onSelectTicket={(ticket) => {
          if (ticket?.ticketId) {
            setFocusedTrackerTicketId(ticket.ticketId);
          }
          setActiveTab('tracker');
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTutorial={() => setTutorialOpen(true)}
        onOpenJourneyReplay={() => {
          setCommandPaletteOpen(false);
          setJourneyReplayTicketId(focusedTrackerTicketId || tickets[0]?.ticketId || 'DEO-2026-001');
        }}
      />

      {/* Mobile Field Inspection Tool (Location checklist, silt depth, H2S PPM, GPS, photo) */}
      <MobileFieldInspectionModal
        isOpen={fieldInspectionOpen}
        onClose={() => setFieldInspectionOpen(false)}
        tickets={tickets}
        onSaveInspectionReport={handleSaveInspectionReport}
        showToast={showToast}
      />

      {/* Request Journey Replay Modal (Chronological Milestone Timeline) */}
      {journeyReplayTicketId && (
        <RequestJourneyReplay
          isOpen={Boolean(journeyReplayTicketId)}
          onClose={() => setJourneyReplayTicketId(null)}
          initialTicketId={journeyReplayTicketId}
          tickets={tickets}
          showToast={showToast}
        />
      )}

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Friendly) */}
      <nav className={styles.mobileBottomNav} aria-label="Mobile Navigation Bar">
        <button
          type="button"
          onClick={() => setActiveTab('command')}
          className={`${styles.bottomNavBtn} ${activeTab === 'command' ? styles.bottomNavBtnActive : ''}`}
        >
          <BarChart3 size={18} />
          <span>Command</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTrackerStatusFilter('ALL');
            setActiveTab('tracker');
          }}
          className={`${styles.bottomNavBtn} ${activeTab === 'tracker' ? styles.bottomNavBtnActive : ''}`}
        >
          <Table2 size={18} />
          <span>Tracker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flowchart')}
          className={`${styles.bottomNavBtn} ${activeTab === 'flowchart' ? styles.bottomNavBtnActive : ''}`}
        >
          <GitBranch size={18} />
          <span>Flowchart</span>
        </button>

        <button
          type="button"
          onClick={() => setTutorialOpen(true)}
          className={styles.bottomNavBtn}
        >
          <HelpCircle size={18} className="text-cyan-400" />
          <span>Guide</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`${styles.bottomNavBtn} ${mobileMenuOpen ? styles.bottomNavBtnActive : ''}`}
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
