'use client';

import { useEffect, useRef } from 'react';
import {
  routePath,
  truckStateAt,
  type TruckDay,
  type TruckKind,
  type TruckPhase,
  type TruckState,
} from '@/lib/fleet/fleet-sim';

export interface FleetLayerOptions {
  days: TruckDay[];
  /** Simulation clock (epoch ms) — read every frame */
  now: () => number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Keep the selected truck centred */
  follow: boolean;
  onFollowStop: () => void;
}

export const PHASE_COLOR: Record<TruckPhase, string> = {
  DRIVING: '#2065ae',
  RETURNING: '#6b8fb8',
  LOADING: '#e08a1e',
  UNLOADING: '#e08a1e',
  IDLE: '#9aa5b1',
  OFF: '#9aa5b1',
};

const FRAME_MS = 100; // position updates ~10× per second are smooth enough for map scale
const FOLLOW_MS = 1000;

interface TruckMarker {
  overlay: kakao.maps.CustomOverlay;
  root: HTMLElement;
  arrow: HTMLElement;
  phase: TruckPhase | null;
}

/**
 * Draws the simulated trucks on a Kakao map and moves them with requestAnimationFrame.
 * Overlays are created once per day plan; each frame only calls setPosition (no React re-render).
 */
export function useFleetLayer(
  mapRef: React.RefObject<kakao.maps.Map | null>,
  ready: boolean,
  options: FleetLayerOptions | undefined,
) {
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });
  const days = options?.days;
  const selectedId = options?.selectedId ?? null;
  const markersRef = useRef(new Map<string, TruckMarker>());
  const statesRef = useRef(new Map<string, TruckState>());

  // 1) Overlays + animation loop
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !days) return;
    const markers = markersRef.current;

    days.forEach((day) => {
      const { root, arrow } = truckElement(day.spec.kind, day.spec.id, () =>
        optsRef.current?.onSelect(day.spec.id),
      );
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(0, 0),
        content: root,
        map,
        yAnchor: 0.5,
        zIndex: 5,
      });
      markers.set(day.spec.id, { overlay, root, arrow, phase: null });
    });

    let frame = 0;
    let last = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - last < FRAME_MS) return;
      last = time;
      const t = optsRef.current?.now() ?? Date.now();
      days.forEach((day) => {
        const state = truckStateAt(day, t);
        statesRef.current.set(day.spec.id, state);
        const m = markers.get(day.spec.id);
        if (!m) return;
        m.overlay.setPosition(new kakao.maps.LatLng(state.position[0], state.position[1]));
        if (m.phase !== state.phase) {
          m.phase = state.phase;
          m.root.style.setProperty('--truck', PHASE_COLOR[state.phase]);
          m.root.style.opacity = state.phase === 'OFF' ? '0.75' : '1';
        }
        const moving = state.phase === 'DRIVING' || state.phase === 'RETURNING';
        m.arrow.style.display = moving ? 'block' : 'none';
        if (moving) m.arrow.style.transform = `rotate(${state.heading}deg)`;
      });
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      markers.forEach((m) => m.overlay.setMap(null));
      markers.clear();
    };
  }, [mapRef, ready, days]);

  // 2) Selected truck: highlight, route line (done part darker), follow
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !days) return;
    markersRef.current.forEach((m, id) => {
      const on = id === selectedId;
      m.root.dataset.selected = String(on);
      m.overlay.setZIndex(on ? 30 : 5);
    });
    const day = days.find((d) => d.spec.id === selectedId);
    if (!day) return;

    const full = routePath(day.routeId).map(([lat, lng]) => new kakao.maps.LatLng(lat, lng));
    const route = new kakao.maps.Polyline({
      path: full,
      map,
      strokeWeight: 5,
      strokeColor: '#2065ae',
      strokeOpacity: 0.25,
    });
    const done = new kakao.maps.Polyline({
      path: [],
      map,
      strokeWeight: 5,
      strokeColor: '#2065ae',
      strokeOpacity: 0.9,
    });

    const stopFollow = () => optsRef.current?.onFollowStop();
    kakao.maps.event.addListener(map, 'dragstart', stopFollow);

    const update = () => {
      const state = statesRef.current.get(day.spec.id);
      if (!state) return;
      // The driven part of the current trip
      const driving = state.phase === 'DRIVING' || state.phase === 'RETURNING';
      const pts = routePath(day.routeId);
      const share = state.phase === 'RETURNING' ? 1 - state.progress : state.progress;
      const cut = Math.max(1, Math.round(share * (pts.length - 1)));
      const passed = state.phase === 'RETURNING' ? pts.slice(cut) : pts.slice(0, cut + 1);
      done.setPath(driving ? passed.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng)) : []);
      if (optsRef.current?.follow)
        map.panTo(new kakao.maps.LatLng(state.position[0], state.position[1]));
    };
    update();
    const timer = setInterval(update, FOLLOW_MS);

    return () => {
      clearInterval(timer);
      kakao.maps.event.removeListener(map, 'dragstart', stopFollow);
      route.setMap(null);
      done.setMap(null);
    };
  }, [mapRef, ready, days, selectedId]);
}

const ICON: Record<TruckKind, string> = {
  // tanker: round tank + cab
  TANKER:
    'M2 9.5h11.5a2.5 2.5 0 0 1 0 5H2zM15.5 10.5H19l2.5 3v1H15.5zM5.5 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  // box truck
  REEFER:
    'M2 7h12v8H2zM14 10h4l3 3v2h-7M5.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  SMALL_REEFER:
    'M3 8h10v7H3zM13 10.5h3.5l2.5 2.5v2h-6M6 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
};

/** Round truck marker (DOM, no HTML strings) + a small heading arrow while driving */
function truckElement(kind: TruckKind, id: string, onClick: () => void) {
  const root = document.createElement('button');
  root.type = 'button';
  root.setAttribute('aria-label', id);
  root.style.cssText =
    'position:relative;width:34px;height:34px;border-radius:50%;background:var(--truck,#2065ae);color:#fff;border:3px solid #fff;box-shadow:0 4px 12px rgba(17,55,95,.35);display:grid;place-items:center;cursor:pointer;transition:transform .2s,background .3s;padding:0';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.9');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICON[kind]);
  svg.append(path);

  // Heading arrow on a ring around the circle
  const arrow = document.createElement('span');
  arrow.style.cssText = 'position:absolute;inset:-9px;pointer-events:none;display:none';
  const tip = document.createElement('span');
  tip.style.cssText =
    'position:absolute;left:50%;top:0;margin-left:-5px;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid var(--truck,#2065ae)';
  arrow.append(tip);

  const label = document.createElement('span');
  label.textContent = id;
  label.style.cssText =
    'position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;background:#fff;color:#11375f;font:700 10px/1 Poppins,sans-serif;padding:3px 6px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.2);white-space:nowrap';

  root.append(svg, arrow, label);
  root.addEventListener('click', onClick);
  // Selected: bigger
  const observer = new MutationObserver(() => {
    root.style.transform = root.dataset.selected === 'true' ? 'scale(1.25)' : '';
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-selected'] });
  return { root, arrow };
}
