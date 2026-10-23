import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Search, AlertTriangle, ShieldCheck, BookOpen, ExternalLink, RefreshCw, Activity
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';

const PRESET_COMPOUNDS = [
  {
    name: 'Hydrogen Sulfide',
    role: 'Confined-Space Sewer Gas Hazard',
    fieldNote: 'Produced by anaerobic bacterial breakdown of organic silt inside closed box culverts. Requires gas venting before manhole entry.'
  },
  {
    name: 'Calcium Hypochlorite',
    role: 'Floodwater & Culvert Disinfectant',
    fieldNote: 'Used for post-declogging sanitation of stagnant drainage pools and equipment decontamination.'
  },
  {
    name: 'Ammonia',
    role: 'Wastewater & Organic Silt Indicator',
    fieldNote: 'Elevated concentrations indicate domestic sewage cross-connection or decaying organic sediment.'
  },
  {
    name: 'Sodium Hypochlorite',
    role: 'Field Tool & PPE Sanitizer',
    fieldNote: 'Standard chlorine solution for disinfecting suction hoses, boots, and street spillover areas.'
  },
  {
    name: 'Methane',
    role: 'Anaerobic Culvert Pocket Gas',
    fieldNote: 'Flammable gas formed in deep, unvented estero sediment beds; monitored prior to mechanical desilting.'
  }
];

