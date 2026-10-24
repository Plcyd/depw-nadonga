import React from 'react';
import {
  X,
  Sliders,
  Type,
  Sun,
  Moon,
  Sparkles,
  Check,
  Eye,
  RotateCcw,
  ShieldCheck,
  Activity,
  Layers,
  Palette,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import { APP_THEMES } from '../utils/workflowRules.js';

export default function AccessibilitySettingsModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  textScale,
  onTextScaleChange,
  highContrast,
  onHighContrastToggle,
  reducedMotion,
  onReducedMotionToggle,
  easyMode,
  onEasyModeToggle,
  onResetDefaults,
  showToast,
}) {
  const [language, setLanguage] = React.useState('fil'); // 'fil' | 'en'

  if (!isOpen) return null;

  const textScaleOptions = [
    { id: 'normal', labelFil: 'Karaniwan (100%)', labelEn: 'Standard (100%)', sizeDesc: '16px Base' },
    { id: 'medium', labelFil: 'Katamtaman (108%)', labelEn: 'Medium (108%)', sizeDesc: '17.5px Base' },
    { id: 'large', labelFil: 'Malaki (115%)', labelEn: 'Large (115%)', sizeDesc: '18.5px Base' },
    { id: 'extra-large', labelFil: 'Napakalaki (125%)', labelEn: 'Extra Large (125%)', sizeDesc: '20px Base' },
  ];

  return (
    <div
      className={styles.tutorialBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
    >
      <div
        className={styles.tutorialModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 22px',
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
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.18)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--accent-cyan)',
                }}
              >
                {language === 'fil'
                  ? 'MGA SETTING SA ACCESSIBILITY AT TEMA'
                  : 'ACCESSIBILITY & THEME SETTINGS'}
              </div>
              <h2
                id="accessibility-settings-title"
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {language === 'fil'
                  ? 'Pagsasaayos ng Hitsura at Pagbasa'
                  : 'Appearance & Readability Center'}
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
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
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
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
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
              onClick={onClose}
              aria-label="Close Settings"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '7px',
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

        {/* Scrollable Modal Content */}
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* SECTION 1: VISUAL GLASSMORPHISM THEMES */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Palette size={16} className="text-cyan-400" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'fil' ? 'Pumili ng Visual Theme (7 Opsyon)' : 'Glassmorphism Themes (7 Options)'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
              {language === 'fil'
                ? 'Pumili sa pagitan ng mga daylight mode para sa maliwanag na opisina o dark glass modes para sa mas mababang pagod sa mata.'
                : 'Select high-contrast daylight civic themes for bright offices or deep navy glass modes for reduced eye strain.'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
              }}
            >
              {APP_THEMES.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      onThemeChange(theme.id);
                      if (showToast) {
                        showToast(
                          language === 'fil'
                            ? `Nai-set ang tema sa: ${theme.name}`
                            : `Activated theme: ${theme.name}`,
                          'info'
                        );
                      }
                    }}
                    style={{
                      background: isActive
                        ? 'rgba(56, 189, 248, 0.16)'
                        : 'rgba(15, 23, 42, 0.65)',
                      border: `2px solid ${isActive ? 'var(--accent-cyan)' : 'var(--glass-border)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 160ms ease',
                      boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: theme.swatch,
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          display: 'inline-block',
                          shrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                          {theme.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {theme.isLight ? '☀️ ' : '🌙 '} {theme.badge}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--accent-cyan)',
                          color: '#04162e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: TEXT SCALE ADJUSTMENT */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Type size={16} className="text-cyan-400" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'fil' ? 'Sukat ng mga Letra (Text Scaling)' : 'Text Scale & Typography Size'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
              {language === 'fil'
                ? 'Isaayos ang laki ng mga letra sa buong sistema upang maging komportable sa pagbabasa kahit sa maliliit na screen.'
                : 'Adjust font scaling proportionally across dashboards, tables, forms, and dialogs for optimal legibility.'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {textScaleOptions.map((opt) => {
                const isSelected = textScale === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onTextScaleChange(opt.id);
                      if (showToast) {
                        showToast(
                          language === 'fil'
                            ? `Nai-set ang text scale sa: ${opt.labelFil}`
                            : `Set text scale to: ${opt.labelEn}`,
                          'info'
                        );
                      }
                    }}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                        : 'rgba(15, 23, 42, 0.7)',
                      border: `1.5px solid ${isSelected ? '#38bdf8' : 'var(--glass-border)'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>
                      {language === 'fil' ? opt.labelFil : opt.labelEn}
                    </div>
                    <div style={{ fontSize: '11px', color: isSelected ? '#e0f2fe' : 'var(--text-muted)', marginTop: '2px' }}>
                      {opt.sizeDesc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Typography Preview Box */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                {language === 'fil' ? 'Live Typography Preview:' : 'Live Typography Preview:'}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Department of Engineering Office • City of Manila (DEPW)
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {language === 'fil'
                  ? 'Opisyal na talaan ng barangay declogging at inspeksyon ng drainage sa 16 na distrito.'
                  : 'Official barangay declogging and drainage inspection records across 16 Manila districts.'}
              </div>
            </div>
          </div>

          {/* SECTION 3: ACCESSIBILITY TOGGLE SWITCHES (High Contrast, Reduced Motion, Easy Mode) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={16} className="text-cyan-400" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'fil' ? 'Mga Katangian sa Accessibility' : 'Accessibility Features'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* High Contrast Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {language === 'fil' ? 'High Contrast Mode' : 'High Contrast Mode'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {language === 'fil'
                      ? 'Pinalalakas ang mga border at pinatitingkad ang mga teksto para sa maximum legibility.'
                      : 'Enforces opaque backdrops, 2px vivid borders, and maximum luminance contrast.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onHighContrastToggle}
                  role="switch"
                  aria-checked={highContrast}
                  style={{
                    width: '52px',
                    height: '28px',
                    borderRadius: '14px',
                    background: highContrast ? '#059669' : 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: highContrast ? '26px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'all 200ms ease',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                    }}
                  />
                </button>
              </div>

              {/* Reduced Motion Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {language === 'fil' ? 'Reduced Motion (Walang Animasyon)' : 'Reduced Motion'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {language === 'fil'
                      ? 'Inaalis ang mga background glow animation at transitions para sa mga sensitibo sa galaw.'
                      : 'Disables background glows, pulse animations, and heavy transitions for vestibular comfort.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onReducedMotionToggle}
                  role="switch"
                  aria-checked={reducedMotion}
                  style={{
                    width: '52px',
                    height: '28px',
                    borderRadius: '14px',
                    background: reducedMotion ? '#0284c7' : 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: reducedMotion ? '26px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'all 200ms ease',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                    }}
                  />
                </button>
              </div>

              {/* Easy Mode Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {language === 'fil' ? 'Easy Mode (Payak na Anyo)' : 'Easy Mode Layout'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {language === 'fil'
                      ? 'Mas malalaking button at pinasimpleng espasyo para sa mabilisang trabaho sa mobile.'
                      : 'Enlarges touch targets and simplifies spacing without hiding core operational features.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onEasyModeToggle}
                  role="switch"
                  aria-checked={easyMode}
                  style={{
                    width: '52px',
                    height: '28px',
                    borderRadius: '14px',
                    background: easyMode ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: easyMode ? '26px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'all 200ms ease',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-navy-mid)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              if (onResetDefaults) onResetDefaults();
              if (showToast) {
                showToast(
                  language === 'fil'
                    ? 'Naibalik sa default ang lahat ng setting.'
                    : 'Reset all settings to system defaults.',
                  'info'
                );
              }
            }}
            style={{ fontSize: '13px', padding: '7px 14px' }}
          >
            <RotateCcw size={14} />
            <span>{language === 'fil' ? 'Ibalik sa Default' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onClose}
            style={{ fontSize: '14px', padding: '8px 22px' }}
          >
            <Check size={16} />
            <span>{language === 'fil' ? 'Tapos Na (I-save)' : 'Done (Save Settings)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
