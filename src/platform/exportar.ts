/** Sacar un archivo de texto de la app: en web se descarga; en el móvil, la hoja de compartir. */
import { Platform, Share } from 'react-native';

export async function exportText(filename: string, text: string, mime = 'text/csv'): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      // BOM para que Excel lea bien las tildes.
      const blob = new Blob(['﻿' + text], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch {
      return false;
    }
  }
  try {
    const r = await Share.share({ title: filename, message: text });
    return r.action === Share.sharedAction;
  } catch {
    return false;
  }
}
