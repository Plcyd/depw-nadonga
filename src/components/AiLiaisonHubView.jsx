import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Mail, Volume2, Mic, MicOff, Image as ImageIcon, Video,
  Copy, Check, AlertTriangle, Send, RefreshCw, ShieldAlert, FileText, Cpu
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import { api } from '../services/api.js';
import {
  signInAndConnectGmail,
  getCachedGoogleAccessToken,
  listGmailDecloggingMessages,
  createGmailDraft
} from '../services/firebaseClient.js';
import {
  MANILA_DISTRICTS,
  DRAINAGE_TYPES,
  generateSampleRequestLetter,
  evaluateTicketCompleteness
} from '../utils/workflowRules.js';

export default function AiLiaisonHubView({ tickets = [], user, onUserChange, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('assistant'); // 'assistant' | 'gmail' | 'media' | 'live'

  // 1. AI Assistant State
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id || 'DEO-2026-001');
  const [aiMode, setAiMode] = useState('flash'); // 'flash' | 'thinking' | 'fast' | 'rule'
  const [taskType, setTaskType] = useState('draft_letter'); // 'draft_letter' | 'missing_info' | 'status_memo'
  const [barangayInput, setBarangayInput] = useState('Barangay 455, Zone 45');
  const [districtInput, setDistrictInput] = useState('Sampaloc');
  const [streetInput, setStreetInput] = useState('España Boulevard cor. Maceda St.');
  const [kagawadInput, setKagawadInput] = useState('Kagawad Juan D. Cruz — DUMMY NAME');
  const [drainageInput, setDrainageInput] = useState('Closed Box Culvert');
  const [issueNotes, setIssueNotes] = useState('Heavy silt accumulation and plastic debris causing ankle-deep water ponding after rain.');
  const [aiOutput, setAiOutput] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState('Rule-Based Template');
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);

  // 2. Gmail Liaison State
  const [gmailMessages, setGmailMessages] = useState([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailQuery, setGmailQuery] = useState('subject:(declogging OR drainage OR barangay)');
  const [draftRecipient, setDraftRecipient] = useState('brgy455.sample@example.org');
  const [draftSubject, setDraftSubject] = useState('[SAMPLE DATA] DEPW Coordination Update — Ref: DEO-2026-001');
  const [draftBody, setDraftBody] = useState(
    'Magandang araw po!\n\nIto po ay opisyal na koordinasyon mula sa Department of Engineering Office (SAMPLE TRAINING DEMO) kaugnay ng inyong kahilingan sa declogging.\n\nStatus: For Inspection\nSusunod na Hakbang: Field ocular inspection kasama ang Barangay Kagawad.\n\nMaraming salamat po.'
  );
  const [confirmGmailModal, setConfirmGmailModal] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);

  // 3. Multimodal Image & Video State
  const [imagePrompt, setImagePrompt] = useState(
    'Civil engineering field crew inspecting a clean reinforced concrete urban street drainage curb inlet in Manila during daytime, architectural visualization style'
  );
  const [imageSize, setImageSize] = useState('1K');
  const [imageAspect, setImageAspect] = useState('16:9');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState(
    'Smooth architectural 3D animation of clean stormwater flowing through a modern underground concrete box culvert drainage channel'
  );
  const [videoAspect, setVideoAspect] = useState('16:9');
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // 4. Live Voice Liaison WebSocket State
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveInput, setLiveInput] = useState('');
  const [liveTranscripts, setLiveTranscripts] = useState([
    {
      role: 'system',
      text: 'DEPW Live Liaison Session Ready (gemini-3.8-live). Connect to practice Barangay Kagawad intake calls or ask real-time engineering workflow questions.'
    }
  ]);
  const wsRef = useRef(null);

  const formatLetterObj = (letter) => {
    if (typeof letter === 'string') return letter;
    return [
      `Reference No: ${letter.referenceNo}`,
      `Date: ${letter.date}`,
      `To: ${letter.to}`,
      `From: ${letter.from}`,
      `Through: ${letter.through}`,
      `Subject: ${letter.subject}`,
      '',
      `“${letter.bodyTagalog}”`,
      '',
      `---`,
      letter.disclaimer
    ].join('\n');
  };

  useEffect(() => {
    const initialLetter = generateSampleRequestLetter({
      dateReceived: 'October 20, 2026',
      barangay: barangayInput,
      district: districtInput,
      requesterName: kagawadInput,
      streetAddress: streetInput,
      requestType: drainageInput
    });
    setAiOutput(formatLetterObj(initialLetter));
  }, []);

  const handleLoadFromTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    const found = tickets.find((t) => (t.ticketId || t.id) === ticketId);
    if (found) {
      const tid = found.ticketId || found.id;
      setBarangayInput(found.barangay);
      setDistrictInput(found.district);
      setStreetInput(found.streetAddress || found.street);
      setKagawadInput(found.requesterName || found.requester_name);
      setDrainageInput(found.requestType || found.drainage_type);
      setIssueNotes(found.description);
      setDraftSubject(`[SAMPLE DATA] DEPW Coordination Update — Ref: ${tid} (${found.barangay})`);
    }
  };

  const handleGenerateAi = async () => {
    setAiLoading(true);
    try {
      if (aiMode === 'rule') {
        if (taskType === 'draft_letter') {
          const letterObj = generateSampleRequestLetter({
            dateReceived: 'October 20, 2026',
            barangay: barangayInput,
            district: districtInput,
            requesterName: kagawadInput,
            streetAddress: streetInput,
            requestType: drainageInput
          });
          setAiOutput(formatLetterObj(letterObj));
          setAiModelUsed('Deterministic Rule Engine (Offline Safe)');
        } else if (taskType === 'missing_info') {
          const check = evaluateTicketCompleteness({
            barangay: barangayInput,
            district: districtInput,
            streetAddress: streetInput,
            requesterName: kagawadInput,
            description: issueNotes,
            latitude: 14.611,
            longitude: 120.995
          });
          const missingArr = check.missing || check.missingItems || [];
          setAiOutput(
            `COMPLETENESS SCORE: ${check.score}% (${check.isComplete ? 'READY FOR REVIEW' : 'NEEDS ADDITIONAL INFO'})\n\n` +
            `Missing / Recommended Items:\n` +
            (missingArr.length > 0 ? missingArr.map((m) => `• ${m}`).join('\n') : '• All core intake fields present.') +
            `\n\nAdvisory Note: Human engineering verification is required before field scheduling.`
          );
          setAiModelUsed('Deterministic Completeness Rules');
        } else {
          setAiOutput(
            `MEMORANDUM FOR COORDINATING LIAISON (SAMPLE DATA)\n` +
            `Subject: Status Update for ${barangayInput} (${districtInput})\n` +
            `Location: ${streetInput} — ${drainageInput}\n\n` +
            `Summary of Field Report:\n${issueNotes}\n\n` +
            `Recommended Action: Verify site access with ${kagawadInput} and schedule DEPW Area Engineering Team ocular inspection.`
          );
          setAiModelUsed('Deterministic Rule Engine');
        }
        return;
      }

      const promptMap = {
        draft_letter: `Draft a formal, respectful bilingual (Filipino and English) Barangay Declogging Request Letter addressed to the Department of Engineering Office (City of Manila) from ${barangayInput} (${districtInput}), through ${kagawadInput}, requesting declogging assistance at ${streetInput} (${drainageInput}). Field observation: ${issueNotes}. Clearly label as SAMPLE TRAINING DATA / NOT AN OFFICIAL GOVERNMENT DOCUMENT.`,
        missing_info: `Review this Barangay Declogging Request intake for completeness and potential missing engineering details: Barangay: ${barangayInput}, District: ${districtInput}, Street: ${streetInput}, Drainage Type: ${drainageInput}, Contact Person: ${kagawadInput}, Description: ${issueNotes}. Provide a clear bulleted completeness checklist and explain what the Liaison Officer should clarify before forwarding to the Area Engineer.`,
        status_memo: `Write a concise, clear Liaison Status Coordination Memo for Barangay Officials summarizing the request at ${streetInput}, ${barangayInput} (${districtInput}) for ${drainageInput}. Explain the next workflow steps clearly without making unauthorized scheduling promises. Include a SAMPLE DATA disclaimer.`
      };

      const res = await api.aiAssist({
        mode: aiMode,
        task: taskType,
        prompt: promptMap[taskType],
        ticketData: {
          barangay: barangayInput,
          district: districtInput,
          streetAddress: streetInput,
          requestType: drainageInput,
          requesterName: kagawadInput,
          description: issueNotes
        }
      });

      setAiOutput(res.result || res.text || '');
      setAiModelUsed(res.modelUsed || res.model || aiMode);
    } catch (err) {
      if (showToast) showToast(`AI assist fallback activated: ${err.message}`, 'info');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePlayTts = async () => {
    if (!aiOutput.trim()) return;
    setTtsLoading(true);
    try {
      const res = await api.tts(aiOutput.slice(0, 550), 'Kore');
      if (res.audioBase64) {
        const audioSrc = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.play();
        if (showToast) showToast('Playing Gemini TTS voice readout...', 'success');
      } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiOutput.slice(0, 450));
        utterance.lang = 'tl-PH';
        window.speechSynthesis.speak(utterance);
        if (showToast) showToast('Playing browser speech readout (fallback)...', 'info');
      }
    } catch (err) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiOutput.slice(0, 450));
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setTtsLoading(false);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (showToast) showToast('Copied AI Liaison text to clipboard.', 'success');
  };

  // Gmail handlers
  const handleConnectGmail = async () => {
    setGmailLoading(true);
    try {
      const { user: signedInUser, accessToken } = await signInAndConnectGmail();
      if (onUserChange) onUserChange(signedInUser);
      if (accessToken) {
        const msgs = await listGmailDecloggingMessages(gmailQuery);
        setGmailMessages(msgs);
        if (showToast) showToast(`Connected Gmail & loaded ${msgs.length} liaison threads.`, 'success');
      }
    } catch (err) {
      if (showToast) showToast(`Gmail authentication notice: ${err.message}`, 'error');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleRefreshGmail = async () => {
    setGmailLoading(true);
    try {
      const msgs = await listGmailDecloggingMessages(gmailQuery);
      setGmailMessages(msgs);
    } catch (err) {
      if (showToast) showToast(`Gmail search error: ${err.message}`, 'error');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleConfirmCreateGmailDraft = async () => {
    setCreatingDraft(true);
    try {
      await createGmailDraft({
        to: draftRecipient,
        subject: draftSubject,
        body: draftBody
      });
      setConfirmGmailModal(false);
      if (showToast) showToast('Gmail draft created in your Google Workspace account.', 'success');
    } catch (err) {
      if (showToast) showToast(`Failed to create Gmail draft: ${err.message}`, 'error');
    } finally {
      setCreatingDraft(false);
    }
  };

  // Media Generation Handlers
  const handleGenerateSiteImage = async () => {
    setImageLoading(true);
    try {
      const res = await api.generateImage({
        prompt: imagePrompt,
        imageSize,
        aspectRatio: imageAspect
      });
      if (res.imageBase64) {
        setGeneratedImage(`data:${res.mimeType || 'image/png'};base64,${res.imageBase64}`);
        if (showToast) showToast(`Generated ${imageSize} engineering visualization.`, 'success');
      } else {
        if (showToast) showToast(res.error || 'Image generation unavailable.', 'info');
      }
    } catch (err) {
      if (showToast) showToast(`Image generation error: ${err.message}`, 'error');
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateSiteVideo = async () => {
    setVideoLoading(true);
    try {
      const res = await api.generateVideo({
        prompt: videoPrompt,
        aspectRatio: videoAspect,
        resolution: '720p',
        duration: 6
      });
      if (res.videoBase64) {
        setGeneratedVideo(`data:${res.mimeType || 'video/mp4'};base64,${res.videoBase64}`);
        if (showToast) showToast('Generated Omni Flash drainage simulation video.', 'success');
      } else {
        if (showToast) showToast(res.error || 'Video generation returned no stream.', 'info');
      }
    } catch (err) {
      if (showToast) showToast(`Video generation error: ${err.message}`, 'error');
    } finally {
      setVideoLoading(false);
    }
  };

  // Live API WebSocket Handlers
  const toggleLiveSession = () => {
    if (liveConnected && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setLiveConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setLiveConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'text' && msg.text) {
          setLiveTranscripts((prev) => [...prev, { role: 'assistant', text: msg.text }]);
        } else if (msg.type === 'status') {
          setLiveTranscripts((prev) => [...prev, { role: 'system', text: msg.message }]);
        } else if (msg.type === 'error') {
          setLiveTranscripts((prev) => [...prev, { role: 'system', text: `Live Notice: ${msg.message}` }]);
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setLiveConnected(false);
    };
  };

  const handleSendLiveTurn = (e) => {
    e.preventDefault();
    if (!liveInput.trim()) return;
    const text = liveInput.trim();
    setLiveTranscripts((prev) => [...prev, { role: 'user', text }]);
    setLiveInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text }));
    } else {
      // Fallback response if WebSocket is not active
      setTimeout(() => {
        setLiveTranscripts((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `[Liaison Coach Advisory]: Para sa kahilingan ng ${barangayInput}, siguraduhin pong naitala ang eksaktong kalye (${streetInput}), landmark, at pangalan ng Barangay Kagawad bago ipadala sa Area Engineer para sa Ocular Inspection.`
          }
        ]);
      }, 400);
    }
  };

  const hasGmailToken = Boolean(getCachedGoogleAccessToken());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header & Sub-Navigation */}
      <div className={styles.glassPanel} style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
                HUMAN-IN-THE-LOOP AI & GOOGLE WORKSPACE LIAISON HUB
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Bilingual Request Drafting, Gmail Liaison & Multimodal Field Studio
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'assistant', label: 'AI Letter & Intake Assistant', icon: FileText },
              { id: 'gmail', label: 'Gmail Workspace Liaison', icon: Mail },
              { id: 'media', label: '3D / Site Image & Video Studio', icon: ImageIcon },
              { id: 'live', label: 'Live Liaison Coach (WebSocket)', icon: Mic }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={active ? styles.primaryBtn : styles.secondaryBtn}
                  onClick={() => setActiveSubTab(tab.id)}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: AI LETTER & INTAKE ASSISTANT */}
      {activeSubTab === 'assistant' && (
        <div className={styles.splitGrid}>
          {/* Left: Form Inputs & Model Selector */}
          <div className={styles.glassPanel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                1. Configure Barangay Request Context
              </span>
              <select
                className={styles.glassSelect}
                style={{ width: 'auto', fontSize: '12px', padding: '5px 10px' }}
                value={selectedTicketId}
                onChange={(e) => handleLoadFromTicket(e.target.value)}
              >
                {tickets.map((t) => {
                  const tid = t.ticketId || t.id;
                  return (
                    <option key={tid} value={tid}>Load {tid} ({t.district})</option>
                  );
                })}
              </select>
            </div>

            {/* AI Engine Selector */}
            <div>
              <label className={styles.fieldLabel}>Select AI Engine / Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'flash', label: 'Gemini 3.8 Flash', desc: 'Balanced Bilingual Drafting' },
                  { id: 'thinking', label: 'Gemini 4 Argon (Thinking)', desc: 'Deep Engineering Review' },
                  { id: 'fast', label: 'Gemini 3.1 Flash-Lite', desc: 'Fast Intake Check' },
                  { id: 'rule', label: 'Deterministic Rule Engine', desc: 'Zero-Latency Template' }
                ].map((m) => (
                  <div
                    key={m.id}
                    className={styles.glassCard}
                    onClick={() => setAiMode(m.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderColor: aiMode === m.id ? '#38bdf8' : 'rgba(148,163,184,0.18)',
                      background: aiMode === m.id ? 'rgba(56,189,248,0.14)' : undefined
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Type Selector */}
            <div>
              <label className={styles.fieldLabel}>Liaison Task</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'draft_letter', label: 'Formal Request Letter (Filipino/English)' },
                  { id: 'missing_info', label: 'Completeness & Missing-Info Audit' },
                  { id: 'status_memo', label: 'Barangay Coordination Memo' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={taskType === t.id ? styles.primaryBtn : styles.secondaryBtn}
                    style={{ fontSize: '12px', padding: '7px 11px' }}
                    onClick={() => setTaskType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.fieldLabel}>Barangay (Sample)</label>
                <input
                  type="text"
                  className={styles.glassInput}
                  value={barangayInput}
                  onChange={(e) => setBarangayInput(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Manila District</label>
                <select
                  className={styles.glassSelect}
                  value={districtInput}
                  onChange={(e) => setDistrictInput(e.target.value)}
                >
                  {MANILA_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.fieldLabel}>Exact Street & Corner</label>
                <input
                  type="text"
                  className={styles.glassInput}
                  value={streetInput}
                  onChange={(e) => setStreetInput(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Drainage Infrastructure Type</label>
                <select
                  className={styles.glassSelect}
                  value={drainageInput}
                  onChange={(e) => setDrainageInput(e.target.value)}
                >
                  {DRAINAGE_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={styles.fieldLabel}>Submitting Official (Fictional / Sample Name Only)</label>
              <input
                type="text"
                className={styles.glassInput}
                value={kagawadInput}
                onChange={(e) => setKagawadInput(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Field Condition / Silt & Flooding Notes</label>
              <textarea
                className={styles.glassTextarea}
                rows={3}
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleGenerateAi}
              disabled={aiLoading}
              style={{ justifyContent: 'center', padding: '12px' }}
            >
              <Sparkles size={16} />
              {aiLoading ? 'Generating Liaison Document...' : 'Generate Advisory Document'}
            </button>
          </div>

          {/* Right: Document Output + TTS Readout */}
          <div className={styles.glassPanel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  ADVISORY OUTPUT • {aiModelUsed}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Requires human engineering review before official release
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handlePlayTts}
                  disabled={ttsLoading}
                >
                  <Volume2 size={14} /> {ttsLoading ? 'Synthesizing...' : 'Read Aloud (TTS)'}
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleCopyOutput}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
            </div>

            <div
              className={styles.glassCard}
              style={{
                flex: 1,
                padding: '18px',
                background: 'rgba(4, 9, 20, 0.78)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                lineHeight: 1.65,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                minHeight: '360px',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              {aiOutput}
            </div>

            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              fontSize: '12px',
              color: '#fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={16} />
              <span>
                <strong>Human-in-the-Loop Safeguard:</strong> AI-generated drafts are for training and liaison assistance only. Authorized DEPW Engineers validate all inspections and schedules.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GMAIL WORKSPACE LIAISON */}
      {activeSubTab === 'gmail' && (
        <div className={styles.splitGrid}>
          {/* Left: Gmail Inbox Reader */}
          <div className={styles.glassPanel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  GOOGLE WORKSPACE OAUTH 2.0 (gmail.readonly)
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                  Barangay Declogging Email Threads
                </h3>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleConnectGmail}
                disabled={gmailLoading}
              >
                <Mail size={14} />
                {hasGmailToken ? 'Reconnect Gmail OAuth' : 'Sign In & Connect Gmail'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className={styles.glassInput}
                value={gmailQuery}
                onChange={(e) => setGmailQuery(e.target.value)}
                placeholder="Gmail query filter..."
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleRefreshGmail}
                disabled={!hasGmailToken || gmailLoading}
              >
                <RefreshCw size={14} /> Search
              </button>
            </div>

            {!hasGmailToken ? (
              <div className={styles.glassCard} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                <Mail size={28} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  Connect Google Workspace Gmail
                </div>
                <p style={{ fontSize: '12px', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Authenticate with your Google account to search incoming Barangay request emails and compose official liaison response drafts.
                </p>
                <button type="button" className={styles.primaryBtn} onClick={handleConnectGmail}>
                  Authorize Gmail Access
                </button>
              </div>
            ) : gmailMessages.length === 0 ? (
              <div className={styles.glassCard} style={{ padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                No matching Gmail threads found for query <code>{gmailQuery}</code>. Try searching <code>label:inbox</code>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                {gmailMessages.map((msg) => (
                  <div key={msg.id} className={styles.glassCard} style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{msg.subject}</div>
                    <div style={{ fontSize: '11px', color: '#38bdf8', margin: '2px 0 6px 0' }}>
                      From: {msg.from} • {msg.date}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45 }}>{msg.snippet}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Gmail Draft Composer with Mandatory Confirmation Modal */}
          <div className={styles.glassPanel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                GMAIL DRAFT COMPOSER (gmail.compose • HUMAN CONFIRMATION REQUIRED)
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                Prepare Barangay Liaison Response Draft
              </h3>
            </div>

            <div>
              <label className={styles.fieldLabel}>Recipient Email (Sample / Training Address)</label>
              <input
                type="email"
                className={styles.glassInput}
                value={draftRecipient}
                onChange={(e) => setDraftRecipient(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Subject Line</label>
              <input
                type="text"
                className={styles.glassInput}
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Draft Message Body</label>
              <textarea
                className={styles.glassTextarea}
                rows={7}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setDraftBody(aiOutput)}
              >
                Copy Current AI Letter into Body
              </button>

              <button
                type="button"
                className={styles.orangeBtn}
                onClick={() => setConfirmGmailModal(true)}
              >
                <Send size={14} /> Review & Save to Gmail Drafts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MULTIMODAL SITE IMAGE (gemini-3-pro-image) & VIDEO (gemini-omni-1.1-flash) */}
      {activeSubTab === 'media' && (
        <div className={styles.splitGrid}>
          {/* Left: High-Res Image Generation */}
          <div className={styles.glassPanel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                GEMINI 3 PRO IMAGE (gemini-3-pro-image • 1K / 2K / 4K)
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                Drainage Rehabilitation & Site Concept Visualizer
              </h3>
            </div>

            <div>
              <label className={styles.fieldLabel}>Engineering Visual Prompt</label>
              <textarea
                className={styles.glassTextarea}
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.fieldLabel}>Resolution (imageSize)</label>
                <select
                  className={styles.glassSelect}
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                >
                  <option value="1K">1K Standard</option>
                  <option value="2K">2K High Detail</option>
                  <option value="4K">4K Ultra Presentation</option>
                </select>
              </div>
              <div>
                <label className={styles.fieldLabel}>Aspect Ratio</label>
                <select
                  className={styles.glassSelect}
                  value={imageAspect}
                  onChange={(e) => setImageAspect(e.target.value)}
                >
                  <option value="16:9">16:9 Widescreen Slide</option>
                  <option value="4:3">4:3 Engineering Report</option>
                  <option value="1:1">1:1 Square Card</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleGenerateSiteImage}
              disabled={imageLoading}
            >
              <ImageIcon size={15} /> {imageLoading ? 'Rendering Image...' : 'Generate Site Concept Image'}
            </button>

            {generatedImage && (
              <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(56,189,248,0.3)' }}>
                <img src={generatedImage} alt="Generated drainage concept" style={{ width: '100%', display: 'block' }} />
              </div>
            )}
          </div>

          {/* Right: Omni Flash Video Generation */}
          <div className={styles.glassPanel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                OMNI FLASH INTERACTIONS API (gemini-omni-1.1-flash)
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                Stormwater Flow & Declogging Operation Video Generator
              </h3>
            </div>

            <div>
              <label className={styles.fieldLabel}>Simulation Video Prompt</label>
              <textarea
                className={styles.glassTextarea}
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Video Aspect Ratio</label>
              <select
                className={styles.glassSelect}
                value={videoAspect}
                onChange={(e) => setVideoAspect(e.target.value)}
              >
                <option value="16:9">16:9 Landscape Presentation</option>
                <option value="9:16">9:16 Vertical Field Briefing</option>
              </select>
            </div>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleGenerateSiteVideo}
              disabled={videoLoading}
            >
              <Video size={15} /> {videoLoading ? 'Generating Video via Interactions API...' : 'Generate Drainage Simulation Video'}
            </button>

            {generatedVideo && (
              <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(56,189,248,0.3)' }}>
                <video src={generatedVideo} controls style={{ width: '100%', display: 'block' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LIVE LIAISON COACH (gemini-3.8-live WebSocket) */}
      {activeSubTab === 'live' && (
        <div className={styles.glassPanel} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                REAL-TIME BIDIRECTIONAL LIAISON SESSION (gemini-3.8-live • WebSocket /live)
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                Interactive Barangay Intake & Liaison Coaching
              </h3>
            </div>

            <button
              type="button"
              className={liveConnected ? styles.orangeBtn : styles.primaryBtn}
              onClick={toggleLiveSession}
            >
              {liveConnected ? <MicOff size={15} /> : <Mic size={15} />}
              {liveConnected ? 'Disconnect Live Session' : 'Connect Live Liaison Bridge'}
            </button>
          </div>

          <div
            className={styles.glassCard}
            style={{
              padding: '16px',
              minHeight: '260px',
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {liveTranscripts.map((item, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background:
                    item.role === 'user'
                      ? 'rgba(2, 132, 199, 0.35)'
                      : item.role === 'system'
                      ? 'rgba(15, 23, 42, 0.85)'
                      : 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '13px',
                  color: '#f8fafc'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '3px', textTransform: 'uppercase' }}>
                  {item.role}
                </div>
                {item.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendLiveTurn} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className={styles.glassInput}
              placeholder="Ask the Live Liaison Coach (e.g., 'Paano ipaliwanag sa Barangay na For Inspection pa ang status?')..."
              value={liveInput}
              onChange={(e) => setLiveInput(e.target.value)}
            />
            <button type="submit" className={styles.primaryBtn}>
              <Send size={14} /> Send Turn
            </button>
          </form>
        </div>
      )}

      {/* MANDATORY GMAIL CONFIRMATION MODAL */}
      {confirmGmailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div className={styles.glassPanel} style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              <AlertTriangle size={16} /> Confirm Google Workspace Gmail Action
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 12px 0' }}>
              Create Gmail Draft in Your Account?
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Please verify the recipient, subject, and body below before saving this draft to your Gmail account:
            </p>
            <div className={styles.glassCard} style={{ padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#e2e8f0' }}>
              <div><strong>Action:</strong> Create Gmail Draft (<code>users.drafts.create</code>)</div>
              <div><strong>To:</strong> {draftRecipient}</div>
              <div><strong>Subject:</strong> {draftSubject}</div>
              <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto', color: '#94a3b8' }}>
                {draftBody}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setConfirmGmailModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleConfirmCreateGmailDraft}
                disabled={creatingDraft}
              >
                {creatingDraft ? 'Saving Draft...' : 'Confirm & Create Gmail Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
