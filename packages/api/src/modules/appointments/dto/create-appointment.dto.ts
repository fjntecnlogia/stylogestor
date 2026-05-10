import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAppointmentDto {
  @ApiProperty() @IsString() @IsNotEmpty() clientId: string
  @ApiProperty() @IsString() @IsNotEmpty() professionalId: string
  @ApiProperty() @IsString() @IsNotEmpty() startTime: string
  @ApiProperty() @IsString() @IsNotEmpty() endTime: string
  @ApiProperty() @IsArray() serviceIds: string[]
  @ApiProperty() @IsNumber() totalPrice: number
  @ApiProperty() @IsNumber() totalDuration: number
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string
}
