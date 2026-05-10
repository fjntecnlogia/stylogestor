import { IsString, IsOptional, IsEmail } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateTenantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string
  @ApiPropertyOptional() @IsOptional() settings?: Record<string, unknown>
  @ApiPropertyOptional() @IsOptional() address?: Record<string, unknown>
}
