// Upload de avatar (foto de perfil) pro Supabase Storage.
// Idêntico ao mobile-gestor. Mantemos arquivos separados pra evitar
// dependência cruzada entre apps.

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
    quality: 0.7,
    exif: false,
  }

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync(opts)

  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0]
}

export async function pickAndUploadAvatar(
  userId: string,
  source: 'camera' | 'library',
): Promise<string | null> {
  const asset = await pickImage(source)
  if (!asset) return null

  try {
    const response = await fetch(asset.uri)
    const arrayBuffer = await response.arrayBuffer()

    const ext = (asset.uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg').slice(0, 4)
    const fileName = `${userId}/avatar.${ext}`
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'

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

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`

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

export async function removeAvatar(userId: string): Promise<boolean> {
  try {
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
