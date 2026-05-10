import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateClientDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string
  @ApiProperty() @IsString() @IsNotEmpty() phone: string
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthdate?: string
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string
}
