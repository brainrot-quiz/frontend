declare module 'elevenlabs-node' {
  export class ElevenLabs {
    constructor(config: { apiKey: string });
    
    textToSpeech(params: {
      text: string;
      voice_id: string;
      model_id: string;
    }): Promise<ArrayBuffer>;
  }
} 