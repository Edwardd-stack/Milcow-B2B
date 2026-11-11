'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { FarmInfo, Locale, WarehouseInfo } from '@milcow/shared';
import { FarmIcon, SnowflakeIcon } from '@/components/icons';
import { useFarms, useWarehouses } from '@/hooks/useLocations';
import { Link } from '@/i18n/navigation';
import { MilcowMap, type PlaceKind } from './MilcowMap';

type Place =
  | { kind: 'farm'; id: string; name: string; address: string; data: FarmInfo }
  | { kind: 'warehouse'; id: string; name: string; address: string; data: WarehouseInfo };

const PANEL_WIDTH = 360;

/** /map: Kakao Map full width, a floating panel with tabs + search + list; list ⇄ map are linked */
export function PlaceExplorer() {
  const t = useTranslations('MapPage');
  const locale = useLocale() as Locale;
  const farms = useFarms();
  const warehouses = useWarehouses();

  const [tab, setTab] = useState<PlaceKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const places = useMemo<Place[]>(
    () => [
      ...(warehouses.data ?? []).map((w) => ({
        kind: 'warehouse' as const,
        id: w.id,
        name: w.warehouseName[locale],
        address: w.warehouseAddress,
        data: w,
      })),
      ...(farms.data ?? []).map((f) => ({
        kind: 'farm' as const,
        id: f.id,
        name: f.farmName[locale],
        address: f.farmAddress,
        data: f,
      })),
    ],
    [farms.data, warehouses.data, locale],
  );

  const q = query.trim().toLowerCase();
  const visible = places.filter(
    (p) =>
      (tab === 'all' || p.kind === tab) &&
      (!q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)),
  );
  const count = (kind: PlaceKind) => places.filter((p) => p.kind === kind).length;

  // A marker clicked on the map → bring its row into view in the list
  useEffect(() => {
    const item = selectedId ? itemRefs.current.get(selectedId) : undefined;
    const list = item?.parentElement;
    if (!item || !list) return;
    // Scroll only the list (scrollIntoView would also move the page)
    const box = list.getBoundingClientRect();
    const row = item.getBoundingClientRect();
    if (row.top < box.top) list.scrollBy({ top: row.top - box.top - 8, behavior: 'smooth' });
    else if (row.bottom > box.bottom)
      list.scrollBy({ top: row.bottom - box.bottom + 8, behavior: 'smooth' });
  }, [selectedId]);

  const loading = farms.isPending || warehouses.isPending;
  const failed = farms.isError || warehouses.isError;

  // The panel covers the left side on wide screens → fit the markers into the visible part
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const fitPadding = useMemo(
    () => ({ top: 60, right: 70, bottom: 60, left: wide ? PANEL_WIDTH + 60 : 50 }),
    [wide],
  );

  const tabs: { key: PlaceKind | 'all'; count: number }[] = [
    { key: 'all', count: places.length },
    { key: 'farm', count: count('farm') },
    { key: 'warehouse', count: count('warehouse') },
  ];

  return (
    // White frame around the map, so the map's blue sea never touches the blue banner directly
    <div className="relative -mt-16 mb-24 rounded-[30px] bg-white p-2.5 shadow-[0_24px_60px_rgba(17,55,95,0.16)] ring-1 ring-[#11375f]/5 min-[100rem]:-mt-[calc(6.95vw-1rem)] lg:p-3">
      <div className="relative overflow-hidden rounded-[22px] lg:h-[min(696px,calc(100svh-164px))] lg:min-h-[540px]">
        {/* Map */}
        <div className="relative h-[420px] overflow-hidden rounded-[22px] lg:absolute lg:inset-0 lg:h-auto lg:rounded-none">
          {loading || failed ? (
            <div className="flex h-full items-center justify-center bg-[#e3ecf8] text-muted">
              {failed ? t('error') : t('loading')}
            </div>
          ) : (
            <MilcowMap
              farms={farms.data}
              warehouses={warehouses.data}
              labelMode="hover"
              fitPadding={fitPadding}
              selectedId={selectedId}
              onSelect={setSelectedId}
              kindFilter={tab}
              className="h-full w-full"
            />
          )}
          {/* Legend */}
          <div className="pointer-events-none absolute top-4 right-16 z-10 flex gap-2">
            {(['farm', 'warehouse'] as const).map((kind) => (
              <span
                key={kind}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-heading shadow-md"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${kind === 'farm' ? 'bg-[#4f9a3a]' : 'bg-brand'}`}
                />
                {t(`tabs.${kind}`)} {count(kind)}
              </span>
            ))}
          </div>
        </div>

        {/* Floating panel (below the map on phones) */}
        <section
          aria-label={t('panel')}
          className="relative z-10 flex flex-col px-2 pt-5 pb-2 lg:absolute lg:p-5 lg:top-5 lg:bottom-5 lg:left-5 lg:w-[360px] lg:rounded-3xl lg:bg-white/95 lg:shadow-[0_20px_40px_rgba(17,55,95,0.18)] lg:backdrop-blur"
        >
          <div role="tablist" aria-label={t('panel')} className="flex rounded-full bg-cream p-1">
            {tabs.map(({ key, count: n }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key);
                  // Drop a selection that the new tab hides
                  if (key !== 'all' && places.find((p) => p.id === selectedId)?.kind !== key)
                    setSelectedId(null);
                }}
                className="flex-1 rounded-full py-2 text-[13px] font-semibold text-muted transition aria-selected:bg-white aria-selected:text-brand aria-selected:shadow-[0_3px_10px_rgba(17,55,95,0.08)]"
              >
                {t(`tabs.${key}`)} {n}
              </button>
            ))}
          </div>

          <label className="my-3 flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12">
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] shrink-0 text-soft"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="sr-only">{t('search')}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-soft"
            />
          </label>

          <ul className="-mx-1 space-y-1.5 overflow-y-auto px-1 pb-1 lg:flex-1">
            {visible.map((place) => (
              <li
                key={place.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(place.id, el);
                  else itemRefs.current.delete(place.id);
                }}
              >
                <PlaceRow
                  place={place}
                  selected={place.id === selectedId}
                  onClick={() => setSelectedId(place.id === selectedId ? null : place.id)}
                />
              </li>
            ))}
            {!loading && visible.length === 0 && (
              <li className="py-10 text-center text-sm text-muted">{t('empty')}</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function PlaceRow({
  place,
  selected,
  onClick,
}: {
  place: Place;
  selected: boolean;
  onClick: () => void;
}) {
  const t = useTranslations('MapPage');
  const locale = useLocale() as Locale;
  const isFarm = place.kind === 'farm';

  const chips: { text: string; green?: boolean }[] = isFarm
    ? [
        ...place.data.farmCertifications.map((c) => ({ text: t(`cert.${c}`), green: true })),
        ...(place.data.farmCowCount
          ? [{ text: t('cows', { count: place.data.farmCowCount }) }]
          : []),
      ]
    : [
        ...(place.data.warehouseTempC !== null
          ? [{ text: `❄ ${place.data.warehouseTempC}°C` }]
          : []),
        { text: t('capacity', { ton: place.data.warehouseCapacityTon.toLocaleString(locale) }) },
      ];

  const hours =
    !isFarm && place.data.warehouseOpenTime && place.data.warehouseCloseTime
      ? `${place.data.warehouseOpenTime}–${place.data.warehouseCloseTime}`
      : null;
  const lat = isFarm ? place.data.farmLat : place.data.warehouseLat;
  const lng = isFarm ? place.data.farmLng : place.data.warehouseLng;

  return (
    <div
      className={`rounded-2xl transition ${selected ? 'bg-brand/[0.05] ring-[1.5px] ring-brand' : 'hover:bg-cream'}`}
    >
      <button
        type="button"
        aria-expanded={selected}
        onClick={onClick}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isFarm ? 'bg-[#e7f6ec] text-[#2f8f4e]' : 'bg-[#e6f0fc] text-brand'}`}
        >
          {isFarm ? <FarmIcon className="h-6 w-6" /> : <SnowflakeIcon className="h-6 w-6" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-heading">{place.name}</span>
          <span className="block truncate text-xs text-muted">
            {place.address}
            {hours && ` · ${hours}`}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip.text}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip.green ? 'bg-[#e7f6ec] text-[#2f8f4e]' : 'bg-cream text-brand'}`}
              >
                {chip.text}
              </span>
            ))}
          </span>
        </span>
      </button>

      {selected && (
        // Compact details, aligned with the text column (icon 44px + gap 12px + padding 12px)
        <div className="pr-3 pb-3 pl-[68px]">
          {isFarm && place.data.farmDesc && (
            <p className="mb-2 line-clamp-2 text-xs leading-snug text-muted">
              {place.data.farmDesc[locale]}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            {!isFarm && (
              <Link
                href={`/products?warehouses=${place.id}`}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy"
              >
                {t('products')}
              </Link>
            )}
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
            >
              {t('directions')} ↗
            </a>
            {isFarm && place.data.farmDailyCapacityTon && (
              <span className="ml-auto text-xs text-muted">
                {t('daily')} <b className="text-heading">{place.data.farmDailyCapacityTon} t</b>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
