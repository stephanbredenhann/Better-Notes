/**
 * TypeScript entry. Metro resolves speech.native.ts / speech.web.ts at runtime.
 */
export {
  isSpeechRecognitionAvailable,
  requestSpeechPermissions,
  startListening,
  stopListening,
  useSpeechRecognitionEvent,
} from './speech.native';
