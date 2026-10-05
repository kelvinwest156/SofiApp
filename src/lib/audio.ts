/**
 * audio.ts
 * After the phone records your voice it saves a sound file.
 * Gemini needs that file as "base64" text (a way of writing any file as letters and numbers),
 * so this helper reads the file and converts it.
 */
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

function mimeTypeFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'wav':
      return 'audio/wav';
    case 'mp3':
      return 'audio/mp3';
    case 'aac':
      return 'audio/aac';
    case 'webm':
      return 'audio/webm';
    case 'ogg':
      return 'audio/ogg';
    case 'caf':
    case 'm4a':
    case 'mp4':
    default:
      return 'audio/m4a'; // iPhone & Android recordings are .m4a by default
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function readRecording(uri: string): Promise<{ base64: string; mimeType: string }> {
  if (Platform.OS === 'web') {
    // In a browser the recording is a "blob:" link, so we fetch it instead.
    const blob = await (await fetch(uri)).blob();
    return { base64: await blobToBase64(blob), mimeType: (blob.type || 'audio/webm').split(';')[0] };
  }
  const base64 = await new File(uri).base64();
  return { base64, mimeType: mimeTypeFromUri(uri) };
}
