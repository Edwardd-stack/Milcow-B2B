'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { FarmInfo, Locale, WarehouseInfo } from '@milcow/shared';
import { hasKakaoKey, loadKakaoMaps } from '@/lib/kakao-map';

export type PlaceKind = 'farm' | 'warehouse';

interface MilcowMapProps {
  farms: FarmInfo[];
  warehouses: WarehouseInfo[];
  className?: string;
  /** "always": name pill always visible · "hover": only the dot, name appears on hover */
  labelMode?: 'always' | 'hover';
  /** Only these points decide the initial zoom (default: all) — e.g. zoom into the capital area */
  fitFilter?: (lat: number, lng: number) => boolean;
  /** Space kept free around the markers on the first fit (e.g. a panel over the left side) */
  fitPadding?: { top: number; right: number; bottom: number; left: number };
  /** Interactive mode (/map page): the selected place is highlighted and the map flies to it */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Show only one kind of marker */
  kindFilter?: PlaceKind | 'all';
}

interface Marker {
  overlay: kakao.maps.CustomOverlay;
  root: HTMLElement;
  position: kakao.maps.LatLng;
  kind: PlaceKind;
}

const FLY_LEVEL = 7; // zoom level when flying to a selected place (smaller = closer)

/**
 * Kakao Map with our farms (green) and warehouses (blue).
 * Markers are CustomOverlays — plain DOM elements, so they can use our own design.
 * The map and markers are built once; selection and filters only restyle / show / hide them.
 */
export function MilcowMap({
  farms,
  warehouses,
  className = '',
  labelMode = 'always',
  fitFilter,
  fitPadding = { top: 60, right: 60, bottom: 60, left: 60 },
  selectedId = null,
  onSelect,
  kindFilter = 'all',
}: MilcowMapProps) {
  const t = useTranslations('Map');
  const locale = useLocale() as Locale;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Latest callback without rebuilding the map when the parent re-renders
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  const { top, right, bottom, left } = fitPadding;

  // 1) Build the map + markers
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasKakaoKey) return;
    let cancelled = false;
    const markers = markersRef.current;

    loadKakaoMaps()
      .then((k) => {
        if (cancelled) return;
        const map = new k.maps.Map(container, {
          center: new k.maps.LatLng(36.4, 127.8), // middle of South Korea
          level: 13,
        });
        map.addControl(new k.maps.ZoomControl(), k.maps.ControlPosition.RIGHT);
        mapRef.current = map;

        const bounds = new k.maps.LatLngBounds();
        const add = (id: string, lat: number, lng: number, label: string, kind: PlaceKind) => {
          const position = new k.maps.LatLng(lat, lng);
          if (!fitFilter || fitFilter(lat, lng)) bounds.extend(position);
          const root = markerElement(label, kind, labelMode, () => onSelectRef.current?.(id));
          const overlay = new k.maps.CustomOverlay({ position, content: root, map, yAnchor: 1 });
          markers.set(id, { overlay, root, position, kind });
        };
        farms.forEach((f) => add(f.id, f.farmLat, f.farmLng, f.farmName[locale], 'farm'));
        warehouses.forEach((w) =>
          add(w.id, w.warehouseLat, w.warehouseLng, w.warehouseName[locale], 'warehouse'),
        );

        // Zoom so every marker is visible, with room for the labels (and any panel)
        if (farms.length + warehouses.length > 0) map.setBounds(bounds, top, right, bottom, left);
        setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      markers.forEach((m) => m.overlay.setMap(null));
      markers.clear();
      mapRef.current = null;
      setReady(false);
    };
  }, [farms, warehouses, locale, labelMode, fitFilter, top, right, bottom, left]);

  // 2) Filter by kind; when the filter changes, zoom to the markers that stay visible
  const fittedFilter = useRef(kindFilter);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const bounds = new kakao.maps.LatLngBounds();
    let shown = 0;
    markersRef.current.forEach((m) => {
      const on = kindFilter === 'all' || kindFilter === m.kind;
      m.overlay.setMap(on ? map : null);
      if (on) {
        bounds.extend(m.position);
        shown++;
      }
    });
    if (fittedFilter.current !== kindFilter && shown > 0) {
      map.setBounds(bounds, top, right, bottom, left);
    }
    fittedFilter.current = kindFilter;
  }, [ready, kindFilter, top, right, bottom, left]);

  // 3) Highlight the selected place and fly to it
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    markersRef.current.forEach((m, id) => {
      const on = id === selectedId;
      setHighlight(m.root, on);
      m.overlay.setZIndex(on ? 20 : 1);
    });
    const selected = selectedId ? markersRef.current.get(selectedId) : undefined;
    if (!selected) return;
    // Zoom in around the marker first, then glide it to the centre once the zoom settles
    // (running both animations at once makes Kakao drop the pan)
    if (map.getLevel() <= FLY_LEVEL) {
      map.panTo(selected.position);
      return;
    }
    const pan = () => {
      kakao.maps.event.removeListener(map, 'idle', pan);
      map.panTo(selected.position);
    };
    kakao.maps.event.addListener(map, 'idle', pan);
    map.setLevel(FLY_LEVEL, { anchor: selected.position, animate: { duration: 300 } });
    return () => kakao.maps.event.removeListener(map, 'idle', pan);
  }, [ready, selectedId]);

  if (!hasKakaoKey || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#e3ecf8] p-8 text-center text-muted ${className}`}
      >
        {hasKakaoKey ? t('loadError') : t('noKey')}
      </div>
    );
  }
  return (
    <div ref={containerRef} className={className} role="application" aria-label={t('ariaLabel')} />
  );
}

