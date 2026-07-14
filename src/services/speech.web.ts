/** Web / Expo Go without native speech module: keyboard speak-to-type only. */

export function isSpeechRecognitionAvailable(): boolean {
  return false;
}

export async function requestSpeechPermissions(): Promise<boolean> {
  return false;
}

export async function startListening(): Promise<boolean> {
  return false;
}

export function stopListening(): void {}

export function useSpeechRecognitionEvent(
  _eventName: string,
  _listener: (...args: unknown[]) => void
): void {
  // no-op on web
}
