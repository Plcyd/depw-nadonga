import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  ArrowRight,
  Sliders,
  HelpCircle,
  Table2,
  BarChart3,
  GitBranch,
  Map,
  Box,
  Sparkles,
  FlaskConical,
  X,
  FileText,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';

export default function GlobalCommandPalette({
  isOpen,
  onClose,
  tickets = [],
  onNavigateTab,
  onSelectTicket,
  onOpenSettings,
  onOpenTutorial,
  onOpenJourneyReplay,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const defaultActions = [
    { id: 'tab-command', title: 'Open Command Center', category: 'Workspace Tab', icon: BarChart3, action: () => onNavigateTab('command') },
    { id: 'tab-tracker', title: 'Open Smart Tracker & Audit', category: 'Workspace Tab', icon: Table2, action: () => onNavigateTab('tracker') },
    { id: 'act-replay', title: 'Replay Request Journey (Timeline Audit)', category: 'Audit & Timeline', icon: RotateCcw, action: () => onOpenJourneyReplay?.() },
    { id: 'tab-flowchart', title: 'Open Workflow Flowchart', category: 'Workspace Tab', icon: GitBranch, action: () => onNavigateTab('flowchart') },
    { id: 'tab-map', title: 'Open Manila Street Map GIS', category: 'Workspace Tab', icon: Map, action: () => onNavigateTab('map') },
    { id: 'tab-3d', title: 'Open 3D Culvert & Truck Twin', category: 'Workspace Tab', icon: Box, action: () => onNavigateTab('3d') },
    { id: 'tab-ai', title: 'Open AI & Gmail Liaison Hub', category: 'Workspace Tab', icon: Sparkles, action: () => onNavigateTab('ai') },
    { id: 'tab-lab', title: 'Open Water & Bioscience Lab', category: 'Workspace Tab', icon: FlaskConical, action: () => onNavigateTab('bioscience') },
    { id: 'act-settings', title: 'Open Accessibility & Settings', category: 'System Settings', icon: Sliders, action: () => onOpenSettings() },
    { id: 'act-tutorial', title: 'Replay Welcome & Tutorial Guide', category: 'User Guide', icon: HelpCircle, action: () => onOpenTutorial() },
  ];

  // Match tickets if user typed
  const matchingTickets = query.trim()
    ? tickets
        .filter((t) => {
          const q = query.toLowerCase();
          return (
            t.ticketId?.toLowerCase().includes(q) ||
            t.barangay?.toLowerCase().includes(q) ||
            t.streetAddress?.toLowerCase().includes(q) ||
            t.district?.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
        .map((t) => ({
          id: `ticket-${t.ticketId}`,
          title: `${t.ticketId}: ${t.barangay} — ${t.streetAddress}`,
          category: `Ticket (${t.status})`,
          icon: FileText,
          action: () => {
            if (onSelectTicket) onSelectTicket(t.ticketId);
            onNavigateTab('tracker');
          },
        }))
    : [];

  const filteredActions = query.trim()
    ? defaultActions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : defaultActions;

  const allItems = [...matchingTickets, ...filteredActions];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.tutorialBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
    >
      <div
        className={styles.tutorialModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '640px',
          width: '95%',
          background: 'rgba(7, 18, 42, 0.95)',
          border: '1.5px solid var(--accent-cyan)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Search Bar Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <Search size={20} className="text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, street, or ticket ID (e.g. 'Velasquez', 'DEO-2026-001', 'Settings')..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Command Palette"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
          {allItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No commands or tickets match &quot;{query}&quot;.
            </div>
          ) : (
            allItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.35), rgba(37, 99, 235, 0.35))'
                      : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.45)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#04162e' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} color={isSelected ? 'var(--accent-cyan)' : 'transparent'} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(4, 12, 30, 0.8)',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Use ↑↓ arrows to navigate, Enter to select</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
