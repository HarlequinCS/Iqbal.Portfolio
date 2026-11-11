/**
 * Hero terrain: a field of points rendered with raw WebGL (no libraries).
 *
 * A fan-shaped grid of points is displaced by layered noise in the vertex
 * shader so it reads as terrain flowing toward the viewer. A "scan line"
 * sweeps across it and lights points in the accent colour, a few flagged
 * points keep pulsing (confirmed findings), and the surface swells under
 * the pointer.
 *
 * Cost control: one draw call, ~4–11k points, DPR capped, and the loop only
 * runs while the canvas is on screen and the tab is visible.
 */

const VERT = `
precision highp float;
attribute vec3 a_p;            // x: -1..1, y: depth 0..1, z: random seed
uniform float u_t, u_aspect, u_dpr, u_scan, u_size;
uniform vec2 u_ptr;            // pointer, -1..1
varying float v_a;
varying float v_hot;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { return noise(p) * 0.6 + noise(p * 2.1 + 7.0) * 0.3 + noise(p * 4.3 + 13.0) * 0.1; }

void main() {
  float z = a_p.y * 7.0 + 0.4;
  float x = a_p.x * (2.5 + z * 1.6);

  // Terrain height: the noise scrolls toward the viewer over time.
  float y = (fbm(vec2(x * 0.5, z * 0.55 + u_t * 0.16)) - 0.5) * 1.7;

  // The surface swells under the pointer.
  vec2 pw = vec2(u_ptr.x * (2.5 + 3.0 * 1.6), mix(4.6, 1.4, u_ptr.y * 0.5 + 0.5));
  float d = distance(vec2(x, z), pw);
  y += exp(-d * d * 0.9) * 0.42;

  // Scan line + a few persistent flagged points.
  float sd = z - u_scan;
  float scan = exp(-sd * sd * 16.0);
  float flagged = step(0.9935, a_p.z) * (0.55 + 0.45 * sin(u_t * 2.2 + a_p.z * 400.0));
  y += scan * 0.07;
  v_hot = max(scan, flagged);

  // Camera: slightly above, pitched down, drifting with the pointer.
  vec3 p = vec3(x, y, z) - vec3(u_ptr.x * 0.3, 1.25 + u_ptr.y * 0.1, -1.2);
  float c = cos(0.32), s = sin(0.32);
  float vz = -p.y * s + p.z * c;
  float vy = p.y * c + p.z * s;

  gl_Position = vec4(p.x * 1.5 / (vz * u_aspect), vy * 1.5 / vz - 0.3, 0.0, 1.0);
  gl_PointSize = u_dpr * clamp(u_size / vz, 0.8, 4.0) * (1.0 + v_hot * 0.9);

  float fade = smoothstep(9.0, 4.6, vz) * smoothstep(0.9, 1.7, vz);
  v_a = fade * (1.0 - smoothstep(0.78, 1.0, abs(a_p.x)));
}`;

const FRAG = `
precision mediump float;
uniform vec3 u_ink, u_accent;
uniform float u_alpha;
varying float v_a;
varying float v_hot;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c);
  if (r > 0.25) discard;
  float soft = smoothstep(0.25, 0.06, r);
  float hot = clamp(v_hot, 0.0, 1.0);
  vec3 col = mix(u_ink, u_accent, hot);
  float a = v_a * soft * (u_alpha + hot * 0.8);
  gl_FragColor = vec4(col * a, a);   // premultiplied alpha
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log);
  }
  return sh;
}

/** "#B93C12" or "rgb(…)" → [r, g, b] in 0..1 */
function toRgb(value) {
  const v = value.trim();
  if (v[0] === "#") {
    const n = parseInt(v.length === 4 ? v.replace(/[^#]/g, "$&$&").slice(1) : v.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  const m = v.match(/[\d.]+/g) || [0, 0, 0];
  return [m[0] / 255, m[1] / 255, m[2] / 255];
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ animate?: boolean }} options  animate=false renders one still frame
 * @returns {boolean} false if WebGL is unavailable
 */
export function initTerrain(canvas, { animate = true } = {}) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return false;

  let program, uniforms, count = 0;
  let width = 0, height = 0, dpr = 1;
  let raf = 0, onScreen = true, running = false;
  const start = performance.now();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function build() {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    uniforms = {};
    ["u_t", "u_aspect", "u_dpr", "u_scan", "u_size", "u_ptr", "u_ink", "u_accent", "u_alpha"].forEach((n) => {
      uniforms[n] = gl.getUniformLocation(program, n);
    });

    // Fewer points on small screens.
    const small = canvas.clientWidth < 700;
    const cols = small ? 84 : 168;
    const rows = small ? 46 : 66;
    const data = new Float32Array(cols * rows * 3);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        data[i++] = (c / (cols - 1)) * 2 - 1;
        data[i++] = Math.pow(r / (rows - 1), 1.25);   // denser rows near the viewer
        data[i++] = Math.random();
      }
    }
    count = cols * rows;

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1f(uniforms.u_size, small ? 4.2 : 5.4);
    readTheme();
  }

  function readTheme() {
    const css = getComputedStyle(document.documentElement);
    const ink = toRgb(css.getPropertyValue("--ink"));
    const accent = toRgb(css.getPropertyValue("--accent"));
    const dark = ink[0] + ink[1] + ink[2] > 1.5;   // light ink means a dark theme
    gl.useProgram(program);
    gl.uniform3fv(uniforms.u_ink, ink);
    gl.uniform3fv(uniforms.u_accent, accent);
    gl.uniform1f(uniforms.u_alpha, dark ? 0.62 : 0.5);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.uniform1f(uniforms.u_aspect, width / height);
    gl.uniform1f(uniforms.u_dpr, dpr);
  }

  function draw(now) {
    const t = animate ? (now - start) / 1000 : 4.2;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    // The scan crosses the field in 5.5s, then rests for 3.5s.
    const cycle = (t % 9) / 5.5;
    const scan = animate ? (cycle > 1 ? -10 : 7.6 - cycle * 7.6) : 3.4;

    gl.uniform1f(uniforms.u_t, t);
    gl.uniform1f(uniforms.u_scan, scan);
    gl.uniform2f(uniforms.u_ptr, pointer.x, pointer.y);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  function loop(now) {
    draw(now);
    raf = running ? requestAnimationFrame(loop) : 0;
  }
  function play() {
    const should = animate && onScreen && !document.hidden;
    if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  try {
    build();
  } catch (err) {
    console.warn("Hero terrain disabled:", err.message);
    return false;
  }
  resize();
  draw(performance.now());
  canvas.classList.add("is-live");

  new ResizeObserver(() => { resize(); if (!running) draw(performance.now()); }).observe(canvas);

  // Follow theme changes (manual toggle or system switch).
  const retheme = () => { readTheme(); if (!running) draw(performance.now()); };
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);

  if (animate) {
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; play(); }).observe(canvas);
    document.addEventListener("visibilitychange", play);
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); running = false; cancelAnimationFrame(raf); });
  canvas.addEventListener("webglcontextrestored", () => { build(); resize(); play(); });

  play();
  return true;
}
