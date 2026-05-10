import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] }) @IsEnum(['INCOME', 'EXPENSE']) type: 'INCOME' | 'EXPENSE'
  @ApiProperty() @IsString() @IsNotEmpty() category: string
  @ApiProperty() @IsString() @IsNotEmpty() description: string
  @ApiProperty() @IsNumber() amount: number
  @ApiProperty() @IsDateString() date: string
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
}
