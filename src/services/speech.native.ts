type SpeechEventListener = (...args: never[]) => void;

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
  _listener: SpeechEventListener
): void {
  // Expo Go: use keyboard speak-to-type. Native STT needs a custom dev build later.
}
