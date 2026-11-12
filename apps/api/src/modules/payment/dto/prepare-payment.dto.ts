import { IsUUID } from 'class-validator';

export class PreparePaymentDto {
  /** A PENDING order of the buyer */
  @IsUUID()
  orderId: string;
}
