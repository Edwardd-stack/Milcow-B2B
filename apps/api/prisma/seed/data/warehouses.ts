import type { LocalizedText } from '@milcow/shared';

export interface WarehouseSeed {
  key: string; // used by other seed files to reference this warehouse
  name: LocalizedText;
  address: string;
  lat: number;
  lng: number;
  capacityTon: number;
  tempC: number;
  openTime: string;
  closeTime: string;
}

// Fictional Milcow facilities in real Korean logistics areas
export const WAREHOUSES: WarehouseSeed[] = [
  {
    key: 'icheon',
    name: {
      ko: 'Milcow 이천 콜드체인 센터',
      en: 'Milcow Icheon Cold-Chain Center',
      uz: 'Milcow Ichxon sovuq zanjir markazi',
    },
    address: '경기도 이천시 마장면',
    lat: 37.2449,
    lng: 127.372,
    capacityTon: 1200,
    tempC: 3,
    openTime: '08:00',
    closeTime: '18:00',
  },
  {
    key: 'pyeongtaek',
    name: {
      ko: 'Milcow 평택 물류센터',
      en: 'Milcow Pyeongtaek Logistics Center',
      uz: 'Milcow Pxyontek logistika markazi',
    },
    address: '경기도 평택시 포승읍',
    lat: 36.9649,
    lng: 126.8378,
    capacityTon: 900,
    tempC: 3.5,
    openTime: '08:00',
    closeTime: '18:00',
  },
  {
    key: 'gimhae',
    name: {
      ko: 'Milcow 김해 남부센터',
      en: 'Milcow Gimhae Southern Center',
      uz: 'Milcow Gimxe janubiy markazi',
    },
    address: '경상남도 김해시 주촌면',
    lat: 35.247,
    lng: 128.837,
    capacityTon: 700,
    tempC: 4,
    openTime: '09:00',
    closeTime: '17:00',
  },
];
