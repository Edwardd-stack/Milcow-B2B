import type { FarmInfo, FarmSummary } from '@milcow/shared';
import type { Farm } from '../../generated/prisma/client';
import {
  toLocalizedText,
  toLocalizedTextOrNull,
  toNumberOrNull,
} from '../../libs/utils/convert.util';

export function toFarmInfo(farm: Farm): FarmInfo {
  return {
    id: farm.id,
    farmName: toLocalizedText(farm.farmName),
    farmDesc: toLocalizedTextOrNull(farm.farmDesc),
    farmAddress: farm.farmAddress,
    farmLat: farm.farmLat,
    farmLng: farm.farmLng,
    farmCowCount: farm.farmCowCount,
    farmDailyCapacityTon: toNumberOrNull(farm.farmDailyCapacityTon),
    farmCertifications: farm.farmCertifications,
    farmImages: farm.farmImages,
  };
}

export function toFarmSummary(farm: Farm): FarmSummary {
  return { id: farm.id, farmName: toLocalizedText(farm.farmName), farmAddress: farm.farmAddress };
}
