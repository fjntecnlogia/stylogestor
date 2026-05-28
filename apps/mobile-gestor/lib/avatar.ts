// Upload de avatar (foto de perfil) pro Supabase Storage.
//
// Requer:
// 1. Bucket "avatars" criado no Supabase Storage (público)
// 2. Política RLS permitindo INSERT/UPDATE/SELECT pelo proprio user:
//    CREATE POLICY "Users can upload own avatar"
//      ON storage.objects FOR INSERT TO authenticated
//      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
//
// Estrutura de arquivos: avatars/{user_id}/avatar.jpg

import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import { supabase } from './supabase'

const BUCKET = 'avatars'

async function ensurePermission(source: 'camera' | 'library'): Promise<boolean> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar a foto.')
      return false
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para escolher uma foto.')
      return false
    }
  }
  return true
}

async function pickImage(source: 'camera' | 'library'): Promise<ImagePicker.ImagePickerAsset | null> {
  if (!(await ensurePermission(source))) return null

  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,            // 70% — equilibrio entre tamanho e qualidade
    exif: false,             // não vaza metadados
  }

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync(opts)

  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0]
}

/**
 * Faz upload de uma foto pra Supabase Storage e atualiza user_metadata.avatar_url.
 * Retorna a URL pública ou null em caso de erro/cancelamento.
 */
export async function pickAndUploadAvatar(
  userId: string,
  source: 'camera' | 'library',
): Promise<string | null> {
  const asset = await pickImage(source)
  if (!asset) return null

  try {
    // 1) Lê o arquivo como ArrayBuffer (React Native compatível)
    const response = await fetch(asset.uri)
    const arrayBuffer = await response.arrayBuffer()

    // 2) Detecta extensão (default jpg)
    const ext = (asset.uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg').slice(0, 4)
    const fileName = `${userId}/avatar.${ext}`
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'

    // 3) Upload (upsert sobrescreve avatar anterior)
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: true,
      })

    if (uploadErr) {
      console.warn('[avatar] upload error:', uploadErr)
      Alert.alert('Erro no upload', uploadErr.message)
      return null
    }

    // 4) Pega URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}` // cache-busting

    // 5) Atualiza user_metadata.avatar_url
    const { error: updateErr } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })

    if (updateErr) {
      console.warn('[avatar] updateUser error:', updateErr)
      Alert.alert('Erro', 'Foto salva mas não foi possível atualizar o perfil.')
      return null
    }

    return publicUrl
  } catch (err) {
    console.error('[avatar] unexpected:', err)
    Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.')
    return null
  }
}

/**
 * Remove avatar atual (deleta do storage + limpa user_metadata.avatar_url).
 */
export async function removeAvatar(userId: string): Promise<boolean> {
  try {
    // Deleta todas as variantes (.jpg, .png)
    await supabase.storage.from(BUCKET).remove([
      `${userId}/avatar.jpg`,
      `${userId}/avatar.jpeg`,
      `${userId}/avatar.png`,
    ])

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    })

    if (error) {
      Alert.alert('Erro', 'Não foi possível remover a foto.')
      return false
    }
    return true
  } catch {
    Alert.alert('Erro', 'Não foi possível remover a foto.')
    return false
  }
}
