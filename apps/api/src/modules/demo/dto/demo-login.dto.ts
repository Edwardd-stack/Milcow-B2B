import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { DemoRole } from '@milcow/shared';

export const DEMO_ROLES: DemoRole[] = ['BUYER', 'ADMIN', 'STAFF'];

export class DemoLoginDto {
  @ApiPropertyOptional({ enum: DEMO_ROLES, default: 'BUYER' })
  @IsOptional()
  @IsIn(DEMO_ROLES)
  role?: DemoRole;
}
