#!/usr/bin/env python3
"""Upload music files to Google Drive folder."""

import os
import sys
import json
from pathlib import Path
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ['https://www.googleapis.com/auth/drive.file']
FOLDER_ID = '1BvuFPagt4DOzgpuz9oO6A5uPj9Qk20AV'
TOKEN_FILE = os.path.expanduser('~/.config/via-lactea/gdrive_token.json')
CREDS_FILE = os.path.expanduser('~/.config/via-lactea/gdrive_credentials.json')
MUSIC_DIR = os.path.expanduser('~/Musica')

os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)

def authenticate():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDS_FILE):
                print(f"ERRO: Coloque o arquivo OAuth credentials em: {CREDS_FILE}")
                print("Baixe de: https://console.cloud.google.com/apis/credentials")
                print("Crie OAuth 2.0 Client ID > Desktop App > Download JSON")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
    return creds

def create_folder(service, name, parent_id):
    query = f"'{parent_id}' in parents and name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    results = service.files().list(q=query, fields='files(id)').execute()
    if results['files']:
        return results['files'][0]['id']
    meta = {'name': name, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [parent_id]}
    folder = service.files().list(q=query, fields='files(id)').execute()
    if folder['files']:
        return folder['files'][0]['id']
    file = service.files().create(body=meta, fields='id').execute()
    return file['id']

def upload_file(service, filepath, parent_id):
    name = os.path.basename(filepath)
    meta = {'name': name, 'parents': [parent_id]}
    media = MediaFileUpload(filepath, resumable=True, chunksize=10*1024*1024)
    try:
        file = service.files().create(body=meta, media_body=media, fields='id').execute()
        return file['id']
    except Exception as e:
        print(f"  ERRO: {e}")
        return None

def main():
    creds = authenticate()
    service = build('drive', 'v3', credentials=creds)

    music_dir = Path(MUSIC_DIR)
    if not music_dir.exists():
        print(f"Pasta não encontrada: {MUSIC_DIR}")
        sys.exit(1)

    audio_exts = {'.mp3', '.ogg', '.m4a', '.wav', '.flac', '.aac'}
    files = [f for f in music_dir.rglob('*') if f.suffix.lower() in audio_exts]
    total = len(files)
    print(f"Encontrados {total} arquivos de áudio em {MUSIC_DIR}")

    uploaded = 0
    failed = 0

    for i, filepath in enumerate(files, 1):
        rel_path = filepath.relative_to(music_dir)
        parts = list(rel_path.parts)

        parent_id = FOLDER_ID
        for part in parts[:-1]:
            parent_id = create_folder(service, part, parent_id)

        print(f"[{i}/{total}] {rel_path}", end=' ')
        result = upload_file(service, str(filepath), parent_id)
        if result:
            uploaded += 1
            print("OK")
        else:
            failed += 1

    print(f"\nConcluído: {uploaded} enviados, {failed} falhas")

if __name__ == '__main__':
    main()
