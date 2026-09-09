const GDRIVE_FOLDER_ID = '1BvuFPagt4DOzgpuz9oO6A5uPj9Qk20AV';
const GDRIVE_API_KEY = (import.meta as any).env?.VITE_GDRIVE_API_KEY || '';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  webContentLink?: string;
  webViewLink?: string;
  createdTime: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
}

export async function listDriveFiles(
  folderId: string = GDRIVE_FOLDER_ID,
  apiKey: string = GDRIVE_API_KEY
): Promise<DriveFile[]> {
  if (!apiKey) {
    console.warn('[GDrive] No API key configured, using offline mode');
    return [];
  }

  const query = `'${folderId}' in parents and trashed = false`;
  const fields = 'files(id,name,mimeType,size,webContentLink,webViewLink,createdTime)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${apiKey}&orderBy=name`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

export async function getAudioFilesFromDrive(
  folderId: string = GDRIVE_FOLDER_ID,
  apiKey: string = GDRIVE_API_KEY
): Promise<DriveFile[]> {
  const allFiles = await listDriveFiles(folderId, apiKey);
  const audioMimes = ['audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/wav', 'audio/flac', 'audio/mp4'];
  return allFiles.filter(f => audioMimes.includes(f.mimeType) || /\.(mp3|ogg|aac|wav|flac|m4a)$/i.test(f.name));
}

export function getDownloadUrl(fileId: string, apiKey: string = GDRIVE_API_KEY): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
}

export async function uploadToDrive(
  file: File,
  folderId: string = GDRIVE_FOLDER_ID,
  onProgress?: (percent: number) => void
): Promise<DriveFile> {
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${GDRIVE_API_KEY}`,
    { method: 'POST', body: form }
  );

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export function buildGDrivePublicUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
