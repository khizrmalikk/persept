// <percy-avatar mode="auto|idle|listening|thinking|speaking|working"> — Percy: white head in a baggy hood (theme accent).
// One shared WebGL renderer draws every instance into its own 2D canvas.
// mode="auto" (default) follows window.PercyBus.mode so every Percy on screen reacts together.
//
// Ported verbatim from the Persept OS v4 design package, with two changes for production:
//   1. three is imported from the npm package (a dependency) instead of unpkg, so it works
//      offline and under CSP.
//   2. theme accent is read from --accent (the dashboard token) with --acc as a fallback.
(() => {
  if (window.customElements.get("percy-avatar")) return;
  if (!window.PercyBus) {
    window.PercyBus = { mode: "idle", look: null, call: false };
  }
  const BUS = window.PercyBus;
  const SZ = 512,
    ORANGE = 0xff5533;
  const insts = new Set();
  const ptr = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  window.addEventListener(
    "pointermove",
    (e) => {
      ptr.x = e.clientX;
      ptr.y = e.clientY;
    },
    { passive: true },
  );
  let T = null,
    R = null,
    loading = null,
    raf = 0,
    last = 0,
    frame = 0;
  // head superellipsoid
  const HE = 2.3,
    HS = 0.88,
    HSY = 0.92,
    HSZ = 0.9,
    HYC = 0.08;
  // hood: sphere shell with its open pole tilted forward-down, loose and folded
  const TH0 = 0.74,
    AL = Math.PI / 2 + 0.32,
    HX = 1.32,
    HY = 1.14,
    HZ = 1.2,
    HCY = 0.1,
    HCZ = -0.16;

  function load() {
    if (loading) return loading;
    loading = import("three")
      .then((m) => {
        T = m;
        try {
          R = build();
        } catch (e) {
          console.warn("[percy] webgl unavailable", e);
        }
      })
      .catch((e) => console.warn("[percy] three failed to load", e));
    return loading;
  }

  function superShell(e) {
    const g = new T.SphereGeometry(1, 112, 80),
      p = g.attributes.position,
      nr = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const n =
        (Math.abs(x) ** e + Math.abs(y) ** e + Math.abs(z) ** e) ** (1 / e) ||
        1;
      const X = x / n,
        Y = (y / n) * HSY,
        Z = (z / n) * HSZ;
      p.setXYZ(i, X, Y, Z);
      const gx = Math.sign(X) * Math.abs(X) ** (e - 1),
        gy = (Math.sign(Y) * Math.abs(Y / HSY) ** (e - 1)) / HSY,
        gz = (Math.sign(Z) * Math.abs(Z / HSZ) ** (e - 1)) / HSZ;
      const l = Math.hypot(gx, gy, gz) || 1;
      nr.setXYZ(i, gx / l, gy / l, gz / l);
    }
    return g;
  }

  // sphere-local direction -> hood surface point
  function hoodPt(x0, y0, z0) {
    const l = Math.hypot(x0, y0, z0) || 1;
    x0 /= l;
    y0 /= l;
    z0 /= l;
    const ca = Math.cos(AL),
      sa = Math.sin(AL);
    const x = x0,
      y = y0 * ca - z0 * sa,
      z = y0 * sa + z0 * ca;
    const up = Math.max(0, y),
      low = Math.max(0, -y - 0.3) / 0.7;
    const X = x * HX * (1 + 0.4 * low);
    const Y = y * HY + 0.04 * up ** 4 - 0.16 * low;
    const Z = z * HZ * (1 + 0.22 * low) - 0.12 * up ** 3;
    return new T.Vector3(X, Y + HCY, Z + HCZ);
  }
  function hoodGeo() {
    const g = new T.SphereGeometry(
        1,
        144,
        80,
        0,
        Math.PI * 2,
        TH0,
        Math.PI - TH0,
      ),
      p = g.attributes.position,
      nr = g.attributes.normal;
    const u = new T.Vector3(),
      a = new T.Vector3(),
      t1 = new T.Vector3(),
      t2 = new T.Vector3(),
      c = new T.Vector3(0, HCY, HCZ),
      e = 0.004;
    for (let i = 0; i < p.count; i++) {
      u.fromBufferAttribute(p, i).normalize();
      a.set(Math.abs(u.y) > 0.9 ? 1 : 0, Math.abs(u.y) > 0.9 ? 0 : 1, 0);
      t1.crossVectors(u, a).normalize();
      t2.crossVectors(u, t1);
      const p0 = hoodPt(u.x, u.y, u.z),
        p1 = hoodPt(u.x + t1.x * e, u.y + t1.y * e, u.z + t1.z * e),
        p2 = hoodPt(u.x + t2.x * e, u.y + t2.y * e, u.z + t2.z * e);
      const n = p1.sub(p0).cross(p2.sub(p0)).normalize();
      if (n.dot(p0.clone().sub(c)) < 0) n.negate();
      p.setXYZ(i, p0.x, p0.y, p0.z);
      nr.setXYZ(i, n.x, n.y, n.z);
    }
    return g;
  }
  const rimAt = (phi) =>
    hoodPt(
      -Math.cos(phi) * Math.sin(TH0),
      Math.cos(TH0),
      Math.sin(phi) * Math.sin(TH0),
    );

  function build() {
    const canvas = document.createElement("canvas");
    canvas.width = SZ;
    canvas.height = SZ;
    const renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(1);
    renderer.setSize(SZ, SZ, false);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new T.Scene();
    const env = new T.Scene();
    env.add(
      new T.Mesh(
        new T.BoxGeometry(12, 12, 12),
        new T.MeshBasicMaterial({ color: 0x0b0b0b, side: T.BackSide }),
      ),
    );
    const panel = (w, h, col, k, x, y, z) => {
      const m = new T.Mesh(
        new T.PlaneGeometry(w, h),
        new T.MeshBasicMaterial({
          color: new T.Color(col).multiplyScalar(k),
          side: T.DoubleSide,
        }),
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    panel(4.5, 3, 0xffffff, 3.2, -3.2, 3.4, 3.6);
    panel(2, 4, 0xffffff, 1.1, 4.4, 0.6, 1.6);
    panel(6, 1.2, 0xffffff, 1.4, 0, 5.2, -0.5);
    panel(6, 1.6, ORANGE, 2.0, 0.5, -0.6, -5);
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.035).texture;
    renderer.setClearColor(0x000000, 0);
    renderer.setScissorTest(true);

    const key = new T.DirectionalLight(0xffffff, 1.6);
    key.position.set(-2.5, 3, 4);
    scene.add(key);
    const rim = new T.DirectionalLight(ORANGE, 2.4);
    rim.position.set(3, 1.2, -3);
    scene.add(rim);
    const rim2 = new T.DirectionalLight(0xffe6d8, 0.8);
    rim2.position.set(-3.5, -0.5, -2);
    scene.add(rim2);
    const amb = new T.AmbientLight(0xffffff, 0.35);
    scene.add(amb);
    const camera = new T.PerspectiveCamera(26, 1, 0.1, 50);

    const M = {
      head: new T.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: 0x4a4a4a,
        roughness: 0.3,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.14,
      }),
      eye: new T.MeshStandardMaterial({ color: 0x151313, roughness: 0.4 }),
      cloth: new T.MeshStandardMaterial({
        color: ORANGE,
        roughness: 0.95,
        metalness: 0,
        envMapIntensity: 0.25,
      }),
      lining: new T.MeshStandardMaterial({
        color: 0x5a1a0e,
        roughness: 1,
        side: T.BackSide,
        envMapIntensity: 0.15,
      }),
    };
    const rig = new T.Group();
    scene.add(rig);
    const head = new T.Group();
    rig.add(head);
    const skull = new T.Mesh(superShell(HE), M.head);
    skull.scale.setScalar(HS);
    skull.position.y = HYC;
    head.add(skull);
    const eyeGeo = new T.SphereGeometry(0.115, 32, 24);
    const eyes = [0, 1].map(() => {
      const g = new T.Group(),
        m = new T.Mesh(eyeGeo, M.eye);
      m.scale.set(0.85, 1.15, 0.3);
      g.add(m);
      head.add(g);
      return g;
    });
    const hg = hoodGeo();
    head.add(new T.Mesh(hg, M.cloth));
    head.add(new T.Mesh(hg, M.lining));
    const rimPts = [];
    for (let i = 0; i < 180; i++) rimPts.push(rimAt((i / 180) * Math.PI * 2));
    head.add(
      new T.Mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(rimPts, true),
          240,
          0.1,
          14,
          true,
        ),
        M.cloth,
      ),
    );
    return {
      renderer,
      canvas,
      scene,
      camera,
      M,
      rim,
      amb,
      parts: { rig, head, eyes },
      V: new T.Vector3(),
      Z: new T.Vector3(0, 0, 1),
      th: null,
    };
  }

  // theme: accent from --accent (fallback --acc), light/dark from --bg luminance
  // (inherited CSS vars; falls back to dark + ember)
  const pc = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  function rgb(str, fb) {
    pc.fillStyle = fb;
    if (str) pc.fillStyle = str;
    pc.clearRect(0, 0, 1, 1);
    pc.fillRect(0, 0, 1, 1);
    const d = pc.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  function themeOf(el) {
    if (el._th && frame - el._thF < 30) return el._th;
    const cs = getComputedStyle(el),
      a = rgb(
        cs.getPropertyValue("--accent").trim() ||
          cs.getPropertyValue("--acc").trim(),
        "#ff5533",
      ),
      b = rgb(cs.getPropertyValue("--bg").trim(), "#0c0c0c");
    const light = (0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2]) / 255 > 0.5,
      key = a.join(",") + (light ? "L" : "D");
    el._thF = frame;
    if (!el._th || el._th.key !== key)
      el._th = {
        key,
        light,
        acc: a,
        hex: `#${a.map((x) => x.toString(16).padStart(2, "0")).join("")}`,
      };
    return el._th;
  }
  function applyTheme(th) {
    if (R.th === th.key) return;
    R.th = th.key;
    const M = R.M,
      A = new T.Color().setRGB(
        th.acc[0] / 255,
        th.acc[1] / 255,
        th.acc[2] / 255,
        T.SRGBColorSpace,
      );
    M.cloth.color.copy(A);
    M.lining.color.copy(A).multiplyScalar(0.3);
    R.rim.color.copy(A);
    R.amb.intensity = th.light ? 0.55 : 0.35;
  }

  // place o on the head's front surface at (x, y), facing out along the surface normal
  function onFace(o, x, y, lift) {
    const xn = x / HS,
      yn = (y - HYC) / (HS * HSY),
      r = 1 - Math.abs(xn) ** HE - Math.abs(yn) ** HE;
    const zn = Math.max(0.001, r) ** (1 / HE),
      z = zn * HS * HSZ;
    const n = R.V.set(
      (Math.sign(xn) * Math.abs(xn) ** (HE - 1)) / HS,
      (Math.sign(yn) * Math.abs(yn) ** (HE - 1)) / (HS * HSY),
      zn ** (HE - 1) / (HS * HSZ),
    ).normalize();
    o.position.set(x + n.x * lift, y + n.y * lift, z + n.z * lift);
    o.quaternion.setFromUnitVectors(R.Z, n);
  }

  const MODES = {
    idle: [1, 0],
    listening: [1.12, 0],
    thinking: [0.3, 0],
    speaking: [1, 1],
    working: [0.8, 0],
  };
  function modeOf(el) {
    const m = el._mode || el.getAttribute("mode");
    return !m || m === "auto" ? BUS.mode || "idle" : m;
  }

  function step(el, dt, r, vw, vh) {
    const v = el.v,
      m = modeOf(el);
    v.m = m;
    let tx, ty;
    if (m === "thinking") {
      tx = 0.55;
      ty = -0.6;
    } else {
      const L = BUS.look || ptr,
        cx = r.left + r.width / 2,
        cy = r.top + r.height / 2;
      tx = Math.max(-1, Math.min(1, (L.x - cx) / (vw * 0.45)));
      ty = Math.max(-1, Math.min(1, (L.y - cy) / (vh * 0.45)));
    }
    const k = 1 - Math.exp(-dt * 5);
    v.lx += (tx - v.lx) * k;
    v.ly += (ty - v.ly) * k;
    v.nb -= dt;
    if (v.nb <= 0) {
      v.blink = 1;
      v.nb = 2.2 + Math.random() * 3.5;
    }
    if (v.blink > 0) v.blink = Math.max(0, v.blink - dt * 7);
    const g = MODES[m] || MODES.idle,
      k2 = 1 - Math.exp(-dt * 6);
    v.sq += (g[0] - v.sq) * k2;
    v.mouth += (g[1] - v.mouth) * k2;
    v.ear += ((BUS.call || m === "listening" ? 1 : 0) - v.ear) * k2;
    v.scan += ((m === "working" ? 1 : 0) - v.scan) * k2;
  }

  function pose(el, t, w) {
    const v = el.v,
      P = R.parts,
      m = v.m;
    applyTheme(themeOf(el));
    if (w < 48) {
      R.camera.position.set(0, 0.12, 5.0);
      R.camera.lookAt(0, 0.04, 0);
    } else {
      R.camera.position.set(0, 0.1, 6.3);
      R.camera.lookAt(0, 0.08, 0);
    }
    P.rig.position.y = Math.sin(t * 1.2 + v.seed) * 0.04;
    P.head.rotation.set(
      v.ly * 0.2,
      v.lx * 0.4,
      m === "listening"
        ? 0.08 + Math.sin(t * 0.9) * 0.03
        : Math.sin(t * 0.5 + v.seed) * 0.02,
    );
    const bl = 1 - Math.sin(v.blink * Math.PI) * 0.92,
      ex = v.lx * 0.05 + v.scan * Math.sin(t * 2.6) * 0.07,
      ey = -v.ly * 0.035;
    const lp = m === "listening" ? 0.05 * Math.sin(t * 5) : 0;
    const amp =
      v.mouth * Math.abs(Math.sin(t * 11 + v.seed) * Math.sin(t * 4.3));
    P.eyes.forEach((e, i) => {
      onFace(e, (i ? 0.27 : -0.27) + ex, 0.1 + ey + amp * 0.02, 0.004);
      const s = 1 + lp;
      e.scale.set(
        s * (1 + amp * 0.08),
        Math.max(0.08, v.sq * bl * (1 - amp * 0.22)) * s,
        1,
      );
    });
    P.head.rotation.x += amp * 0.05;
  }

  function flat(el, px, _t) {
    const g = el._g,
      s = px / 100,
      th = themeOf(el);
    g.clearRect(0, 0, px, px);
    g.fillStyle = th.hex;
    g.beginPath();
    g.ellipse(50 * s, 50 * s, 42 * s, 40 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f6f5f2";
    g.beginPath();
    g.ellipse(50 * s, 55 * s, 27 * s, 25 * s, 0, 0, Math.PI * 2);
    g.fill();
    const h = 10 * s * (el.v.blink > 0.3 ? 0.15 : 1);
    g.fillStyle = "#151313";
    [42, 58].forEach((x) => {
      g.beginPath();
      g.ellipse(x * s, 54 * s, 3.4 * s, h / 2, 0, 0, Math.PI * 2);
      g.fill();
    });
  }

  function tick(now) {
    raf = insts.size ? requestAnimationFrame(tick) : 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    frame++;
    const t = now / 1000,
      vw = window.innerWidth,
      vh = window.innerHeight,
      dpr = Math.min(2, window.devicePixelRatio || 1);
    insts.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (
        r.width < 2 ||
        r.bottom < 0 ||
        r.top > vh ||
        r.right < 0 ||
        r.left > vw
      )
        return;
      const px = Math.max(8, Math.min(SZ, Math.round(r.width * dpr)));
      if (el._c.width !== px) {
        el._c.width = px;
        el._c.height = px;
        el._drawn = false;
      }
      step(el, dt, r, vw, vh);
      const every = r.width < 36 ? 3 : r.width < 70 ? 2 : 1;
      if (el._drawn && (frame + (el.v.seed | 0)) % every) return;
      if (R) {
        pose(el, t, r.width);
        R.renderer.setViewport(0, 0, px, px);
        R.renderer.setScissor(0, 0, px, px);
        R.renderer.clear();
        R.renderer.render(R.scene, R.camera);
        el._g.clearRect(0, 0, px, px);
        el._g.drawImage(R.canvas, 0, SZ - px, px, px, 0, 0, px, px);
        el._drawn = true;
      } else flat(el, px, t);
    });
  }

  class PercyAvatar extends HTMLElement {
    static get observedAttributes() {
      return ["mode"];
    }
    constructor() {
      super();
      this._mode = null;
      this.v = {
        lx: 0,
        ly: 0,
        blink: 0,
        nb: 1.5 + Math.random() * 3,
        sq: 1,
        ear: 0,
        mouth: 0,
        scan: 0,
        seed: Math.random() * 100,
        m: "idle",
      };
    }
    get mode() {
      return this._mode;
    }
    set mode(v) {
      this._mode = v;
    }
    attributeChangedCallback(n, _o, v) {
      if (n === "mode") this._mode = v;
    }
    connectedCallback() {
      if (!this._c) {
        this.style.display = "block";
        if (!this.style.width) this.style.width = "100%";
        if (!this.style.height) this.style.height = "100%";
        const c = document.createElement("canvas");
        c.style.cssText = "display:block;width:100%;height:100%;";
        this.appendChild(c);
        this._c = c;
        this._g = c.getContext("2d");
      }
      insts.add(this);
      load();
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }
    disconnectedCallback() {
      insts.delete(this);
    }
  }
  window.customElements.define("percy-avatar", PercyAvatar);
})();

// Side-effect module (registers the custom element on import). The empty export
// marks the file as an ES module so `import("./percy-3d.js")` type-checks.
export {};
