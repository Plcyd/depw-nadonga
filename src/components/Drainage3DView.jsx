import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Box, Eye, EyeOff, RotateCcw, Sliders, Play, Pause, Droplets, Truck, Layers
} from 'lucide-react';
import styles from '../styles/GlassSystem.module.css';

export default function Drainage3DView({ tickets = [] }) {
  const mountRef = useRef(null);
  const sceneObjectsRef = useRef({});

  const [siltLevel, setSiltLevel] = useState(65); // 0 to 90%
  const [suctionActive, setSuctionActive] = useState(true);
  const [cutawayOpen, setCutawayOpen] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('cutaway');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.ticketId || tickets[0]?.id || 'DEO-2026-001');

  const activeTicket = tickets.find((t) => (t.ticketId || t.id) === selectedTicketId) || tickets[0] || {
    ticketId: 'DEO-2026-001',
    barangay: 'Barangay 123, Zone 10',
    district: 'Tondo',
    streetAddress: 'R. Magsaysay St. near Estero de Vitas',
    requestType: 'Declogging',
    status: 'Pending Evaluation'
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 540;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Detect headless software WebGL (SwiftShader/llvmpipe) per threejs skill
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererName = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software/i.test(rendererName);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050c1a);
    scene.fog = new THREE.FogExp2(0x050c1a, 0.028);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(10.2, 6.2, 11.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, -0.8, 0);
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minDistance = 4;
    controls.maxDistance = 24;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x93c5fd, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.8);
    dirLight.position.set(10, 14, 8);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(1024, 1024);
    }
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x38bdf8, 2.2, 14);
    cyanPoint.position.set(0, -0.5, 0);
    scene.add(cyanPoint);

    // Materials
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.1 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75, metalness: 0.15 });
    const innerConcreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, metalness: 0.1 });
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.85 });
    const siltMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.92, metalness: 0.05 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82
    });
    const truckBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
    const truckTankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.75 });
    const orangeAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.4,
      roughness: 0.3
    });

    // 1. COMPOSITE GROUP: Box Culvert & Street Deck
    const culvertGroup = new THREE.Group();
    scene.add(culvertGroup);

    // Underground Box Culvert Floor
    const culvertFloor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 3.6), concreteMat);
    culvertFloor.position.set(0, -2.4, 0);
    culvertGroup.add(culvertFloor);

    // Back Wall of Culvert
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 0.35), innerConcreteMat);
    backWall.position.set(0, -1.1, -1.62);
    culvertGroup.add(backWall);

    // Front Cutaway Wall (can toggle visibility/height)
    const frontCutawayWall = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 0.35), innerConcreteMat);
    frontCutawayWall.position.set(0, -1.1, 1.62);
    frontCutawayWall.scale.y = 0.25;
    frontCutawayWall.position.y = -1.95;
    culvertGroup.add(frontCutawayWall);

    // Street Road Deck (Top Slab)
    const roadDeck = new THREE.Mesh(new THREE.BoxGeometry(12, 0.32, 5.2), asphaltMat);
    roadDeck.position.set(0, 0.15, -0.4);
    culvertGroup.add(roadDeck);

    // Road Dashed Yellow Line Markings
    for (let i = -5; i <= 5; i += 2) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.12), orangeAccentMat);
      stripe.position.set(i, 0.33, -0.4);
      culvertGroup.add(stripe);
    }

    // Manhole Shaft & Iron Cover
    const manholeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.45, 24), grateMat);
    manholeRim.position.set(0, 0.22, 0.55);
    culvertGroup.add(manholeRim);

    // Curb Inlet Grates
    for (let x = -3.5; x <= 3.5; x += 3.5) {
      const grate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.6), grateMat);
      grate.position.set(x, 0.32, 1.2);
      culvertGroup.add(grate);
    }

    // 2. SILT & DEBRIS ACCUMULATION LAYER
    const siltGroup = new THREE.Group();
    scene.add(siltGroup);

    const siltBed = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.2, 2.85), siltMat);
    siltBed.position.set(0, -1.6, 0);
    siltGroup.add(siltBed);

    // Debris mounds inside culvert
    for (let i = -3; i <= 3; i += 1.5) {
      const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), siltMat);
      mound.position.set(i, -1.0, (i % 2 === 0 ? 0.25 : -0.25));
      mound.scale.set(1.4, 0.7, 1.2);
      siltGroup.add(mound);
    }

    // 3. STORMWATER FLOW LAYER + FLOW PARTICLES
    const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(11.8, 1.4, 2.88), waterMat);
    waterMesh.position.set(0, -1.3, 0);
    scene.add(waterMesh);

    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 90;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = -1.2 + (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.11, transparent: true, opacity: 0.85 });
    const flowParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(flowParticles);

    // 4. COMPOSITE GROUP: DEPW VACUUM DECLOGGING TRUCK
    const truckGroup = new THREE.Group();
    truckGroup.position.set(-1.5, 0.32, 0.35);
    scene.add(truckGroup);

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 1.7), grateMat);
    chassis.position.set(0, 0.35, 0);
    truckGroup.add(chassis);

    // Truck Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 1.6), truckBlueMat);
    cab.position.set(-1.45, 1.1, 0);
    truckGroup.add(cab);

    // Vacuum Tank Cylinder
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 2.6, 24), truckTankMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0.6, 1.18, 0);
    truckGroup.add(tank);

    // Amber Strobe Beacon
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.22, 16), orangeAccentMat);
    beacon.position.set(-1.45, 1.82, 0);
    truckGroup.add(beacon);

    // Articulated Vacuum Suction Boom & Vertical Hose into Manhole
    const boomArm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.16), orangeAccentMat);
    boomArm.position.set(1.1, 1.95, 0.15);
    truckGroup.add(boomArm);

    const suctionHose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 3.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0ea5e9, emissiveIntensity: 0.35, roughness: 0.4 })
    );
    suctionHose.position.set(1.5, 0.4, 0.2);
    truckGroup.add(suctionHose);

    // 6 Truck Wheels
    const wheelPositions = [-1.4, 0.1, 1.3];
    wheelPositions.forEach((wx) => {
      [-0.85, 0.85].forEach((wz) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20), grateMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, 0.36, wz);
        truckGroup.add(wheel);
      });
    });

    sceneObjectsRef.current = {
      renderer,
      scene,
      camera,
      controls,
      siltGroup,
      waterMesh,
      flowParticles,
      frontCutawayWall,
      suctionHose,
      beacon,
      isSoftwareGl
    };

    let disposed = false;
    let rafId = 0;

    const updateSceneProps = () => {
      const sRatio = Math.max(0.05, siltLevel / 100);
      siltGroup.scale.y = sRatio;
      siltGroup.position.y = -2.2 + sRatio * 0.65;

      // Higher silt causes higher water backing up
      const waterScaleY = 0.35 + sRatio * 0.65;
      waterMesh.scale.y = waterScaleY;
      waterMesh.position.y = -2.1 + waterScaleY * 0.65;

      frontCutawayWall.scale.y = cutawayOpen ? 0.22 : 1.0;
      frontCutawayWall.position.y = cutawayOpen ? -1.95 : -1.1;

      suctionHose.visible = suctionActive;
    };

    updateSceneProps();

    const afterDraw = isSoftwareGl
      ? () => { rafId = setTimeout(animate, 16); }
      : () => { rafId = requestAnimationFrame(animate); };

    function animate() {
      if (disposed) return;
      const elapsed = performance.now() * 0.001;

      // Animate stormwater particles flowing left-to-right
      const posAttr = flowParticles.geometry.attributes.position;
      const flowSpeed = Math.max(0.015, 0.08 * (1 - siltLevel / 110));
      for (let i = 0; i < particleCount; i++) {
        let px = posAttr.getX(i) + flowSpeed;
        if (px > 5.5) px = -5.5;
        posAttr.setX(i, px);
      }
      posAttr.needsUpdate = true;

      // Pulse beacon & suction hose when active
      beacon.material.emissiveIntensity = suctionActive ? 0.5 + Math.sin(elapsed * 8) * 0.4 : 0.1;

      controls.update();
      renderer.render(scene, camera);
      afterDraw();
    }

    animate();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      clearTimeout(rafId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  // Synchronize React state changes into the Three.js scene
  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.siltGroup) return;

    const sRatio = Math.max(0.05, siltLevel / 100);
    objs.siltGroup.scale.y = sRatio;
    objs.siltGroup.position.y = -2.2 + sRatio * 0.65;

    const waterScaleY = 0.35 + sRatio * 0.65;
    objs.waterMesh.scale.y = waterScaleY;
    objs.waterMesh.position.y = -2.1 + waterScaleY * 0.65;

    objs.frontCutawayWall.scale.y = cutawayOpen ? 0.22 : 1.0;
    objs.frontCutawayWall.position.y = cutawayOpen ? -1.95 : -1.1;

    if (objs.suctionHose) {
      objs.suctionHose.visible = suctionActive;
    }
  }, [siltLevel, cutawayOpen, suctionActive]);

  const applyCameraPreset = (preset) => {
    setCameraPreset(preset);
    const { camera, controls } = sceneObjectsRef.current;
    if (!camera || !controls) return;

    if (preset === 'cutaway') {
      camera.position.set(8.5, 5.2, 9.5);
      controls.target.set(0, -0.3, 0);
    } else if (preset === 'culvert') {
      camera.position.set(0, -0.6, 5.8);
      controls.target.set(0, -1.2, 0);
    } else if (preset === 'truck') {
      camera.position.set(-5.8, 3.2, 5.5);
      controls.target.set(-0.5, 0.8, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 12.5, 2.5);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  const simulateDecloggingCycle = () => {
    setSuctionActive(true);
    setCutawayOpen(true);
    let current = siltLevel;
    const interval = setInterval(() => {
      current = Math.max(8, current - 9);
      setSiltLevel(current);
      if (current <= 8) {
        clearInterval(interval);
      }
    }, 180);
  };

  const flowEfficiency = Math.max(10, 100 - siltLevel);

  return (
    <div style={{ position: 'relative', width: '100%', height: '620px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
      {/* Full-Viewport 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Top-Left Floating Context Pill */}
      <div
        className={styles.glassPanel}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '12px 16px',
          maxWidth: '380px',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Box size={15} color="#38bdf8" />
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
            3D DRAINAGE & VACUUM DECLOGGING DIGITAL TWIN
          </span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
          {activeTicket.streetAddress || activeTicket.street} ({activeTicket.district})
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
          <span>
            Silt Obstruction: <strong style={{ color: siltLevel > 50 ? '#fbbf24' : '#34d399' }}>{siltLevel}%</strong>
          </span>
          <span>
            Hydraulic Flow: <strong style={{ color: '#38bdf8' }}>{flowEfficiency}%</strong>
          </span>
        </div>
      </div>

      {/* Top-Right UI Toggle & Camera Presets */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          pointerEvents: 'auto'
        }}
      >
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => applyCameraPreset('cutaway')}
          style={{ padding: '7px 12px', fontSize: '12px' }}
        >
          <RotateCcw size={13} /> Reset View
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => setDockCollapsed(!dockCollapsed)}
          style={{ padding: '7px 12px', fontSize: '12px' }}
        >
          {dockCollapsed ? <Eye size={14} /> : <EyeOff size={14} />}
          {dockCollapsed ? 'Show Controls' : 'Hide UI'}
        </button>
      </div>

      {/* Collapsible Bottom Control Dock */}
      {!dockCollapsed && (
        <div
          className={styles.glassPanel}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            padding: '14px 18px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            pointerEvents: 'auto'
          }}
        >
          {/* Ticket Site Selector */}
          <div style={{ minWidth: '210px' }}>
            <label className={styles.fieldLabel}>Inspect Active Ticket Site</label>
            <select
              className={styles.glassSelect}
              value={selectedTicketId}
              onChange={(e) => {
                setSelectedTicketId(e.target.value);
                const t = tickets.find((item) => (item.ticketId || item.id) === e.target.value);
                if (t) {
                  setSiltLevel(t.status === 'Completed' || t.status === 'Closed' ? 12 : t.priority === 'High Priority' ? 82 : 60);
                }
              }}
            >
              {tickets.map((t) => {
                const tid = t.ticketId || t.id;
                return (
                  <option key={tid} value={tid}>
                    {tid} — {t.district} ({t.requestType || t.drainage_type})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Silt Level Slider */}
          <div style={{ flex: '1 1 200px', maxWidth: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className={styles.fieldLabel} style={{ margin: 0 }}>Silt & Debris Level</span>
              <span className={styles.monoText} style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>{siltLevel}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="90"
              value={siltLevel}
              onChange={(e) => setSiltLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {/* Camera Angle Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'cutaway', label: 'Cutaway 3D' },
              { id: 'culvert', label: 'Inside Culvert' },
              { id: 'truck', label: 'Vacuum Truck' },
              { id: 'top', label: 'Street Plan' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={cameraPreset === p.id ? styles.primaryBtn : styles.secondaryBtn}
                style={{ padding: '7px 11px', fontSize: '12px' }}
                onClick={() => applyCameraPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Interactive Declogging Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={cutawayOpen ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '7px 12px', fontSize: '12px' }}
              onClick={() => setCutawayOpen(!cutawayOpen)}
            >
              <Layers size={14} /> {cutawayOpen ? 'Cutaway: Open' : 'Cutaway: Closed'}
            </button>

            <button
              type="button"
              className={styles.orangeBtn}
              style={{ padding: '7px 14px', fontSize: '12px' }}
              onClick={simulateDecloggingCycle}
            >
              <Truck size={14} /> Run Vacuum Declogging
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
