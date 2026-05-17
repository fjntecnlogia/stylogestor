import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AppointmentStatus } from '@prisma/client'

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string
}
