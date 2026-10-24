/**
 * Centralized Frontend REST API Service for DEPW Assist
 */

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `HTTP ${res.status} error`;
    const err = new Error(msg);
    err.details = data.details || null;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getHealth: () => requestJson('/api/health'),
  getMetrics: () => requestJson('/api/metrics'),
  getGlobalAuditLogs: (limit = 50) => requestJson(`/api/audit-logs?limit=${limit}`),
  getTickets: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.set(k, String(v));
      }
    });
    return requestJson(`/api/tickets?${qs.toString()}`);
  },
  getTicketById: (ticketId) => requestJson(`/api/tickets/${encodeURIComponent(ticketId)}`),
  getTicketAuditLogs: (ticketId) => requestJson(`/api/tickets/${encodeURIComponent(ticketId)}/audit`),
  createTicket: (payload) =>
    requestJson('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTicket: (ticketId, payload) =>
    requestJson(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  transitionTicketStatus: (ticketId, payload) =>
    requestJson(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTicket: (ticketId) =>
    requestJson(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'DELETE',
    }),
  getOperationsData: () => requestJson('/api/operations'),
  createScheduleEvent: (payload) =>
    requestJson('/api/operations/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  geocodeStreet: (query) =>
    requestJson(`/api/geocode?q=${encodeURIComponent(query)}`),
  geocode: (query) =>
    requestJson(`/api/geocode?q=${encodeURIComponent(query)}`),
  runAiAssist: (payload) =>
    requestJson('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  aiAssist: (payload) =>
    requestJson('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  runMapsGrounding: (payload) =>
    requestJson('/api/ai/maps-grounding', {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { query: payload } : payload),
    }),
  mapsGrounding: (payload) =>
    requestJson('/api/ai/maps-grounding', {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { query: payload } : payload),
    }),
  generateTtsAudio: (payload) =>
    requestJson('/api/ai/tts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  tts: (text, voiceName = 'Kore') =>
    requestJson('/api/ai/tts', {
      method: 'POST',
      body: JSON.stringify(typeof text === 'object' ? text : { text, voiceName }),
    }),
  generateSiteImage: (payload) =>
    requestJson('/api/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateImage: (payload) =>
    requestJson('/api/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateDrainageVideo: (payload) =>
    requestJson('/api/ai/generate-video', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateVideo: (payload) =>
    requestJson('/api/ai/generate-video', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

