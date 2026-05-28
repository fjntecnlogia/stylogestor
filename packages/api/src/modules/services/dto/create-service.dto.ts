import { IsString, IsNotEmpty, IsNumber, IsInt, IsOptional, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateServiceDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string
  @ApiProperty() @IsNumber() @Min(0) price: number
  @ApiProperty({ description: 'Duração em minutos' }) @IsInt() @Min(1) duration: number
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string
  @ApiPropertyOptional() @IsOptional() @IsString() image?: string
}
