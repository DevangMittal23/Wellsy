"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Simplex Noise GLSL (inline) ──────────────────────
const simplexNoise = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const vertexShader = `
  ${simplexNoise}

  uniform float uTime;
  uniform float uNoiseAmp;
  uniform float uNoiseFreq;
  uniform vec2 uMouse;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    vNormal = normal;
    vPosition = position;

    // Multi-octave simplex noise displacement
    float noise1 = snoise(position * uNoiseFreq + uTime * 0.3) * uNoiseAmp;
    float noise2 = snoise(position * uNoiseFreq * 2.0 + uTime * 0.5) * uNoiseAmp * 0.5;
    float noise3 = snoise(position * uNoiseFreq * 4.0 + uTime * 0.8) * uNoiseAmp * 0.25;

    float totalNoise = noise1 + noise2 + noise3;

    // Mouse magnetic deformation
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    float mouseInfluence = smoothstep(3.0, 0.0, length(worldPos.xy - uMouse * 3.0));
    totalNoise += mouseInfluence * 0.4;

    vDisplacement = totalNoise;

    vec3 newPosition = position + normal * totalNoise;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uPulse;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    // Fresnel rim light
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);

    // Color mixing based on displacement + position
    float t = vDisplacement * 2.0 + 0.5;
    vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, t));
    color = mix(color, uColor3, smoothstep(0.5, 1.0, t));

    // Pulsing glow
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    float glowIntensity = 0.3 + pulse * uPulse * 0.2;

    // Combine
    vec3 finalColor = color + fresnel * vec3(0.55, 0.36, 0.96) * 0.8;
    finalColor += glowIntensity * color * 0.3;

    // Subtle iridescence
    float iridescence = sin(vPosition.x * 5.0 + vPosition.y * 3.0 + uTime) * 0.5 + 0.5;
    finalColor += iridescence * vec3(0.1, 0.05, 0.15);

    gl_FragColor = vec4(finalColor, 0.92);
  }
`;

// ─── Morphing Sphere Mesh ─────────────────────────────
function MorphingSphere({
  color1,
  color2,
  color3,
  pulseIntensity,
}: {
  color1: THREE.Color;
  color2: THREE.Color;
  color3: THREE.Color;
  pulseIntensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const mouseRef = useRef<[number, number]>([0, 0]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseAmp: { value: 0.35 },
      uNoiseFreq: { value: 1.2 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor1: { value: color1 },
      uColor2: { value: color2 },
      uColor3: { value: color3 },
      uPulse: { value: pulseIntensity },
    }),
    [color1, color2, color3, pulseIntensity]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMouse.value.set(
        mouseRef.current[0],
        mouseRef.current[1]
      );
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerMove={(e) => {
        if (e.uv) {
          mouseRef.current = [e.uv.x * 2 - 1, e.uv.y * 2 - 1];
        }
      }}
      onPointerLeave={() => {
        mouseRef.current = [0, 0];
      }}
    >
      <icosahedronGeometry args={[2, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Ambient Particles ────────────────────────────────
function AmbientParticles() {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#c084fc"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Digital Core Props ───────────────────────────────
interface DigitalCoreProps {
  /** Primary hue for the sphere (HSL hue value, 0-360) */
  hue?: number;
  /** Whether the user is online — controls pulse intensity */
  isOnline?: boolean;
  /** Height of the canvas container */
  height?: string;
}

// ─── Main Export ──────────────────────────────────────
export function DigitalCore({
  hue = 263,
  isOnline = false,
  height = "220px",
}: DigitalCoreProps) {
  const [fallback, setFallback] = useState(false);

  // Generate 3 colors from the hue
  const colors = useMemo(() => {
    const c1 = new THREE.Color(`hsl(${hue}, 70%, 55%)`);
    const c2 = new THREE.Color(`hsl(${(hue + 40) % 360}, 65%, 50%)`);
    const c3 = new THREE.Color(`hsl(${(hue + 80) % 360}, 60%, 45%)`);
    return { c1, c2, c3 };
  }, [hue]);

  // CSS fallback for devices without WebGL
  if (fallback) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ height }}
      >
        <div
          className="absolute inset-0 animate-[pulse-glow_3s_ease-in-out_infinite]"
          style={{
            background: `radial-gradient(ellipse at center, hsl(${hue} 70% 30%) 0%, hsl(${hue} 50% 10%) 50%, transparent 80%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 70% 20%), hsl(${(hue + 40) % 360} 65% 15%), hsl(${(hue + 80) % 360} 60% 12%))`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: "transparent" }}
        onCreated={(state) => {
          // Check WebGL availability
          if (!state.gl.capabilities.isWebGL2) {
            setFallback(true);
          }
        }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[3, 3, 3]} intensity={0.5} color="#8b5cf6" />
        <MorphingSphere
          color1={colors.c1}
          color2={colors.c2}
          color3={colors.c3}
          pulseIntensity={isOnline ? 1.0 : 0.3}
        />
        <AmbientParticles />
      </Canvas>

      {/* Bottom gradient blend */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
