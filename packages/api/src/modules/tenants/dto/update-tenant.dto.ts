import { IsString, IsOptional, IsEmail, IsObject } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Prisma } from '@prisma/client'

export class UpdateTenantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string

  // Json fields: usar Prisma.InputJsonValue para compat com Prisma.Json.
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Prisma.InputJsonValue

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  address?: Prisma.InputJsonValue
}
