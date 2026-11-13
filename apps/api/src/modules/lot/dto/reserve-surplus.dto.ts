import { IsNumber, Min } from 'class-validator';
import type { ReserveSurplusInput } from '@milcow/shared';
import { SURPLUS_MIN_TON } from '../lot.constants';

export class ReserveSurplusDto implements ReserveSurplusInput {
  /** Tons, up to 1 decimal. @example 3 */
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(SURPLUS_MIN_TON)
  ton: number;
}
