import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const PARTS = [
  {
    id: "system",
    label: "Whole System",
    short: "Tidal-powered cleaner",
    detail:
      "Osmolemon floats at the surface and uses wave motion to keep water moving through a removable debris basket.",
    stat: "No external power",
  },
  {
    id: "basket",
    label: "Collection Basket",
    short: "Surface debris capture",
    detail:
      "A lifted stainless basket catches floating debris and microplastics before they sink below the collection zone.",
    stat: "Lift-out service",
  },
  {
    id: "pump",
    label: "Tidal Pump",
    short: "Motion-driven flow",
    detail:
      "The vertical bobbing of the buoy body drives internal pumping so water keeps circulating with natural tides.",
    stat: "Wave assisted",
  },
  {
    id: "body",
    label: "Buoyant Body",
    short: "Stable lemon hull",
    detail:
      "The rounded floating hull keeps the system upright, visible, and stable in changing coastal conditions.",
    stat: "Marine grade",
  },
  {
    id: "inlet",
    label: "Clean Water Inlet",
    short: "Guided intake",
    detail:
      "Surface water enters through the inlet, carrying suspended litter and microplastics toward the basket.",
    stat: "Surface skim",
  },
  {
    id: "outlet",
    label: "Filtered Outlet",
    short: "Return flow",
    detail:
      "Filtered water is returned below the surface after debris is captured, reducing visible pollution.",
    stat: "Below-surface return",
  },
];

const STEPS = [
  ["01", "Tide rises", "Wave lift raises the buoy and primes the internal pump."],
  ["02", "Water enters", "The side inlet guides surface water into the collection chamber."],
  ["03", "Basket catches debris", "Floating waste is trapped in the removable mesh basket."],
  ["04", "Water returns", "Filtered water exits through the outlet below the surface line."],
];

const BENEFITS = [
  ["Sustainable", "Operates with tidal movement instead of batteries or grid power."],
  ["Efficient", "Continuously skims surface water while the device is floating."],
  ["Durable", "Designed as a visible marine-grade body with protected internals."],
  ["Impactful", "Targets plastic pollution before it reaches deeper ecosystems."],
];

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <circle cx="30" cy="32" r="22" />
        <path d="M16 31c8-13 24-13 33-1-8-5-15-4-20 1 4-1 8 0 11 3-7 7-18 7-24-3z" />
        <path d="M39 11c5-7 12-8 18-3-4 6-10 8-18 3z" />
      </svg>
    </span>
  );
}

function Icon({ type }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "basket") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path {...common} d="M7 12h18l-2 13H9L7 12z" />
        <path {...common} d="M10 12l3-5h6l3 5" />
        <path {...common} d="M12 16v6M16 16v6M20 16v6" />
      </svg>
    );
  }

  if (type === "pump") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path {...common} d="M5 12c4-4 8-4 12 0s8 4 12 0" />
        <path {...common} d="M5 20c4-4 8-4 12 0s8 4 12 0" />
      </svg>
    );
  }

  if (type === "body") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path {...common} d="M16 4l10 4v7c0 6-4 10-10 13C10 25 6 21 6 15V8l10-4z" />
      </svg>
    );
  }

  if (type === "inlet" || type === "outlet") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path {...common} d="M16 4s8 9 8 16a8 8 0 0 1-16 0C8 13 16 4 16 4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path {...common} d="M16 4v24M7 10c5 1 8 4 9 9 1-5 4-8 9-9" />
      <path {...common} d="M9 23h14" />
    </svg>
  );
}

function createCanvasLabel(text, width = 512, height = 190) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#092641";
  ctx.font = "700 46px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 34);

  ctx.beginPath();
  ctx.fillStyle = "#092641";
  ctx.arc(width / 2 - 18, height / 2 - 30, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#f2c700";
  ctx.arc(width / 2 + 8, height / 2 - 30, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(width / 2 - 4, height / 2 - 30, 28, 0.1, Math.PI * 1.55);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function material(name, color, options = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.18,
    roughness: options.roughness ?? 0.42,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
  });
  mat.name = name;
  mat.userData.baseEmissive = new THREE.Color(options.emissive ?? 0x000000);
  mat.userData.baseEmissiveIntensity = options.emissiveIntensity ?? 0;
  mat.emissive.copy(mat.userData.baseEmissive);
  mat.emissiveIntensity = mat.userData.baseEmissiveIntensity;
  return mat;
}