/** A pin with a label: round coloured dot + white pill (built as DOM, not HTML strings → no XSS) */
function markerElement(
  label: string,
  kind: PlaceKind,
  labelMode: 'always' | 'hover',
  onClick: () => void,
): HTMLElement {
  const color = kind === 'farm' ? '#4f9a3a' : '#2065ae';
  const root = document.createElement('div');
  root.dataset.color = color;
  root.style.cssText =
    'display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);cursor:pointer';

  const pill = document.createElement('div');
  pill.textContent = label;
  pill.style.cssText = `background:#fff;color:#11375f;font:600 12px/1 Poppins,"Noto Sans KR",sans-serif;padding:7px 10px;border-radius:999px;box-shadow:0 4px 14px rgba(17,55,95,.18);white-space:nowrap;border:2px solid ${color};transition:background .2s,color .2s`;

  const dot = document.createElement('div');
  dot.style.cssText = `width:14px;height:14px;margin-top:4px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .2s`;

  root.append(pill, dot);
  root.tabIndex = 0;
  root.setAttribute('role', 'button');
  root.setAttribute('aria-label', label);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });

  if (labelMode === 'hover') {
    // Only the dot is visible; the name shows on hover / keyboard focus / selection
    pill.style.visibility = 'hidden';
    dot.style.width = dot.style.height = '18px';
    const show = (visible: boolean) => {
      if (root.dataset.selected === 'true') return; // a selected marker keeps its label
      pill.style.visibility = visible ? 'visible' : 'hidden';
      if (root.parentElement) root.parentElement.style.zIndex = visible ? '10' : '';
    };
    root.addEventListener('mouseenter', () => show(true));
    root.addEventListener('mouseleave', () => show(false));
    root.addEventListener('focus', () => show(true));
    root.addEventListener('blur', () => show(false));
  }
  return root;
}

/** Selected marker: filled pill + bigger dot, label always visible */
function setHighlight(root: HTMLElement, on: boolean) {
  const [pill, dot] = root.children as unknown as [HTMLElement, HTMLElement];
  const color = root.dataset.color ?? '#2065ae';
  root.dataset.selected = String(on);
  pill.style.background = on ? color : '#fff';
  pill.style.color = on ? '#fff' : '#11375f';
  if (on) pill.style.visibility = 'visible';
  else if (root.getAttribute('aria-label') && dot.style.width === '18px')
    pill.style.visibility = 'hidden';
  dot.style.transform = on ? 'scale(1.35)' : '';
}
