import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin, Search, Layers, Compass, Sparkles, ExternalLink, Crosshair, Building2
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';
import {
  MANILA_16_DISTRICTS,
  LEGISLATIVE_DISTRICTS,
  TICKET_STATUSES,
  REQUEST_TYPES,
  getManilaSpatialDrainageContext,
} from '../utils/workflowRules.js';
import { api } from '../services/api.js';

const STATUS_PIN_COLORS = {
  'For Verification': '#38bdf8',
  'Returned for Clarification': '#f43f5e',
  'Pending Evaluation': '#fbbf24',
  'Inspection Scheduled': '#818cf8',
  'Scheduled for Implementation': '#c084fc',
  'In Progress': '#f97316',
  'Completed': '#10b981',
  'Closed': '#64748b'
};

export default function StreetMapView({
  tickets = [],
  assets = [],
  selectedMapTicket,
  onSelectTicketOnTracker,
  onUseCoordinatesForNewTicket,
  showToast
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const pinMarkerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRequestType, setSelectedRequestType] = useState('ALL');
  const [showAssets, setShowAssets] = useState(true);
  const [showHeatOverlay, setShowHeatOverlay] = useState(true);
  const [pinMode, setPinMode] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState(null);
  const [activeTicket, setActiveTicket] = useState(selectedMapTicket || tickets[0] || null);

  // Maps Grounding AI state
  const [groundingQuery, setGroundingQuery] = useState('Drainage pumping stations, esteros, and flood-prone streets near España Boulevard, Sampaloc, Manila');
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingResult, setGroundingResult] = useState(null);

  useEffect(() => {
    if (selectedMapTicket) {
      setActiveTicket(selectedMapTicket);
      const lat = Number(selectedMapTicket.latitude ?? selectedMapTicket.lat);
      const lng = Number(selectedMapTicket.longitude ?? selectedMapTicket.lng);
      if (mapInstanceRef.current && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1 });
      }
    } else if (!activeTicket && tickets.length > 0) {
      setActiveTicket(tickets[0]);
    }
  }, [selectedMapTicket, tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchDistrict = selectedDistrict === 'ALL' || t.district === selectedDistrict;
      const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
      const rType = t.requestType || t.drainage_type;
      const matchType = selectedRequestType === 'ALL' || rType === selectedRequestType;
      return matchDistrict && matchStatus && matchType;
    });
  }, [tickets, selectedDistrict, selectedStatus, selectedRequestType]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [14.5995, 120.9842],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors • City of Manila DEPW GIS',
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const heatLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
    heatLayerRef.current = heatLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle click-to-pin mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      if (!pinMode) return;
      const { lat, lng } = e.latlng;
      const rounded = {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5))
      };
      setPinnedCoords(rounded);

      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([rounded.lat, rounded.lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-pin-icon',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#f97316;border:3px solid #fff;box-shadow:0 0 16px rgba(249,115,22,0.9);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        pinMarkerRef.current = L.marker([rounded.lat, rounded.lng], { icon }).addTo(map);
      }
      if (showToast) {
        showToast(`Pinned Manila coordinates: ${rounded.lat}, ${rounded.lng}`, 'info');
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [pinMode, showToast]);

  // Render Ticket & Asset Markers + Heat Intensity Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatLayer = heatLayerRef.current;
    if (!map || !markersLayer || !heatLayer) return;

    markersLayer.clearLayers();
    heatLayer.clearLayers();

    filteredTickets.forEach((ticket) => {
      const tId = ticket.ticketId || ticket.id || 'DEO';
      const lat = Number(ticket.latitude ?? ticket.lat) || 14.5995;
      const lng = Number(ticket.longitude ?? ticket.lng) || 120.9842;
      const street = ticket.streetAddress || ticket.street || '';
      const rType = ticket.requestType || ticket.drainage_type || 'Declogging';
      const prio = ticket.priority || ticket.urgency || 'Routine';
      const color = STATUS_PIN_COLORS[ticket.status] || '#38bdf8';

      if (showHeatOverlay && ticket.status !== 'Completed' && ticket.status !== 'Closed') {
        const radius = prio === 'High Priority' ? 420 : prio === 'Elevated' ? 300 : 200;
        const heatColor = prio === 'High Priority' ? '#f43f5e' : prio === 'Elevated' ? '#f97316' : '#38bdf8';
        L.circle([lat, lng], {
          radius,
          color: heatColor,
          weight: 1,
          fillColor: heatColor,
          fillOpacity: 0.18
        }).addTo(heatLayer);
      }

      const markerIcon = L.divIcon({
        className: 'depw-ticket-marker',
        html: `
          <div style="
            display:flex;align-items:center;justify-content:center;
            width:28px;height:28px;border-radius:50%;
            background:${color};border:2.5px solid #040914;
            box-shadow:0 4px 12px rgba(0,0,0,0.6), 0 0 10px ${color};
            color:#040914;font-weight:800;font-size:10px;font-family:monospace;
          ">
            ${tId.slice(-2)}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:210px;color:#0f172a;">
          <div style="font-size:10px;font-weight:800;color:#0284c7;letter-spacing:0.06em;">${tId} • DEPW GIS</div>
          <div style="font-size:13px;font-weight:700;margin:3px 0;">${ticket.barangay} (${ticket.district})</div>
          <div style="font-size:12px;color:#334155;">${street}</div>
          <div style="font-size:11px;margin-top:4px;color:#475569;"><strong>Type:</strong> ${rType}</div>
          <div style="font-size:11px;color:#475569;"><strong>Status:</strong> ${ticket.status} (${prio})</div>
        </div>
      `);

      marker.on('click', () => {
        setActiveTicket(ticket);
      });

      marker.addTo(markersLayer);
    });

    if (showAssets) {
      assets.forEach((asset) => {
        const aId = asset.assetId || asset.id || 'AST';
        const lat = Number(asset.latitude ?? asset.lat) || 14.5995;
        const lng = Number(asset.longitude ?? asset.lng) || 120.9842;
        const aType = asset.assetType || asset.asset_type || 'Culvert';
        const cond = asset.conditionStatus || asset.condition || 'Operational';
        const assetIcon = L.divIcon({
          className: 'depw-asset-marker',
          html: `
            <div style="
              width:20px;height:20px;border-radius:5px;
              background:#0f172a;border:1.5px solid #22d3ee;
              display:flex;align-items:center;justify-content:center;
              color:#22d3ee;font-size:9px;font-weight:800;
            ">
              A
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([lat, lng], { icon: assetIcon })
          .bindPopup(`
            <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:190px;color:#0f172a;">
              <div style="font-size:10px;font-weight:800;color:#0891b2;">DRAINAGE ASSET • ${aId}</div>
              <div style="font-size:13px;font-weight:700;margin:2px 0;">${asset.name}</div>
              <div style="font-size:11px;color:#334155;">${aType} • ${asset.dimensions}</div>
              <div style="font-size:11px;color:#475569;margin-top:3px;">Condition: <strong>${cond}</strong></div>
            </div>
          `)
          .addTo(markersLayer);
      });
    }
  }, [filteredTickets, assets, showAssets, showHeatOverlay]);

  const handleGeocodeSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await api.geocodeStreet(searchQuery);
      const list = Array.isArray(data) ? data : data.results || [];
      setSearchResults(list);
      if (list.length > 0) {
        const first = list[0];
        const lat = parseFloat(first.lat ?? first.latitude);
        const lon = parseFloat(first.lon ?? first.longitude);
        if (mapInstanceRef.current && !Number.isNaN(lat) && !Number.isNaN(lon)) {
          mapInstanceRef.current.flyTo([lat, lon], 16, { duration: 1.1 });
        }
      } else if (showToast) {
        showToast('No OpenStreetMap matches found in Manila for that query.', 'info');
      }
    } catch (err) {
      if (showToast) showToast(`Geocoding error: ${err.message}`, 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleDistrictJump = (districtName) => {
    setSelectedDistrict(districtName);
    if (districtName === 'ALL') {
      mapInstanceRef.current?.flyTo([14.5995, 120.9842], 13, { duration: 1 });
      return;
    }
    const found = MANILA_16_DISTRICTS.find((d) => d.name === districtName);
    if (found && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([found.lat, found.lng], 15, { duration: 1 });
    }
  };

  const handleRunMapsGrounding = async () => {
    if (!groundingQuery.trim()) return;
    setGroundingLoading(true);
    try {
      const res = await api.runMapsGrounding(groundingQuery);
      setGroundingResult(res);
      if (res.isOfflineKnowledge && res.quotaFallbackNotice && showToast) {
        showToast('Active: City of Manila DEPW Geographic Intelligence (Offline Reconnaissance)', 'info');
      }
    } catch (err) {
      // Local client fallback if server endpoint or network encounters issue
      const fallback = getManilaSpatialDrainageContext(groundingQuery);
      setGroundingResult({
        modelUsed: 'DEPW Manila Estero & Drainage GIS (Offline Mode)',
        text: fallback.summary,
        isOfflineKnowledge: true,
        places: fallback.places,
      });
      if (showToast) {
        showToast('Displaying DEPW Manila offline geographic intelligence.', 'info');
      }
    } finally {
      setGroundingLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Controls Bar */}
      <div className={styles.glassPanel} style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Compass size={16} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
                MANILA OPENSTREETMAP GIS • 6 LEGISLATIVE & 16 RECOGNIZED DISTRICTS
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Interactive Street Map & Drainage Hotspots
            </h2>
          </div>

          {/* Nominatim Search Form */}
          <form onSubmit={handleGeocodeSearch} style={{ display: 'flex', gap: '8px', flex: '1 1 320px', maxWidth: '480px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                className={styles.glassInput}
                style={{ paddingLeft: '34px' }}
                placeholder="Search Manila street, barangay, or landmark (e.g. España Blvd)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.primaryBtn} disabled={searching}>
              {searching ? 'Locating...' : 'Search Street'}
            </button>
          </form>
        </div>

        {/* Search Results Dropdown Strip */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>OSM Matches:</span>
            {searchResults.map((place, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.secondaryBtn}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => {
                  const lat = parseFloat(place.lat ?? place.latitude);
                  const lon = parseFloat(place.lon ?? place.longitude);
                  mapInstanceRef.current?.flyTo([lat, lon], 17, { duration: 1 });
                }}
              >
                <MapPin size={12} color="#38bdf8" />
                {(place.displayName || place.display_name || 'Manila Street').split(',').slice(0, 2).join(', ')}
              </button>
            ))}
            <button
              type="button"
              className={styles.secondaryBtn}
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setSearchResults([])}
            >
              Clear
            </button>
          </div>
        )}

        {/* Filter & Layer Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(148,163,184,0.14)', alignItems: 'center' }}>
          <select
            className={styles.glassSelect}
            style={{ width: 'auto', minWidth: '180px' }}
            value={selectedDistrict}
            onChange={(e) => handleDistrictJump(e.target.value)}
          >
            <option value="ALL">All 16 Manila Districts</option>
            {MANILA_16_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.legislativeDistrict})
              </option>
            ))}
          </select>

          <select
            className={styles.glassSelect}
            style={{ width: 'auto', minWidth: '165px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Workflow Statuses</option>
            {TICKET_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            className={styles.glassSelect}
            style={{ width: 'auto', minWidth: '165px' }}
            value={selectedRequestType}
            onChange={(e) => setSelectedRequestType(e.target.value)}
          >
            <option value="ALL">All Request Types</option>
            {REQUEST_TYPES.map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>

          <button
            type="button"
            className={showHeatOverlay ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setShowHeatOverlay(!showHeatOverlay)}
          >
            <Layers size={14} /> {showHeatOverlay ? 'Hotspot Aura: ON' : 'Hotspot Aura: OFF'}
          </button>

          <button
            type="button"
            className={showAssets ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setShowAssets(!showAssets)}
          >
            <Building2 size={14} /> {showAssets ? 'Drainage Assets: ON' : 'Drainage Assets: OFF'}
          </button>

          <button
            type="button"
            className={pinMode ? styles.orangeBtn : styles.secondaryBtn}
            onClick={() => setPinMode(!pinMode)}
          >
            <Crosshair size={14} /> {pinMode ? 'Click Map to Pin Location' : 'Pin New Request Coords'}
          </button>
        </div>
      </div>

      {/* Main Map + Side Inspector Grid */}
      <div className={styles.splitGrid}>
        {/* Left: Interactive Leaflet Map */}
        <div className={styles.glassPanel} style={{ padding: '12px', position: 'relative', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '500px',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          />

          {/* Pinned Coordinates Action Bar */}
          {pinnedCoords && (
            <div style={{
              marginTop: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(249, 115, 22, 0.14)',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '12px', color: '#fed7aa' }}>
                <strong>Pinned Street Coordinates:</strong>{' '}
                <span className={styles.monoText}>{pinnedCoords.lat}, {pinnedCoords.lng}</span>
              </div>
              {onUseCoordinatesForNewTicket && (
                <button
                  type="button"
                  className={styles.orangeBtn}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => onUseCoordinatesForNewTicket(pinnedCoords)}
                >
                  Create Declogging Ticket at Pin
                </button>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', padding: '4px 8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>STATUS PINS:</span>
            {Object.entries(STATUS_PIN_COLORS).map(([status, color]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#cbd5e1' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                {status}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Ticket Details + Google Maps Grounding Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected Ticket Card */}
          <div className={styles.glassPanel} style={{ padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', marginBottom: '8px' }}>
              SELECTED MAP REQUEST • DEPW GIS
            </div>
            {activeTicket ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={styles.monoText} style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                    {activeTicket.ticketId || activeTicket.id}
                  </span>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#7dd3fc'
                  }}>
                    {activeTicket.status}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                  {activeTicket.barangay} — {activeTicket.district} ({activeTicket.legislativeDistrict || 'Manila'})
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                  {activeTicket.streetAddress || activeTicket.street}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.5 }}>
                  {activeTicket.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(148,163,184,0.14)', paddingTop: '10px' }}>
                  <span className={styles.monoText} style={{ fontSize: '11px', color: '#64748b' }}>
                    GPS: {activeTicket.latitude ?? activeTicket.lat}, {activeTicket.longitude ?? activeTicket.lng}
                  </span>
                  {onSelectTicketOnTracker && (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => onSelectTicketOnTracker(activeTicket)}
                    >
                      Open in Smart Tracker
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                Click any marker on the Manila map to inspect its drainage details.
              </div>
            )}
          </div>

          {/* Manila 6 Legislative Districts Reference Card */}
          <div className={styles.glassPanel} style={{ padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', marginBottom: '8px' }}>
              MANILA 6 LEGISLATIVE DISTRICTS QUICK JUMP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {LEGISLATIVE_DISTRICTS.map((ld) => (
                <div
                  key={ld.id}
                  className={styles.glassCard}
                  style={{ padding: '8px 10px', cursor: 'pointer' }}
                  onClick={() => handleDistrictJump(ld.districts[0])}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{ld.name || ld.label || ld.id}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ld.districts.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini Maps Grounding Panel */}
          <div className={styles.glassPanel} style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={15} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8' }}>
                GEMINI MAPS GROUNDING (gemini-3.8-flash + googleMaps)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>
              Query real-world spatial context, nearby waterways, and landmarks in Manila to assist engineering field reconnaissance.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className={styles.glassInput}
                value={groundingQuery}
                onChange={(e) => setGroundingQuery(e.target.value)}
                placeholder="Ask about streets, esteros, or landmarks near current map center..."
              />
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleRunMapsGrounding}
                disabled={groundingLoading}
              >
                {groundingLoading ? 'Querying...' : 'Ground'}
              </button>
            </div>

            {groundingResult && (
              <div className={styles.glassCard} style={{ padding: '14px', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: groundingResult.isOfflineKnowledge ? 'rgba(245, 158, 11, 0.18)' : 'rgba(56, 189, 248, 0.15)',
                      color: groundingResult.isOfflineKnowledge ? '#fcd34d' : '#38bdf8',
                      border: `1px solid ${groundingResult.isOfflineKnowledge ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`,
                    }}
                  >
                    {groundingResult.modelUsed || 'Geographic Reconnaissance'}
                  </span>
                  {groundingResult.isOfflineKnowledge && (
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      City of Manila DEPW Geographic Knowledge Base
                    </span>
                  )}
                </div>

                {groundingResult.quotaFallbackNotice && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#fef08a',
                      background: 'rgba(234, 179, 8, 0.12)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      marginBottom: '8px',
                    }}
                  >
                    ℹ️ {groundingResult.quotaFallbackNotice}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                  {groundingResult.text || groundingResult.answer}
                </div>
                {groundingResult.places && groundingResult.places.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                      MANILA DRAINAGE BASIN & WATERWAY LANDMARKS:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {groundingResult.places.map((p, idx) => (
                        <a
                          key={idx}
                          href={p.uri}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: '#7dd3fc',
                            background: 'rgba(56, 189, 248, 0.12)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textDecoration: 'none'
                          }}
                        >
                          {p.title} <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
