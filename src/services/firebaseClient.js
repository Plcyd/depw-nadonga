import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  getDocFromServer,
  serverTimestamp,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

let isSigningIn = false;
let cachedAccessToken = null;

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const initAuth = (onAuthSuccess, onAuthFailure) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async () => {
  return cachedAccessToken;
};

export const getCachedGoogleAccessToken = () => cachedAccessToken;
export const signInAndConnectGmail = googleSignIn;

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Defensive payload sanitizer matching firebase-blueprint.json constraints
function sanitizeTicketForFirestore(ticket, uid) {
  return {
    ticketId: String(ticket.ticketId || 'DEO-2026-001').slice(0, 32),
    dateReceived: String(ticket.dateReceived || '10/20/2026').slice(0, 32),
    barangay: String(ticket.barangay || 'Brgy 123 SAMPLE').slice(0, 100),
    district: String(ticket.district || 'Tondo').slice(0, 60),
    legislativeDistrict: String(ticket.legislativeDistrict || '1st District').slice(0, 40),
    streetAddress: String(ticket.streetAddress || 'Sample Street').slice(0, 200),
    requestType: String(ticket.requestType || 'Declogging').slice(0, 40),
    status: String(ticket.status || 'For Verification').slice(0, 40),
    actionTaken: String(ticket.actionTaken || 'Documents received').slice(0, 300),
    nextStep: String(ticket.nextStep || 'Check completeness').slice(0, 300),
    requesterName: String(ticket.requesterName || 'Juan D. Cruz').slice(0, 120),
    requesterRole: String(ticket.requesterRole || 'Barangay Kagawad — DUMMY NAME').slice(0, 80),
    description: String(ticket.description || 'Fictional training request').slice(0, 1500),
    latitude: typeof ticket.latitude === 'number' ? ticket.latitude : 14.6195,
    longitude: typeof ticket.longitude === 'number' ? ticket.longitude : 120.9678,
    coordSource: String(ticket.coordSource || 'Verified Demo Pin').slice(0, 60),
    coordVerified: Boolean(ticket.coordVerified),
    priority: String(ticket.priority || 'Routine').slice(0, 30),
    ownerId: String(uid).slice(0, 128),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function syncTicketToFirestore(ticket) {
  if (!auth.currentUser) return false;
  const path = `tickets/${ticket.ticketId}`;
  try {
    const payload = sanitizeTicketForFirestore(ticket, auth.currentUser.uid);
    await setDoc(doc(db, 'tickets', ticket.ticketId), payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function logTicketHistoryToFirestore(ticketId, previousStatus, newStatus, actionTaken) {
  if (!auth.currentUser) return false;
  const path = `tickets/${ticketId}/history`;
  try {
    await addDoc(collection(db, 'tickets', ticketId, 'history'), {
      ticketId: String(ticketId).slice(0, 32),
      previousStatus: String(previousStatus || 'For Verification').slice(0, 40),
      newStatus: String(newStatus || 'Pending Evaluation').slice(0, 40),
      actionTaken: String(actionTaken || 'Updated status').slice(0, 300),
      actorUid: String(auth.currentUser.uid).slice(0, 128),
      actorName: String(auth.currentUser.displayName || auth.currentUser.email || 'Authorized User').slice(0, 120),
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserFirestoreTickets(uid, onUpdate) {
  if (!uid) return () => {};
  const q = query(collection(db, 'tickets'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    }
  );
}

// Gmail API Client Helpers
export async function listGmailDecloggingMessages(searchQuery = 'declogging OR drainage OR barangay') {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('maxResults', '6');

  const listRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.status === 401 || listRes.status === 403) {
    throw new Error('AUTH_REQUIRED');
  }
  if (!listRes.ok) {
    throw new Error(`Gmail API error: HTTP ${listRes.status}`);
  }
  const listData = await listRes.json();
  const messages = listData.messages || [];

  const detailed = [];
  for (const m of messages.slice(0, 5)) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (msgRes.ok) {
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const getHeader = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      detailed.push({
        id: msgData.id,
        snippet: msgData.snippet || '',
        subject: getHeader('Subject') || '(No Subject)',
        from: getHeader('From') || 'Unknown Sender',
        date: getHeader('Date') || '',
      });
    }
  }
  return detailed;
}

export async function createGmailDraft({ to, subject, body }) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const mimeMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(mimeMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        raw: encoded,
      },
    }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to save Gmail draft (HTTP ${res.status}): ${errText.slice(0, 120)}`);
  }
  return res.json();
}
