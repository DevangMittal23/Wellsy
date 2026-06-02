"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, MessageCircle, X, Sparkles } from "lucide-react";
import { sendFriendRequest } from "@/actions/friend-actions";
import { getInitials } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────
interface GalaxyPerson {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
  followers_count: number;
}

interface GalaxyCanvasProps {
  people: GalaxyPerson[];
  pendingRequests?: any[];
}

// ─── Star Dust Particles ──────────────────────────────
function StarDust({ count = 2000 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Soft purple-blue-white color variation
      const t = Math.random();
      if (t < 0.3) {
        col[i * 3] = 0.55 + Math.random() * 0.15;
        col[i * 3 + 1] = 0.36 + Math.random() * 0.1;
        col[i * 3 + 2] = 0.96;
      } else if (t < 0.6) {
        col[i * 3] = 0.35;
        col[i * 3 + 1] = 0.55 + Math.random() * 0.15;
        col[i * 3 + 2] = 0.96;
      } else {
        col[i * 3] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 2] = 0.95 + Math.random() * 0.05;
      }
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.015;
      mesh.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Nebula Ring ───────────────────────────────────────
function NebulaRing() {
  const mesh = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 10 + Math.random() * 2;
      pos[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 1.5;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#8b5cf6"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── User Node (Interactive 3D Sphere) ────────────────
function UserNode({
  person,
  position,
  index,
  onSelect,
}: {
  person: GalaxyPerson;
  position: [number, number, number];
  index: number;
  onSelect: (person: GalaxyPerson) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    const hues = [263, 290, 320, 200, 170, 230];
    const hue = hues[index % hues.length];
    return new THREE.Color(`hsl(${hue}, 70%, 60%)`);
  }, [index]);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating motion
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.5 + index * 1.7) * 0.3;
      
      // Pulse scale on hover
      const targetScale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }

    if (glowRef.current) {
      glowRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.5 + index * 1.7) * 0.3;
      const glowScale = hovered ? 2.2 : 1.6;
      glowRef.current.scale.lerp(
        new THREE.Vector3(glowScale, glowScale, glowScale),
        0.1
      );
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 0.25 : 0.1;
    }
  });

  return (
    <group>
      {/* Glow sphere */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(person);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Name label */}
      <Html
        position={[position[0], position[1] - 0.9, position[2]]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-medium text-text-secondary backdrop-blur-sm border border-border/40">
          {person.display_name.split(" ")[0]}
        </div>
      </Html>

      {/* Online indicator */}
      {person.is_online && (
        <Html
          position={[position[0] + 0.45, position[1] + 0.45, position[2]]}
          center
          distanceFactor={12}
          style={{ pointerEvents: "none" }}
        >
          <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
        </Html>
      )}
    </group>
  );
}

// ─── Scene Content ────────────────────────────────────
function GalaxyScene({
  people,
  onSelectPerson,
}: {
  people: GalaxyPerson[];
  onSelectPerson: (person: GalaxyPerson) => void;
}) {
  const { camera } = useThree();

  // Distribute users in a spiral/orbital pattern
  const positions = useMemo(() => {
    return people.map((_, i): [number, number, number] => {
      const count = people.length;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenAngle * i;
      const r = 3 + (i / count) * 6;
      const y = (Math.random() - 0.5) * 4;
      return [
        Math.cos(theta) * r,
        y,
        Math.sin(theta) * r,
      ];
    });
  }, [people]);

  // Initial camera position
  useMemo(() => {
    camera.position.set(0, 5, 16);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#8b5cf6" distance={30} />
      <pointLight position={[8, 4, -5]} intensity={0.8} color="#c084fc" distance={20} />
      <pointLight position={[-6, -3, 6]} intensity={0.5} color="#60a5fa" distance={20} />

      {/* Particles */}
      <StarDust count={2500} />
      <NebulaRing />

      {/* Center core glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* User Nodes */}
      {people.map((person, i) => (
        <UserNode
          key={person.id}
          person={person}
          position={positions[i]}
          index={i}
          onSelect={onSelectPerson}
        />
      ))}

      {/* Orbit Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={5}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// ─── Person Detail Card (Glassmorphic Overlay) ────────
function PersonDetailCard({
  person,
  onClose,
}: {
  person: GalaxyPerson;
  onClose: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleAddFriend = async () => {
    setSending(true);
    await sendFriendRequest(person.id);
    setSent(true);
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="absolute bottom-6 left-1/2 z-20 w-[320px] -translate-x-1/2"
    >
      <div className="glass-strong rounded-2xl p-5 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-text-muted transition hover:bg-surface-hover hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Avatar + Info */}
        <div className="flex items-center gap-3.5">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={person.display_name}
              className="h-14 w-14 rounded-full border-2 border-accent/30 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent/30 bg-accent-muted text-lg font-bold text-accent">
              {getInitials(person.display_name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-text-primary">
              {person.display_name}
            </h3>
            <p className="text-sm text-text-muted">@{person.username}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-text-muted">
                {person.followers_count} followers
              </span>
              {person.is_online && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Online
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {person.bio && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {person.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAddFriend}
            disabled={sending || sent}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 ${
              sent
                ? "bg-success/20 text-success"
                : "bg-accent text-white hover:bg-accent-hover"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            {sent ? "Request Sent" : sending ? "Sending..." : "Add Friend"}
          </button>
          <a
            href={`/chat?user=${person.username}`}
            className="flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-all hover:bg-surface-hover active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────
export function GalaxyCanvas({ people }: GalaxyCanvasProps) {
  const [selectedPerson, setSelectedPerson] = useState<GalaxyPerson | null>(null);

  const handleSelectPerson = useCallback((person: GalaxyPerson) => {
    setSelectedPerson(person);
  }, []);

  if (people.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Sparkles className="h-12 w-12 text-text-muted" />
        <p className="text-lg font-medium text-text-secondary">
          No explorers in the galaxy yet
        </p>
        <p className="text-sm text-text-muted">
          Come back later to discover new connections
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[65vh] w-full overflow-hidden rounded-2xl border border-border/40">
      {/* Canvas */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 50, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
        onPointerMissed={() => setSelectedPerson(null)}
      >
        <GalaxyScene
          people={people}
          onSelectPerson={handleSelectPerson}
        />
      </Canvas>

      {/* Gradient overlays for blending */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-background/30 to-transparent" />

      {/* Hint */}
      <div className="pointer-events-none absolute left-4 top-4">
        <p className="flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-xs text-text-muted backdrop-blur-sm border border-border/30">
          <Sparkles className="h-3 w-3" />
          Click a node to connect
        </p>
      </div>

      {/* Selected Person Card */}
      <AnimatePresence>
        {selectedPerson && (
          <PersonDetailCard
            key={selectedPerson.id}
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
