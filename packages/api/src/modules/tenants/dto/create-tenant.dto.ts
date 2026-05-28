import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsIn,
  ValidateNested,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/** Horário de funcionamento por dia da semana (0=domingo … 6=sábado). */
export class ScheduleInput {
  @ApiProperty() @IsInt() @Min(0) @Max(6) day!: number
  @ApiProperty() @IsString() start!: string
  @ApiProperty() @IsString() end!: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean
}

/** Profissional inicial criado no onboarding. */
export class ProfessionalInput {
  @ApiProperty() @IsString() name!: string
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() commission?: number
}

/** Serviço inicial criado no onboarding. */
export class ServiceInput {
  @ApiProperty() @IsString() name!: string
  @ApiProperty() @IsNumber() price!: number
  @ApiProperty() @IsInt() duration!: number
}

/**
 * Body do onboarding (POST /tenants). Cria a barbearia + vincula o usuário
 * autenticado como `owner`. Usado principalmente pelo mobile-gestor (signup
 * mobile-first via Supabase), espelhando o onboarding web (Next /api/tenants).
 */
export class CreateTenantDto {
  @ApiProperty() @IsString() name!: string

  @ApiPropertyOptional({ default: 'barbershop' })
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string

  @ApiPropertyOptional({ enum: ['FREE', 'STARTER', 'PRO', 'PREMIUM'], default: 'FREE' })
  @IsOptional()
  @IsIn(['FREE', 'STARTER', 'PRO', 'PREMIUM'])
  plan?: 'FREE' | 'STARTER' | 'PRO' | 'PREMIUM'

  @ApiPropertyOptional({ type: [ScheduleInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleInput)
  schedules?: ScheduleInput[]

  @ApiPropertyOptional({ type: [ProfessionalInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalInput)
  professionals?: ProfessionalInput[]

  @ApiPropertyOptional({ type: [ServiceInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceInput)
  services?: ServiceInput[]
}