export default function BioscienceLabView({ showToast }) {
  const [selectedCompound, setSelectedCompound] = useState(PRESET_COMPOUNDS[0]);
  const [customQuery, setCustomQuery] = useState('');
  const [compoundData, setCompoundData] = useState(null);
  const [loadingCompound, setLoadingCompound] = useState(false);

  const [litQuery, setLitQuery] = useState('Leptospira urban drainage flooding sanitation');
  const [articles, setArticles] = useState([]);
  const [loadingLit, setLoadingLit] = useState(false);

  const fetchPubChemCompound = async (compoundName) => {
    setLoadingCompound(true);
    try {
      const encoded = encodeURIComponent(compoundName.trim());
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,ConnectivitySMILES,XLogP,TPSA/JSON`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`PubChem returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const props = data?.PropertyTable?.Properties?.[0];
      if (props) {
        setCompoundData({
          cid: props.CID,
          name: compoundName,
          formula: props.MolecularFormula || 'N/A',
          weight: props.MolecularWeight || 'N/A',
          iupac: props.IUPACName || compoundName,
          smiles: props.CanonicalSMILES || props.ConnectivitySMILES || props.MolecularFormula || 'S',
          xlogp: props.XLogP ?? 'Hydrophilic / Inorganic',
          tpsa: props.TPSA ?? 0,
          imageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${props.CID}/PNG?record_type=2d&image_size=300x300`
        });
      }
    } catch (err) {
      if (showToast) showToast(`PubChem lookup notice: ${err.message}`, 'error');
    } finally {
      setLoadingCompound(false);
    }
  };

  const fetchEuropePmcLiterature = async (queryText) => {
    setLoadingLit(true);
    try {
      const encoded = encodeURIComponent(queryText.trim());
      const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encoded}&format=json&pageSize=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Europe PMC returned HTTP ${res.status}`);
      const data = await res.json();
      setArticles(data?.resultList?.result || []);
    } catch (err) {
      if (showToast) showToast(`Europe PMC lookup error: ${err.message}`, 'error');
    } finally {
      setLoadingLit(false);
    }
  };

  useEffect(() => {
    fetchPubChemCompound(PRESET_COMPOUNDS[0].name);
    fetchEuropePmcLiterature(litQuery);
  }, []);

  const handleSelectPreset = (preset) => {
    setSelectedCompound(preset);
    fetchPubChemCompound(preset.name);
  };

  const handleCustomCompoundSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    const customPreset = {
      name: customQuery.trim(),
      role: 'Custom Environmental / Water Quality Compound',
      fieldNote: 'Queried live from NCBI PubChem PUG REST API for environmental drainage assessment.'
    };
    setSelectedCompound(customPreset);
    fetchPubChemCompound(customPreset.name);
  };

  const handleLiteratureSearch = (e) => {
    e.preventDefault();
    if (!litQuery.trim()) return;
    fetchEuropePmcLiterature(litQuery);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Banner */}
      <div className={styles.glassPanel} style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FlaskConical size={16} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
                ENVIRONMENTAL WATER QUALITY & OCCUPATIONAL BIOSCIENCE LAB
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Drainage Gas Safety, Disinfection Chemistry & Leptospirosis Evidence
            </h2>
          </div>

          <form onSubmit={handleCustomCompoundSubmit} style={{ display: 'flex', gap: '8px', minWidth: '300px' }}>
            <input
              type="text"
              className={styles.glassInput}
              placeholder="Search PubChem compound (e.g. Hydrogen Peroxide)..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
            />
            <button type="submit" className={styles.primaryBtn} disabled={loadingCompound}>
              <Search size={14} /> Query PubChem
            </button>
          </form>
        </div>

        {/* Preset Compound Selector Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {PRESET_COMPOUNDS.map((item) => {
            const active = selectedCompound.name === item.name;
            return (
              <button
                key={item.name}
                type="button"
                className={active ? styles.primaryBtn : styles.secondaryBtn}
                onClick={() => handleSelectPreset(item)}
              >
                {item.name}
                <span style={{ opacity: 0.75, fontSize: '11px' }}>({item.role.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid: Left = PubChem Molecular Inspector, Right = Europe PMC Biomedical Evidence */}
      <div className={styles.splitGrid}>
        {/* Left: Live PubChem Compound Inspector */}
        <div className={styles.glassPanel} style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                LIVE NCBI PUBCHEM PUG REST RECORD
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0 0' }}>
                {selectedCompound.name}
              </h3>
            </div>
            {compoundData?.cid && (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compoundData.cid}`}
                target="_blank"
                rel="noreferrer"
                className={styles.secondaryBtn}
                style={{ textDecoration: 'none', fontSize: '12px', padding: '6px 12px' }}
              >
                CID {compoundData.cid} <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className={styles.glassCard} style={{ padding: '14px', marginBottom: '16px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
              {selectedCompound.role}
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.55 }}>
              {selectedCompound.fieldNote}
            </div>
          </div>

          {loadingCompound ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Fetching live molecular properties from NCBI PubChem...
            </div>
          ) : compoundData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '18px', alignItems: 'center' }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                <img
                  src={compoundData.imageUrl}
                  alt={compoundData.name}
                  style={{ width: '140px', height: '140px', objectFit: 'contain' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className={styles.glassCard} style={{ padding: '10px 12px' }}>
                  <div className={styles.fieldLabel}>Molecular Formula</div>
                  <div className={styles.monoText} style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                    {compoundData.formula}
                  </div>
                </div>
                <div className={styles.glassCard} style={{ padding: '10px 12px' }}>
                  <div className={styles.fieldLabel}>Molecular Weight</div>
                  <div className={styles.monoText} style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                    {compoundData.weight} g/mol
                  </div>
                </div>
                <div className={styles.glassCard} style={{ padding: '10px 12px' }}>
                  <div className={styles.fieldLabel}>Topological Polar Surface (TPSA)</div>
                  <div className={styles.monoText} style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                    {compoundData.tpsa} Å²
                  </div>
                </div>
                <div className={styles.glassCard} style={{ padding: '10px 12px' }}>
                  <div className={styles.fieldLabel}>XLogP3 Partition</div>
                  <div className={styles.monoText} style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                    {String(compoundData.xlogp)}
                  </div>
                </div>
                <div className={styles.glassCard} style={{ padding: '10px 12px', gridColumn: 'span 2' }}>
                  <div className={styles.fieldLabel}>IUPAC Systematic Name & Canonical SMILES</div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>
                    {compoundData.iupac}
                  </div>
                  <div className={styles.monoText} style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    SMILES: {compoundData.smiles}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Field Crew Safety Checklist */}
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(148,163,184,0.14)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
              <ShieldCheck size={15} /> DEPW Field Operations Safety Protocol (Advisory Reference)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
              <div>• Ventilate closed box culverts 15 mins prior to entry</div>
              <div>• Heavy-duty nitrile gloves & high-cut waterproof boots</div>
              <div>• Multi-gas detector check for H₂S & CH₄ pockets</div>
              <div>• Post-operation hypochlorite washdown of suction hoses</div>
            </div>
          </div>
        </div>

        {/* Right: Live Europe PMC Biomedical & Floodwater Sanitation Literature */}
        <div className={styles.glassPanel} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <BookOpen size={14} /> EUROPE PMC PEER-REVIEWED EVIDENCE STREAM
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '4px 0 8px 0' }}>
              Urban Drainage, Floodwater Pathogens & Public Health Literature
            </h3>
          </div>

          <form onSubmit={handleLiteratureSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className={styles.glassInput}
              value={litQuery}
              onChange={(e) => setLitQuery(e.target.value)}
              placeholder="Search Europe PMC (e.g. Leptospira urban drainage floodwater)..."
            />
            <button type="submit" className={styles.primaryBtn} disabled={loadingLit}>
              {loadingLit ? 'Searching...' : 'Search Literature'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
            {articles.map((art, idx) => (
              <div key={art.id || idx} className={styles.glassCard} style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.4, marginBottom: '4px' }}>
                  {art.title}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                  {art.authorString || 'Research Consortium'} • <strong>{art.journalTitle || art.source}</strong> ({art.pubYear})
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={styles.monoText} style={{ fontSize: '11px', color: '#38bdf8' }}>
                    {art.pmid ? `PMID: ${art.pmid}` : `ID: ${art.id}`}
                  </span>
                  {art.pmid && (
                    <a
                      href={`https://europepmc.org/article/MED/${art.pmid}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: '#7dd3fc', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      View Paper <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