function addCylinder(group, radius, depth, mat, position, rotation = [0, 0, 0], radialSegments = 48) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, radialSegments),
    mat,
  );
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

function addTorus(group, radius, tube, mat, position, rotation = [Math.PI / 2, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 96), mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

function createBasketGroup(mats) {
  const basket = new THREE.Group();
  basket.name = "basket";

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.54, 0.68, 56, 1, true),
    mats.mesh,
  );
  shell.position.y = 0.08;
  basket.add(shell);

  addTorus(basket, 0.68, 0.03, mats.black, [0, 0.44, 0]);
  addTorus(basket, 0.54, 0.025, mats.black, [0, -0.28, 0]);

  for (let i = 0; i < 20; i += 1) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 0.61;
    const bar = addCylinder(
      basket,
      0.012,
      0.66,
      mats.wire,
      [Math.cos(angle) * radius, 0.07, Math.sin(angle) * radius],
    );
    bar.rotation.z = Math.sin(angle) * 0.08;
    bar.rotation.x = Math.cos(angle) * 0.08;
  }

  for (let row = 0; row < 5; row += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.57 + row * 0.025, 0.008, 8, 72),
      mats.wire,
    );
    ring.position.y = -0.2 + row * 0.12;
    ring.rotation.x = Math.PI / 2;
    basket.add(ring);
  }

  basket.position.y = 1.07;
  return basket;
}

function createOsmolemonModel() {
  const yellow = material("lemon yellow", 0xf5cf05, {
    metalness: 0.08,
    roughness: 0.36,
    emissive: 0x1d1400,
    emissiveIntensity: 0.02,
  });
  const yellowDark = material("lemon shadow", 0xd6aa00, {
    metalness: 0.08,
    roughness: 0.4,
  });
  const black = material("graphite", 0x1c2328, { metalness: 0.45, roughness: 0.3 });
  const innerBlack = material("inner shadow", 0x070a0d, { metalness: 0.35, roughness: 0.45 });
  const blue = material("flow blue", 0x087aa0, {
    metalness: 0.06,
    roughness: 0.3,
    emissive: 0x003652,
    emissiveIntensity: 0.15,
  });
  const mesh = material("basket mesh", 0xa39a74, {
    metalness: 0.7,
    roughness: 0.24,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
  });
  mesh.wireframe = true;
  const wire = material("basket wire", 0x665f45, { metalness: 0.7, roughness: 0.28 });

  const model = new THREE.Group();
  const parts = new Map();

  const body = new THREE.Group();
  body.name = "body";
  const bodyPoints = [
    [0.2, -2.06],
    [0.52, -2.0],
    [0.82, -1.7],
    [1.01, -1.14],
    [1.06, -0.3],
    [1.0, 0.58],
    [0.83, 0.93],
    [0.64, 1.04],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(bodyPoints, 96), yellow);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  body.add(bodyMesh);

  const upperRim = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.065, 12, 96), yellowDark);
  upperRim.position.y = 1.03;
  upperRim.rotation.x = Math.PI / 2;
  body.add(upperRim);

  const innerLip = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.03, 10, 96), black);
  innerLip.position.y = 1.12;
  innerLip.rotation.x = Math.PI / 2;
  body.add(innerLip);

  const lowerBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.16, 0.035),
    material("embossed badge", 0xe2bb04, { metalness: 0.12, roughness: 0.5 }),
  );
  lowerBadge.position.set(0, -1.48, 0.94);
  lowerBadge.rotation.x = -0.12;
  body.add(lowerBadge);
  parts.set("body", body);

  const basket = createBasketGroup({ mesh, wire, black });
  parts.set("basket", basket);

  const pump = new THREE.Group();
  pump.name = "pump";
  addCylinder(pump, 0.085, 1.18, black, [0, 1.47, 0], [0, 0, 0], 36);
  addCylinder(pump, 0.12, 0.3, innerBlack, [0, 0.88, 0], [0, 0, 0], 36);

  const capPoints = [
    [0.9, 0],
    [1.02, 0.06],
    [0.92, 0.22],
    [0.74, 0.48],
    [0.58, 0.78],
    [0.46, 1.16],
    [0.38, 1.48],
    [0.26, 1.66],
    [0.1, 1.73],
    [0, 1.75],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPoints, 96), yellow);
  cap.position.y = 1.28;
  cap.castShadow = true;
  cap.receiveShadow = true;
  pump.add(cap);

  const capRim = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.055, 12, 96), yellowDark);
  capRim.position.y = 1.29;
  capRim.rotation.x = Math.PI / 2;
  pump.add(capRim);

  const labelTexture = createCanvasLabel("OSMOLEMON");
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.34),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true }),
  );
  label.position.set(0, 1.98, 0.9);
  label.rotation.x = -0.08;
  pump.add(label);
  parts.set("pump", pump);

  const inlet = new THREE.Group();
  inlet.name = "inlet";
  const inletTube = addCylinder(inlet, 0.24, 0.82, yellow, [-1.22, -0.72, 0], [0, 0, Math.PI / 2]);
  inletTube.castShadow = true;
  addCylinder(inlet, 0.205, 0.04, black, [-1.66, -0.72, 0], [0, 0, Math.PI / 2]);
  addCylinder(inlet, 0.152, 0.045, innerBlack, [-1.69, -0.72, 0], [0, 0, Math.PI / 2]);
  const inletArrowShaft = addCylinder(inlet, 0.025, 0.2, blue, [-1.36, -0.72, 0.245], [0, 0, Math.PI / 2], 16);
  const inletArrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.15, 24), blue);
  inletArrowHead.position.set(-1.2, -0.72, 0.245);
  inletArrowHead.rotation.z = -Math.PI / 2;
  inlet.add(inletArrowHead, inletArrowShaft);
  parts.set("inlet", inlet);

  const outlet = new THREE.Group();
  outlet.name = "outlet";
  const outletTube = addCylinder(outlet, 0.24, 0.82, yellow, [1.22, -0.72, 0], [0, 0, Math.PI / 2]);
  outletTube.castShadow = true;
  addCylinder(outlet, 0.205, 0.04, black, [1.66, -0.72, 0], [0, 0, Math.PI / 2]);
  addCylinder(outlet, 0.152, 0.045, innerBlack, [1.69, -0.72, 0], [0, 0, Math.PI / 2]);
  const outletArrowShaft = addCylinder(outlet, 0.025, 0.2, blue, [1.26, -0.72, 0.245], [0, 0, Math.PI / 2], 16);
  const outletArrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.15, 24), blue);
  outletArrowHead.position.set(1.42, -0.72, 0.245);
  outletArrowHead.rotation.z = -Math.PI / 2;
  outlet.add(outletArrowHead, outletArrowShaft);
  parts.set("outlet", outlet);

  model.add(body, basket, pump, inlet, outlet);
  model.rotation.y = -0.18;
  model.position.y = -0.18;

  parts.set("system", model);
  return { model, parts };
}

