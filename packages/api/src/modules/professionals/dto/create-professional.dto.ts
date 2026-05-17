import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateProfessionalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @ApiPropertyOptional({ default: 'barber' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string

  @ApiPropertyOptional({ description: '% de comissão (0-100) ou valor fixo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  commission?: number

  @ApiPropertyOptional({ enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  commissionType?: 'percentage' | 'fixed'

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string
}
