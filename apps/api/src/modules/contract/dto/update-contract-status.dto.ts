import { IsIn } from 'class-validator';
import { ContractStatus } from '@milcow/shared';

export class UpdateContractStatusDto {
  /** @example "ACTIVE" */
  @IsIn(Object.values(ContractStatus))
  contractStatus: ContractStatus;
}
