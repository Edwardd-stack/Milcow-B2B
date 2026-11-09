import type { FarmCertification } from '../enums';
import type { LocalizedText } from './common.type';

/** GET /farms — also used as markers on Kakao Map */
export interface FarmInfo {
  id: string;
  farmName: LocalizedText;
  farmDesc: LocalizedText | null;
  farmAddress: string;
  farmLat: number;
  farmLng: number;
  farmCowCount: number | null;
  farmDailyCapacityTon: number | null;
  farmCertifications: FarmCertification[];
  farmImages: string[];
}

/** Short form embedded in other responses (e.g. a product's origin farm) */
export type FarmSummary = Pick<FarmInfo, 'id' | 'farmName' | 'farmAddress'>;
