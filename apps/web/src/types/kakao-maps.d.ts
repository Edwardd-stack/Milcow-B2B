/**
 * Minimal types for the parts of the Kakao Maps JS SDK we use.
 * The SDK is a <script> (window.kakao), not an npm package, so we describe it ourselves.
 */
declare global {
  namespace kakao.maps {
    function load(callback: () => void): void;

    class LatLng {
      constructor(lat: number, lng: number);
    }
    class LatLngBounds {
      extend(latlng: LatLng): void;
    }
    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level: number });
      setBounds(
        bounds: LatLngBounds,
        paddingTop?: number,
        paddingRight?: number,
        paddingBottom?: number,
        paddingLeft?: number,
      ): void;
      setZoomable(zoomable: boolean): void;
      panTo(latlng: LatLng): void;
      setLevel(
        level: number,
        options?: { animate?: boolean | { duration: number }; anchor?: LatLng },
      ): void;
      getLevel(): number;
      relayout(): void;
      addControl(control: ZoomControl, position: number): void;
    }
    class CustomOverlay {
      constructor(options: {
        position: LatLng;
        content: HTMLElement | string;
        map?: Map | null;
        yAnchor?: number;
        zIndex?: number;
        clickable?: boolean;
      });
      setMap(map: Map | null): void;
      setZIndex(zIndex: number): void;
    }
    class ZoomControl {}
    namespace event {
      function addListener(target: Map, type: 'idle' | 'zoom_changed', handler: () => void): void;
      function removeListener(
        target: Map,
        type: 'idle' | 'zoom_changed',
        handler: () => void,
      ): void;
    }
    namespace ControlPosition {
      const RIGHT: number;
    }
  }

  interface Window {
    kakao?: typeof kakao;
  }
}

export {};
