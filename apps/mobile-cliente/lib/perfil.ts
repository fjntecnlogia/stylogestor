// Perfil estendido do cliente: dados que NÃO ficam no Clerk (que só tem
// nome/email/telefone). Endereço, complemento, observações etc. ficam aqui
// no storage local. Quando backend real existir, sincronizar via API.

import { loadObject, saveObject } from './storage'

export type Perfil = {
  nome: string         // espelha do Clerk pra cache
  telefone: string
  endereco: string     // rua + número
  complemento: string  // apto, bloco
  bairro: string
  cidade: string
  estado: string       // UF
  cep: string
}

const KEY = 'perfil_cliente_v1'

const DEFAULT: Perfil = {
  nome: '',
  telefone: '',
  endereco: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
}

export async function loadPerfil(): Promise<Perfil> {
  return loadObject<Perfil>(KEY, DEFAULT)
}

export async function savePerfil(p: Partial<Perfil>): Promise<void> {
  const atual = await loadPerfil()
  await saveObject<Perfil>(KEY, { ...atual, ...p })
}
