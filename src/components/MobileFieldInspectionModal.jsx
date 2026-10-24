import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Navigation,
  FileCheck,
  Send,
  Upload,
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';

export default function MobileFieldInspectionModal({
  isOpen,
  onClose,
  tickets = [],
  onSaveInspectionReport,
  showToast,
}) {
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.ticketId || 'DEO-2026-001');
  const [inspectorName, setInspectorName] = useState('Engr. Danilo Ramos (DEPW Inspector)');
  const [kagawadWitness, setKagawadWitness] = useState('Kagawad Maria Santos');
  const [siltDepthCm, setSiltDepthCm] = useState(45);
  const [gasReadingPpm, setGasReadingPpm] = useState(1.8);
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    manholeCoverAccessible: true,
    h2sSafeLevel: true,
    trafficAdvisoryPosted: true,
    barangayWitnessPresent: true,
    vacuumJettingFeasible: true,
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('depw_field_inspection_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.ticketId) setSelectedTicketId(parsed.ticketId);
        if (parsed.inspectorName) setInspectorName(parsed.inspectorName);
        if (parsed.kagawadWitness) setKagawadWitness(parsed.kagawadWitness);
        if (parsed.siltDepthCm) setSiltDepthCm(parsed.siltDepthCm);
        if (parsed.gasReadingPpm) setGasReadingPpm(parsed.gasReadingPpm);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.checklist) setChecklist(parsed.checklist);
        if (parsed.gpsCoords) setGpsCoords(parsed.gpsCoords);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveDraft = () => {
    try {
      const draft = {
        ticketId: selectedTicketId,
        inspectorName,
        kagawadWitness,
        siltDepthCm,
        gasReadingPpm,
        notes,
        checklist,
        gpsCoords,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('depw_field_inspection_draft', JSON.stringify(draft));
      if (showToast) showToast('Inspection draft safely saved to device storage.', 'success');
    } catch (err) {
      if (showToast) showToast(`Draft error: ${err.message}`, 'error');
    }
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setGpsCoords({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          accuracyMeters: Math.round(pos.coords.accuracy),
          timestamp: new Date().toLocaleTimeString(),
        });
        if (showToast) {
          showToast(`GPS pinned: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`, 'success');
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(`GPS Notice: ${err.message}. Using default Manila City Hall coordinates.`);
        setGpsCoords({
          latitude: 14.5895,
          longitude: 120.9817,
          accuracyMeters: 25,
          timestamp: new Date().toLocaleTimeString(),
          isFallback: true,
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        if (showToast) showToast('Field photo attached to inspection report.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const report = {
      id: `INSP-${Date.now()}`,
      ticketId: selectedTicketId,
      inspectorName,
      kagawadWitness,
      siltDepthCm,
      gasReadingPpm,
      notes,
      checklist,
      gpsCoords,
      hasPhoto: Boolean(photoPreview),
      submittedAt: new Date().toLocaleString(),
    };

    if (onSaveInspectionReport) {
      onSaveInspectionReport(report);
    }
    try {
      localStorage.removeItem('depw_field_inspection_draft');
    } catch {}
    if (showToast) {
      showToast(`Field Inspection Report submitted for ticket ${selectedTicketId}!`, 'success');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.tutorialBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Field Inspection Form"
    >
      <div
        className={styles.tutorialModal}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-navy-mid)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Navigation size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                MANILA DEPW FIELD OPERATIONS
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Mobile Field Inspection Mode
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Inspection Modal"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Ticket Selection */}
          <div>
            <label className={styles.fieldLabel}>Select Target Request Ticket</label>
            <select
              className={styles.glassSelect}
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
              style={{ fontSize: '15px', fontWeight: 600 }}
            >
              {tickets.map((t) => (
                <option key={t.ticketId} value={t.ticketId} className="bg-slate-900 text-white">
                  {t.ticketId} — {t.barangay} ({t.streetAddress})
                </option>
              ))}
            </select>
          </div>

          {/* Inspector and Witness Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label className={styles.fieldLabel}>DEPW Field Engineer / Lead</label>
              <input
                type="text"
                className={styles.glassInput}
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Barangay Official Witness</label>
              <input
                type="text"
                className={styles.glassInput}
                value={kagawadWitness}
                onChange={(e) => setKagawadWitness(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Silt Depth & Gas Testing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '10px' }}>
              <label className={styles.fieldLabel}>Measured Silt Depth (cm)</label>
              <input
                type="number"
                min="0"
                max="200"
                className={styles.glassInput}
                value={siltDepthCm}
                onChange={(e) => setSiltDepthCm(Number(e.target.value))}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Standard threshold: &gt; 30cm requires heavy vacuum jetting
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '10px' }}>
              <label className={styles.fieldLabel}>H2S Gas Reading (ppm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                className={styles.glassInput}
                value={gasReadingPpm}
                onChange={(e) => setGasReadingPpm(Number(e.target.value))}
              />
              <div style={{ fontSize: '12px', color: gasReadingPpm >= 3.0 ? '#f87171' : '#6ee7b7', marginTop: '4px', fontWeight: 600 }}>
                {gasReadingPpm >= 3.0 ? '⚠️ Caution: Exceeds 3.0 ppm safe limit. Ventilate culvert!' : '✓ Safe atmospheric gas level (< 3.0 ppm)'}
              </div>
            </div>
          </div>

          {/* Safety Checklist */}
          <div>
            <label className={styles.fieldLabel}>Field Inspection Safety Checklist</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'manholeCoverAccessible', label: 'Manhole covers clear of asphalt / accessible for lifting' },
                { key: 'h2sSafeLevel', label: 'Atmospheric multigas verified safe for confined space approach' },
                { key: 'trafficAdvisoryPosted', label: 'Safety cones & traffic marshall deployed for lane security' },
                { key: 'barangayWitnessPresent', label: 'Barangay Kagawad or Tanod present on-site as formal witness' },
                { key: 'vacuumJettingFeasible', label: 'Road width sufficient for DEPW vacuum truck & water jetter access' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => setChecklist({ ...checklist, [item.key]: !checklist[item.key] })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* GPS Coordinate Capture */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span className={styles.fieldLabel} style={{ marginBottom: 0 }}>On-Site GPS Coordinate Verification</span>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Capture actual field latitude & longitude from device sensors
                </div>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleCaptureGps}
                disabled={gpsLoading}
                style={{ fontSize: '13px', padding: '6px 12px' }}
              >
                <MapPin size={14} className="text-cyan-400" />
                <span>{gpsLoading ? 'Acquiring GPS...' : 'Capture GPS Position'}</span>
              </button>
            </div>

            {gpsCoords && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', fontSize: '13px', color: '#6ee7b7' }}>
                📍 <strong>Verified Coords:</strong> {gpsCoords.latitude}, {gpsCoords.longitude} (Accuracy: ±{gpsCoords.accuracyMeters}m at {gpsCoords.timestamp})
              </div>
            )}
            {gpsError && (
              <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px' }}>
                {gpsError}
              </div>
            )}
          </div>

          {/* Photo Attachment */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '10px' }}>
            <label className={styles.fieldLabel}>Attach Culvert / Drainage Photo Evidence</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px dashed var(--accent-cyan)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                <Camera size={16} className="text-cyan-400" />
                <span>Take Photo or Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {photoPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={photoPreview}
                    alt="Inspection Evidence Preview"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: 600 }}>Photo attached</span>
                </div>
              )}
            </div>
          </div>

          {/* Field Notes */}
          <div>
            <label className={styles.fieldLabel}>Field Engineering Observations & Crew Notes</label>
            <textarea
              className={styles.glassTextarea}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record specific culvert conditions, obstructions, or equipment recommendations..."
            />
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid var(--glass-border)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleSaveDraft}
              style={{ fontSize: '13px' }}
            >
              <Save size={14} />
              <span>Save Local Draft</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onClose}
                style={{ fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.primaryBtn}
                style={{ fontSize: '14px', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}
              >
                <Send size={15} />
                <span>Submit Inspection Report</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
