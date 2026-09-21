let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const ClaseAudio =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!ClaseAudio) return null;

  if (!contexto) {
    contexto = new ClaseAudio();
  }
  if (contexto.state === 'suspended') {
    contexto.resume().catch(() => {});
  }
  return contexto;
}

function tocarTono(frecuencia: number, espera: number, duracion: number) {
  const ctx = contexto;
  if (!ctx) return;

  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();
  const momento = ctx.currentTime + espera;

  oscilador.type = 'sine';
  oscilador.frequency.value = frecuencia;

  // Envuelve el tono para que suene como una campana (sin clics).
  ganancia.gain.setValueAtTime(0.0001, momento);
  ganancia.gain.exponentialRampToValueAtTime(0.22, momento + 0.02);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, momento + duracion);

  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);

  oscilador.start(momento);
  oscilador.stop(momento + duracion + 0.05);
}

/** Reproduce un sonido breve de notificación (dos tonos ascendentes). */
export function reproducirSonidoNotificacion() {
  const ctx = obtenerContexto();
  if (!ctx) return;

  tocarTono(880, 0, 0.35);
  tocarTono(1174.66, 0.15, 0.45);
}