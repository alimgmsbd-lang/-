import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { FullAppBackup } from './pdfGenerator';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache (MANDATORY per workspace integration rules)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const signInGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogleDrive = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentDriveUser = (): User | null => {
  return auth.currentUser;
};

const BACKUP_FILE_NAME = 'hisab_khata_backup.json';

/**
 * Searches for existing backup file in Google Drive created by this app
 */
async function findBackupFileId(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Drive list error: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Saves or updates application backup in Google Drive
 */
export async function saveBackupToGoogleDrive(
  backupData: FullAppBackup
): Promise<{ success: boolean; fileId: string; modifiedTime: string }> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive এ সাইন-ইন করা নেই');
  }

  const jsonContent = JSON.stringify(backupData, null, 2);
  const existingFileId = await findBackupFileId(token);

  if (existingFileId) {
    // Update existing file content
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonContent,
      }
    );

    if (!res.ok) {
      throw new Error(`Drive update error: ${res.statusText}`);
    }

    const updated = await res.json();
    return {
      success: true,
      fileId: existingFileId,
      modifiedTime: updated.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Create new file via multipart upload
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: 'হিসাব খাতা অ্যাপের সংরক্ষিত স্বয়ংক্রিয় ব্যাকআপ ফাইল',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      throw new Error(`Drive create error: ${res.statusText}`);
    }

    const created = await res.json();
    return {
      success: true,
      fileId: created.id,
      modifiedTime: created.modifiedTime || new Date().toISOString(),
    };
  }
}

/**
 * Loads latest backup from Google Drive
 */
export async function loadBackupFromGoogleDrive(): Promise<FullAppBackup | null> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive এ সাইন-ইন করা নেই');
  }

  const existingFileId = await findBackupFileId(token);
  if (!existingFileId) {
    return null;
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Drive read error: ${res.statusText}`);
  }

  const data = await res.json();
  return data as FullAppBackup;
}
