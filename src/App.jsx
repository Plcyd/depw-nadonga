import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation, Table2, Map, Box, Sparkles, FlaskConical,
  Sun, Moon, LogIn, LogOut, ShieldCheck, RefreshCw
} from 'lucide-react';
import styles from './styles/GlassSystem.module.css';
import PresentationDeck from './components/PresentationDeck.jsx';
import SmartTrackerView from './components/SmartTrackerView.jsx';
import StreetMapView from './components/StreetMapView.jsx';
import Drainage3DView from './components/Drainage3DView.jsx';
import AiLiaisonHubView from './components/AiLiaisonHubView.jsx';
import BioscienceLabView from './components/BioscienceLabView.jsx';
import { api } from './services/api.js';
import { initAuth, googleSignIn, logout } from './services/firebaseClient.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('presentation'); // 'presentation' | 'tracker' | 'map' | '3d' | 'ai' | 'bioscience'
  const [lightGlassMode, setLightGlassMode] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedMapTicket, setSelectedMapTicket] = useState(null);
  const [initialOpenCreate, setInitialOpenCreate] = useState(false);

  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ticketsRes, opsRes] = await Promise.all([
        api.getTickets(),
        api.getOperationsData()
      ]);
      const ticketList = Array.isArray(ticketsRes) ? ticketsRes : ticketsRes.tickets || [];
      setTickets(ticketList);
      setAssets(opsRes?.assets || []);
    } catch (err) {
      showToast(`Notice loading backend records: ${err.message}`, 'error');
    } finally {
      setLoadingData(false);
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
    { id: 'presentation', label: '01–08 Presentation Deck', icon: Presentation },
    { id: 'tracker', label: 'Smart Tracker & Operations', icon: Table2 },
    { id: 'map', label: 'Manila Street Map GIS', icon: Map },
    { id: '3d', label: '3D Culvert & Truck Twin', icon: Box },
    { id: 'ai', label: 'AI & Gmail Liaison Hub', icon: Sparkles },
    { id: 'bioscience', label: 'Water & Bioscience Lab', icon: FlaskConical }
  ];

  return (
    <div
      className={`${styles.appShell} ${lightGlassMode ? styles.lightGlassTheme : ''}`}
      data-theme={lightGlassMode ? 'light' : 'dark'}
    >
      {/* Ambient Background Glows */}
      <div className={styles.ambientGlowTop} />
      <div className={styles.ambientGlowBottom} />

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
              <span className={styles.trainingDemoBadge}>
                TRAINING DEMO • DUMMY DATA
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <nav className={styles.mainNavStrip} aria-label="Primary Workspace Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navTabBtn} ${isActive ? styles.navTabBtnActive : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Theme Variation + Auth */}
        <div className={styles.headerRightActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            style={{ padding: '7px 11px', fontSize: '12px' }}
            onClick={() => setLightGlassMode(!lightGlassMode)}
            title="Toggle Dark / Light Glass Theme Variation"
          >
            {lightGlassMode ? <Moon size={14} /> : <Sun size={14} />}
            <span>{lightGlassMode ? 'Dark Glass' : 'Light Glass'}</span>
          </button>

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
        </div>
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
            background: toast.type === 'error' ? 'rgba(153, 27, 27, 0.94)' : 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Main Content Container */}
      <main className={styles.mainViewport}>
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
            initialOpenCreate={initialOpenCreate}
            onCloseInitialCreate={() => setInitialOpenCreate(false)}
          />
        )}

        {activeTab === 'map' && (
          <StreetMapView
            tickets={tickets}
            assets={assets}
            selectedMapTicket={selectedMapTicket}
            onSelectTicketOnTracker={() => setActiveTab('tracker')}
            onUseCoordinatesForNewTicket={() => {
              setInitialOpenCreate(true);
              setActiveTab('tracker');
            }}
            showToast={showToast}
          />
        )}

        {activeTab === '3d' && (
          <Drainage3DView tickets={tickets} />
        )}

        {activeTab === 'ai' && (
          <AiLiaisonHubView
            tickets={tickets}
            user={user}
            onUserChange={setUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'bioscience' && (
          <BioscienceLabView showToast={showToast} />
        )}
      </main>
    </div>
  );
}
