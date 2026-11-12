/** Public JS key, restricted by domain in Kakao Developers (safe to expose to the browser) */
const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

let loading: Promise<typeof kakao> | null = null;

export const hasKakaoKey = Boolean(APP_KEY);

/**
 * Loads the Kakao Maps SDK once per page, no matter how many maps ask for it.
 * autoload=false + kakao.maps.load(): the SDK script finishes loading its own parts before we use it.
 */
export function loadKakaoMaps(): Promise<typeof kakao> {
  if (!APP_KEY) return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY is not set'));
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao!.maps.load(() => resolve(window.kakao!));
    script.onerror = () => {
      loading = null; // allow a retry later
      reject(new Error('Kakao Maps SDK failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
