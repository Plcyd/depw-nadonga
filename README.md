# DEPW Assist — Handling of Barangay Declogging Requests (City of Manila)

**Department of Engineering Office (DEPW) — AI-Assisted Workflow, Smart Tracker, Street Map GIS & 3D Digital Twin**

> **TRAINING DEMONSTRATION & SAMPLE DATA DISCLAIMER:**
> All records, Barangay names (e.g., *Brgy 123 SAMPLE*), coordinates, and request letters in this application are fictional training examples. This application is for educational and process-improvement demonstration purposes only.

---

## Core Modules

1. **01–08 Interactive Glossy Glassmorphism Presentation Deck (`src/components/PresentationDeck.jsx`)**
   - Full 8-slide interactive deck with keyboard navigation (`←` / `→`), slide overview grid, fullscreen mode, and bilingual Filipino-English speaker notes.
   - Covers Title & Vision, Understanding Declogging Requests, Interactive Sample Request Letter (with Copy & Gemini TTS readout), 8-Stage Liaison Workflow, Before/After Triple-A Framework, Live Smart Tracker Preview, Data Privacy & Philippine Transparency Seal Symbolism, and Closing Q&A.
2. **Full-Stack Smart Tracker & Operations Workspace (`src/components/SmartTrackerView.jsx`)**
   - Persistent SQLite database (`node:sqlite` in `src/db/database.js`) + Express REST API (`server.js`) + Firebase Firestore real-time synchronization (`src/services/firebaseClient.js`).
   - Full CRUD operations, controlled status transition engine (`workflowRules.js`), audit trail history, Kanban board, inspection checklist, operations schedule calendar,completeness assistant, duplicate detector, and CSV export.
3. **Interactive Manila OpenStreetMap GIS (`src/components/StreetMapView.jsx`)**
   - Real OpenStreetMap tiles via Leaflet, Nominatim street/landmark geocoding proxy (`/api/geocode`), Manila's 6 Legislative Districts & 16 Recognized Districts selector, status/type marker filters, hotspot aura overlay, coordinate pinning, and Google Maps Grounding (`gemini-3.8-flash` + `googleMaps`).
4. **Three.js 3D Culvert & Vacuum Declogging Digital Twin (`src/components/Drainage3DView.jsx`)**
   - Procedural composite `THREE.Group` models of a Manila street deck, curb inlets, underground reinforced concrete box culvert, adjustable silt & debris obstruction layer, stormwater flow particles, and an articulated DEPW Vacuum Declogging Truck.
5. **AI & Google Workspace Gmail Liaison Hub (`src/components/AiLiaisonHubView.jsx`)**
   - Bilingual letter drafting, completeness review, and status memo generation (`gemini-3.8-flash`, `gemini-4-argon`, `gemini-3.1-flash-lite`, plus deterministic offline fallback).
   - Google Workspace Gmail OAuth (`gmail.readonly`, `gmail.compose`) with an explicit User Confirmation Modal before creating drafts.
   - Multimodal Field Studio (`gemini-3-pro-image` with 1K/2K/4K resolution, `gemini-omni-1.1-flash` video generation via Interactions API, `gemini-3.8-flash-tts` audio readout, and `gemini-3.8-live` WebSocket liaison coach).
6. **Environmental Water Quality & Bioscience Lab (`src/components/BioscienceLabView.jsx`)**
   - Live queries to NCBI PubChem PUG REST (molecular properties & 2D structures for sewer gases and sanitation agents) and Europe PMC (peer-reviewed literature on *Leptospira* and urban drainage sanitation).

## Commands

- **Start Full-Stack Dev Server (Port 3000):** `npm run dev`
- **Run Pure Business Logic Unit Tests:** `node --test src/utils/workflowRules.test.js`
- **Build Production Bundle:** `npm run build`
