import { IsString, IsOptional, IsNumber } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateAppointmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalPrice?: number
}