function applyHighlight(parts, activeId) {
  parts.forEach((part, id) => {
    part.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((mat) => {
        if (!mat.emissive) return;
        mat.emissive.copy(mat.userData.baseEmissive ?? new THREE.Color(0x000000));
        mat.emissiveIntensity = mat.userData.baseEmissiveIntensity ?? 0;
      });
    });
  });

  const activePart = parts.get(activeId);
  if (!activePart) return;

  activePart.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((mat) => {
      if (!mat.emissive) return;
      mat.emissive.set(0xffd900);
      mat.emissiveIntensity = activeId === "system" ? 0.05 : 0.28;
    });
  });
}

function ModelViewer({ activePart, autoSpin }) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(4.9, 2.45, 8.7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5.8;
    controls.maxDistance = 11;
    controls.target.set(0, 0.18, 0);
    controls.enablePan = false;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9cc9d6, 1.9);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xd9f9ff, 1.2);
    fill.position.set(-3, 2, 5);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 96),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    );
    floor.position.y = -2.32;
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const { model, parts } = createOsmolemonModel();
    scene.add(model);

    sceneRef.current = { scene, renderer, camera, controls, model, parts };
    applyHighlight(parts, activePart);

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 0.012;
      if (autoSpin) model.rotation.y += 0.0028;
      model.position.y = -0.18 + Math.sin(frame) * 0.035;
      controls.update();
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };
    animate();

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width < 1 || height < 1) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    observer.observe(host);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat) => {
          mat.map?.dispose?.();
          mat.dispose?.();
        });
      });
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    applyHighlight(sceneRef.current.parts, activePart);
  }, [activePart]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.controls.autoRotate = false;
  }, [autoSpin]);

  return <div className="model-canvas" ref={hostRef} aria-label="Interactive 3D Osmolemon model" />;
}

