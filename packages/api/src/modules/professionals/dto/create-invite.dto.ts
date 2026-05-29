import { IsString, IsNotEmpty, IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Convite de barbeiro: o gestor já criou o Professional (via POST /professionals)
 * e agora gera o login dele. `professionalId` = o Professional a vincular.
 */
export class CreateInviteDto {
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() @IsNotEmpty() name: string
  @ApiProperty({ description: 'ID do Professional (já existente) a vincular ao login' })
  @IsString() @IsNotEmpty() professionalId: string
}
