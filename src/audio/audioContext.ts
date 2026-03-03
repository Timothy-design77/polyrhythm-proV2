let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (ctx) return ctx;
  // Let the browser choose the best sample rate (typically 48k on Android).
  ctx = new AudioContext({ latencyHint: 'interactive' });
  return ctx;
}

export async function ensureAudioRunning(): Promise<AudioContext> {
  const ac = getAudioContext();
  if (ac.state !== 'running') {
    await ac.resume();
  }
  return ac;
}

export async function closeAudioContext(): Promise<void> {
  if (!ctx) return;
  try {
    await ctx.close();
  } finally {
    ctx = null;
  }
}