function FeatureButton({ part, active, onSelect }) {
  return (
    <button
      className={`feature-button${active ? " is-active" : ""}`}
      type="button"
      onClick={() => onSelect(part.id)}
      aria-pressed={active}
    >
      <span className="feature-icon">
        <Icon type={part.id} />
      </span>
      <span>
        <strong>{part.label}</strong>
        <small>{part.short}</small>
      </span>
    </button>
  );
}

function App() {
  const [activePart, setActivePart] = useState("system");
  const [autoSpin, setAutoSpin] = useState(true);
  const active = useMemo(
    () => PARTS.find((part) => part.id === activePart) ?? PARTS[0],
    [activePart],
  );

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Osmolemon home">
          <LogoMark />
          <span>OSMOLEMON</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#how">How It Works</a>
          <a href="#components">Components</a>
          <a href="#impact">Impact</a>
        </nav>
        <a className="header-action" href="#components">
          Explore Model
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="tagline">Cleaner Waters. Brighter Future.</p>
          <h1>OSMOLEMON</h1>
          <p className="lede">
            Explore the tidal-powered cleaner that draws surface water through a
            removable basket, capturing floating debris before it spreads.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#components">
              Inspect Components
            </a>
            <button className="ghost-action" type="button" onClick={() => setAutoSpin((value) => !value)}>
              {autoSpin ? "Pause Rotation" : "Resume Rotation"}
            </button>
          </div>
        </div>

        <div className="viewer-shell" aria-label="Osmolemon 3D model explorer">
          <div className="viewer-heading">
            <span>Interactive 3D Model</span>
            <strong>{active.label}</strong>
          </div>
          <ModelViewer activePart={activePart} autoSpin={autoSpin} />
          <div className="callout callout-basket">
            <span />
            <strong>Collection Basket</strong>
          </div>
          <div className="callout callout-pump">
            <span />
            <strong>Tidal Pump</strong>
          </div>
          <div className="callout callout-body">
            <span />
            <strong>Buoyant Body</strong>
          </div>
          <div className="callout callout-flow">
            <span />
            <strong>Water In / Filtered Out</strong>
          </div>
        </div>

        <aside className="info-panel">
          <span className="panel-index">Selected Part</span>
          <h2>{active.label}</h2>
          <p>{active.detail}</p>
          <div className="panel-stat">
            <span>{active.stat}</span>
            <small>{active.short}</small>
          </div>
          <div className="feature-list">
            {PARTS.map((part) => (
              <FeatureButton
                key={part.id}
                part={part}
                active={part.id === activePart}
                onSelect={setActivePart}
              />
            ))}
          </div>
        </aside>
      </section>

      <section className="process-section" id="how">
        <div className="section-title">
          <span>How It Works</span>
          <h2>Wave motion creates a continuous clean-water loop.</h2>
        </div>
        <div className="process-grid">
          {STEPS.map(([number, title, copy]) => (
            <article className="process-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="components-section" id="components">
        <div className="section-title">
          <span>Component Explorer</span>
          <h2>Every visible part has a cleaning job.</h2>
        </div>
        <div className="component-layout">
          {PARTS.slice(1).map((part) => (
            <button
              key={part.id}
              className={`component-card${part.id === activePart ? " is-active" : ""}`}
              type="button"
              onClick={() => setActivePart(part.id)}
            >
              <Icon type={part.id} />
              <strong>{part.label}</strong>
              <span>{part.detail}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="impact-section" id="impact">
        <div className="impact-copy">
          <span>Impact</span>
          <h2>Cleaner harbors without a heavier power footprint.</h2>
          <p>
            The concept is built around passive marine motion, visible maintenance,
            and early capture of floating pollution in coastal water.
          </p>
        </div>
        <div className="benefit-grid">
          {BENEFITS.map(([title, copy], index) => (
            <article className="benefit-item" key={title}>
              <span className="benefit-icon">
                <Icon type={["system", "pump", "body", "outlet"][index]} />
              </span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="snapshot-section" aria-label="Technical snapshot">
        <dl>
          <div>
            <dt>Power</dt>
            <dd>Tidal motion</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>Floating debris and microplastics</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>Lift-out basket collection</dd>
          </div>
          <div>
            <dt>Placement</dt>
            <dd>Coastal and harbor surface waters</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

export default App;
