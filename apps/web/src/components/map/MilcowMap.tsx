'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { FarmInfo, Locale, WarehouseInfo } from '@milcow/shared';
import { hasKakaoKey, loadKakaoMaps } from '@/lib/kakao-map';

interface MilcowMapProps {
  farms: FarmInfo[];
  warehouses: WarehouseInfo[];
  className?: string;
  /** "always": name pill always visible · "hover": only the dot, name appears on hover */
  labelMode?: 'always' | 'hover';
  /** Only these points decide the initial zoom (default: all) — e.g. zoom into the capital area */
  fitFilter?: (lat: number, lng: number) => boolean;
}

/**
 * Kakao Map with our farms (green) and warehouses (blue).
 * Markers are CustomOverlays — plain DOM elements, so they can use our own design.
 */
export function MilcowMap({
  farms,
  warehouses,
  className = '',
  labelMode = 'always',
  fitFilter,
}: MilcowMapProps) {
  const t = useTranslations('Map');
  const locale = useLocale() as Locale;
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasKakaoKey) return;
    let cancelled = false;
    const overlays: kakao.maps.CustomOverlay[] = [];

    loadKakaoMaps()
      .then((k) => {
        if (cancelled) return;
        const map = new k.maps.Map(container, {
          center: new k.maps.LatLng(36.4, 127.8), // middle of South Korea
          level: 13,
        });
        map.addControl(new k.maps.ZoomControl(), k.maps.ControlPosition.RIGHT);

        const bounds = new k.maps.LatLngBounds();
        const add = (lat: number, lng: number, label: string, kind: 'farm' | 'warehouse') => {
          const position = new k.maps.LatLng(lat, lng);
          if (!fitFilter || fitFilter(lat, lng)) bounds.extend(position);
          overlays.push(
            new k.maps.CustomOverlay({
              position,
              content: markerElement(label, kind, labelMode),
              map,
              yAnchor: 1,
            }),
          );
        };
        farms.forEach((f) => add(f.farmLat, f.farmLng, f.farmName[locale], 'farm'));
        warehouses.forEach((w) =>
          add(w.warehouseLat, w.warehouseLng, w.warehouseName[locale], 'warehouse'),
        );

        // Zoom so every marker is visible, with room for the labels
        if (farms.length + warehouses.length > 0) map.setBounds(bounds, 60, 60, 60, 60);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      overlays.forEach((o) => o.setMap(null));
    };
  }, [farms, warehouses, locale, labelMode, fitFilter]);

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
  kind: 'farm' | 'warehouse',
  labelMode: 'always' | 'hover',
): HTMLElement {
  const color = kind === 'farm' ? '#4f9a3a' : '#2065ae';
  const root = document.createElement('div');
  root.style.cssText =
    'display:flex;flex-direction:column;align-items:center;transform:translateY(-2px)';

  const pill = document.createElement('div');
  pill.textContent = label;
  pill.style.cssText = `background:#fff;color:#11375f;font:600 12px/1 Poppins,"Noto Sans KR",sans-serif;padding:7px 10px;border-radius:999px;box-shadow:0 4px 14px rgba(17,55,95,.18);white-space:nowrap;border:2px solid ${color}`;

  const dot = document.createElement('div');
  dot.style.cssText = `width:14px;height:14px;margin-top:4px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)`;

  root.append(pill, dot);

  if (labelMode === 'hover') {
    // Only the dot is visible; the name shows on hover (and on keyboard focus)
    pill.style.visibility = 'hidden';
    dot.style.width = dot.style.height = '18px';
    dot.style.cursor = 'pointer';
    root.tabIndex = 0;
    root.setAttribute('aria-label', label);
    const show = (visible: boolean) => {
      pill.style.visibility = visible ? 'visible' : 'hidden';
      // bring the hovered marker above its neighbours
      if (root.parentElement) root.parentElement.style.zIndex = visible ? '10' : '';
    };
    root.addEventListener('mouseenter', () => show(true));
    root.addEventListener('mouseleave', () => show(false));
    root.addEventListener('focus', () => show(true));
    root.addEventListener('blur', () => show(false));
  }
  return root;
}
