"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type JourneyCameraProps = {
  /** Ref containing the current journey progress 0..1 (read each frame) */
  progressRef: React.MutableRefObject<number>;
  /**
   * Array of stations the camera moves through, in order.
   * Each station: { z, hold } — `hold` is the fraction of total journey
   * progress spent lingering at that station. The remainder is shared
   * equally between transitions. Holds should sum to ≤ 1.
   */
  stations: { z: number; hold: number }[];
  /** Ref the camera writes its current Z into so DestinationScene can read it */
  cameraZRef: React.MutableRefObject<number>;
};

/**
 * Camera that glides linearly along the Z axis as the user scrolls.
 * - Reads progress from a ref (no React re-renders per frame)
 * - Allows light horizontal/vertical drag to look around
 * - Subtle bob to give a "floating" feel
 */
/**
 * Build a piecewise mapping `progress (0..1) → cameraZ` from the stations.
 * Each station occupies a `hold` window, separated by linear transitions
 * that share the leftover progress equally.
 */
function buildSegments(stations: { z: number; hold: number }[]) {
  const totalHold = stations.reduce((s, st) => s + st.hold, 0);
  const transitionTotal = Math.max(0, 1 - totalHold);
  const transitionEach =
    stations.length > 1 ? transitionTotal / (stations.length - 1) : 0;

  // Build [start, end] windows for hold and transition phases
  const segments: {
    type: "hold" | "transition";
    start: number;
    end: number;
    fromZ: number;
    toZ: number;
  }[] = [];
  let cursor = 0;
  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    segments.push({
      type: "hold",
      start: cursor,
      end: cursor + st.hold,
      fromZ: st.z,
      toZ: st.z,
    });
    cursor += st.hold;
    if (i < stations.length - 1) {
      segments.push({
        type: "transition",
        start: cursor,
        end: cursor + transitionEach,
        fromZ: st.z,
        toZ: stations[i + 1].z,
      });
      cursor += transitionEach;
    }
  }
  return segments;
}

function progressToZ(
  p: number,
  segments: ReturnType<typeof buildSegments>
): number {
  for (const seg of segments) {
    if (p <= seg.end) {
      if (seg.type === "hold") return seg.fromZ;
      const span = seg.end - seg.start || 1;
      const t = (p - seg.start) / span;
      // Smoothstep so transitions accelerate/decelerate gently
      const e = t * t * (3 - 2 * t);
      return seg.fromZ + (seg.toZ - seg.fromZ) * e;
    }
  }
  // Past the last segment
  return segments[segments.length - 1].toZ;
}

export default function JourneyCamera({
  progressRef,
  stations,
  cameraZRef,
}: JourneyCameraProps) {
  const { camera, gl } = useThree();
  const segments = useRef(buildSegments(stations));

  // Pointer drag state — stored in refs to avoid React updates
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  // Drag offset (radians) — applied to camera rotation as a "look around"
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragOffsetTarget = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const dom = gl.domElement;

    const onDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      dom.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      // Inverse so dragging right looks right
      dragOffsetTarget.current.x += dx * 0.0025;
      dragOffsetTarget.current.y += dy * 0.0015;
      // Clamp so the user can't completely flip the camera
      const maxX = 0.5;
      const maxY = 0.25;
      dragOffsetTarget.current.x = Math.max(
        -maxX,
        Math.min(maxX, dragOffsetTarget.current.x)
      );
      dragOffsetTarget.current.y = Math.max(
        -maxY,
        Math.min(maxY, dragOffsetTarget.current.y)
      );
    };
    const onUp = () => {
      isDragging.current = false;
      dom.style.cursor = "grab";
    };

    dom.style.cursor = "grab";
    dom.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      dom.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dom.style.cursor = "";
    };
  }, [gl]);

  useFrame((_, delta) => {
    // 1) Compute target Z from the piecewise station mapping
    const p = progressRef.current;
    const targetZ = progressToZ(p, segments.current);

    // Smooth follow (frame-rate independent damping)
    const k = 1 - Math.exp(-delta * 6);
    camera.position.z += (targetZ - camera.position.z) * k;
    cameraZRef.current = camera.position.z;

    // 2) Lerp drag offset for smooth look-around
    dragOffset.current.x += (dragOffsetTarget.current.x - dragOffset.current.x) * k;
    dragOffset.current.y += (dragOffsetTarget.current.y - dragOffset.current.y) * k;

    // When the user is not dragging, gently return to neutral
    if (!isDragging.current) {
      dragOffsetTarget.current.x *= 1 - delta * 0.6;
      dragOffsetTarget.current.y *= 1 - delta * 0.6;
    }

    // 3) Subtle floating bob (sin of time)
    const t = performance.now() * 0.001;
    const bobY = Math.sin(t * 0.5) * 0.08;
    const bobX = Math.cos(t * 0.35) * 0.05;

    camera.position.x = bobX + dragOffset.current.x * 6;
    camera.position.y = bobY + dragOffset.current.y * 4;

    // Keep the camera looking forward, slightly biased by the drag
    camera.lookAt(
      dragOffset.current.x * 4,
      dragOffset.current.y * 3,
      camera.position.z - 10
    );
  });

  return null;
}
