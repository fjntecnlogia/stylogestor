import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ResetPasswordDto {
  @ApiProperty({ minLength: 8, description: 'Nova senha do profissional' })
  @IsString()
  @MinLength(8)
  password: string
}
