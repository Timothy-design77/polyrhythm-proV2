let wakeLock: any = null;

export async function requestWakeLock(): Promise<boolean> {
  try {
    // @ts-expect-error Wake Lock API
    if (!('wakeLock' in navigator)) return false;
    // @ts-expect-error Wake Lock API
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener?.('release', () => {
      wakeLock = null;
    });
    return true;
  } catch {
    wakeLock = null;
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    if (wakeLock) {
      await wakeLock.release();
    }
  } finally {
    wakeLock = null;
  }
}

export function isWakeLocked(): boolean {
  return Boolean(wakeLock);
}
