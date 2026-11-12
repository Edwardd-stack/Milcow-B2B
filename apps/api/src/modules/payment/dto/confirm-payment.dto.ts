import { IsInt, IsString, MaxLength, Min } from 'class-validator';

/** The values Toss puts into the successUrl query string */
export class ConfirmPaymentDto {
  @IsString()
  @MaxLength(200)
  paymentKey: string;

  /** Toss calls it `orderId` — our paymentTossOrderId */
  @IsString()
  @MaxLength(64)
  tossOrderId: string;

  @IsInt()
  @Min(1)
  amount: number;
}
