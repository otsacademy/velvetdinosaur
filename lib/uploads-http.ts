import { withStatus } from './uploads-errors';

export async function putObjectWithProgress({
  file,
  uploadUrl,
  contentType,
  signal,
  onProgress
}: {
  file: File;
  uploadUrl: string;
  contentType: string;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<{ etag?: string | null }> {
  if (signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  onProgress?.(0);

  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined') {
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
      signal
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }
    onProgress?.(100);
    return { etag: putRes.headers.get('etag') };
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abortHandler = () => xhr.abort();

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ etag: xhr.getResponseHeader('etag') });
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error('Upload failed'));
    };

    xhr.onabort = () => {
      cleanup();
      const abortError = new Error('Upload aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

export async function postFormWithProgress({
  formData,
  signal,
  onProgress
}: {
  formData: FormData;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<{
  key: string;
  url: string;
  name?: string;
  folder?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  altSource?: 'manual' | 'auto' | null;
  altGeneratedAt?: string | null;
  altModel?: string | null;
  altNeedsReview?: boolean | null;
  focalX?: number;
  focalY?: number;
  width?: number;
  height?: number;
}> {
  if (signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  onProgress?.(0);

  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined') {
    const res = await fetch('/api/assets/upload', {
      method: 'POST',
      body: formData,
      signal
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const message = detail?.error || `Upload failed (${res.status})`;
      throw withStatus(new Error(message), res.status);
    }
    const payload = await res.json();
    onProgress?.(100);
    return payload as {
      key: string;
      url: string;
      name?: string;
      folder?: string;
      caption?: string;
      alt?: string;
      tags?: string[];
      altSource?: 'manual' | 'auto' | null;
      altGeneratedAt?: string | null;
      altModel?: string | null;
      altNeedsReview?: boolean | null;
      focalX?: number;
      focalY?: number;
      width?: number;
      height?: number;
    };
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abortHandler = () => xhr.abort();

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        try {
          const payload = JSON.parse(xhr.responseText || '{}') as {
            key: string;
            url: string;
            name?: string;
            folder?: string;
            caption?: string;
            alt?: string;
            tags?: string[];
            altSource?: 'manual' | 'auto' | null;
            altGeneratedAt?: string | null;
            altModel?: string | null;
            altNeedsReview?: boolean | null;
            focalX?: number;
            focalY?: number;
            width?: number;
            height?: number;
          };
          resolve(payload);
        } catch {
          reject(withStatus(new Error('Upload failed'), xhr.status));
        }
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const payload = JSON.parse(xhr.responseText || '{}') as { error?: string };
        if (payload?.error) message = payload.error;
      } catch {
        // ignore parse errors
      }
      reject(withStatus(new Error(message), xhr.status));
    };

    xhr.onerror = () => {
      cleanup();
      reject(withStatus(new Error('Upload failed'), xhr.status));
    };

    xhr.onabort = () => {
      cleanup();
      const abortError = new Error('Upload aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.open('POST', '/api/assets/upload', true);
    xhr.send(formData);
  });
}
