'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import truckRoutes from '@/data/truck-routes.json';
import fleetPoints from '@/data/fleet-points.json';
import { hasKakaoKey, loadKakaoMaps } from '@/lib/kakao-map';

type LatLng = [number, number];
interface End {
  lat: number;
  lng: number;
  label: string;
  color: string;
}

/** The road this lot travelled (farm → warehouse); falls back to a straight line */
function routeBetween(a: End, b: End): LatLng[] {
  const near = (p: { lat: number; lng: number }, q: End) =>
    Math.abs(p.lat - q.lat) < 0.02 && Math.abs(p.lng - q.lng) < 0.02;
  const pts = fleetPoints.points as Record<string, { lat: number; lng: number }>;
  const route = truckRoutes.routes.find((r) => near(pts[r.from]!, a) && near(pts[r.to]!, b));
  return (
    (route?.path as LatLng[] | undefined) ?? [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ]
  );
}

/** Small static Kakao map: farm (green) → warehouse (blue) with the road between them */
export function RouteMiniMap({ from, to }: { from: End; to: End }) {
  const t = useTranslations('Map');
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasKakaoKey) return;
    let cancelled = false;
    loadKakaoMaps()
      .then((k) => {
        if (cancelled) return;
        const map = new k.maps.Map(el, {
          center: new k.maps.LatLng(from.lat, from.lng),
          level: 10,
        });
        map.setZoomable(false);
        const path = routeBetween(from, to).map(([lat, lng]) => new k.maps.LatLng(lat, lng));
        new k.maps.Polyline({
          path,
          map,
          strokeWeight: 5,
          strokeColor: '#2065ae',
          strokeOpacity: 0.85,
        });
        const bounds = new k.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        [from, to].forEach((end) => {
          const pin = document.createElement('div');
          pin.textContent = end.label.replace(/^Milcow\s*/, '');
          pin.style.cssText = `background:#fff;color:#11375f;border:2px solid ${end.color};font:600 11px/1 Poppins,"Noto Sans KR",sans-serif;padding:6px 9px;border-radius:999px;box-shadow:0 3px 10px rgba(17,55,95,.2);white-space:nowrap`;
          new k.maps.CustomOverlay({
            position: new k.maps.LatLng(end.lat, end.lng),
            content: pin,
            map,
            yAnchor: 1.3,
          });
        });
        map.setBounds(bounds, 40, 40, 40, 40);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [from, to]);

  if (!hasKakaoKey || failed) {
    return (
      <div className="grid h-full min-h-[220px] place-items-center bg-[#e3ecf8] text-sm text-muted">
        {t('loadError')}
      </div>
    );
  }
  return <div ref={ref} className="h-full min-h-[220px] w-full" />;
}
