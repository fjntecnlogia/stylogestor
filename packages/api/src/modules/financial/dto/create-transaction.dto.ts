import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PaymentMethod, TransactionType } from '@prisma/client'

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty()
  @IsNumber()
  amount: number

  @ApiProperty()
  @IsDateString()
  date: string

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string
}
