import { Platform, Share } from 'react-native';

// Hands a text file to the grown-up: a download on the web, the share sheet
// on a phone (so it can be emailed or saved to Files).
export async function exportTextFile(fileName, text, mimeType = 'text/csv') {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
  try {
    await Share.share({ title: fileName, message: text });
    return true;
  } catch (e) {
    return false;
  }
}
