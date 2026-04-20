
/**
 * Utility for Text-to-Speech using the Web Speech API.
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = this.loadVoices.bind(this);
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  private detectLanguage(text: string): 'pt-BR' | 'en-US' {
    const ptWords = ['o', 'a', 'do', 'da', 'em', 'um', 'uma', 'é', 'como', 'quem', 'qual', 'onde', 'por', 'que', 'eu', 'você', 'ele', 'ela', 'com', 'para', 'está'];
    const enWords = ['the', 'of', 'in', 'and', 'is', 'it', 'you', 'that', 'was', 'for', 'on', 'are', 'with', 'as', 'I', 'he', 'she', 'my', 'your', 'cut'];
    
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
    if (words.length === 0) return 'pt-BR';

    let ptScore = 0;
    let enScore = 0;
    
    words.forEach(w => {
      if (ptWords.includes(w)) ptScore++;
      if (enWords.includes(w)) enScore++;
    });

    // Special check for Portuguese characters
    if (/[ãáàâéêíóôúç]/i.test(text)) ptScore += 2;

    return ptScore >= enScore ? 'pt-BR' : 'en-US';
  }

  private getBestVoice(lang: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    if (this.voices.length === 0) this.voices = this.synth.getVoices();

    const priorities = lang.startsWith('pt')
      ? ['Google português do Brasil', 'Luciana', 'Maria', 'Daniela', 'Heloisa', 'Portuguese']
      : ['Google US English', 'Samantha', 'Microsoft Zira', 'Aria', 'English'];

    for (const p of priorities) {
      const voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase()) && 
        v.name.toLowerCase().includes(p.toLowerCase())
      );
      if (voice) return voice;
    }

    return this.voices.find(v => v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase())) || null;
  }

  /**
   * Speaks the given text with automatic language detection and slower pace.
   */
  public speak(text: string) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    // Clean text: remove blank spaces like "_____" but keep ? and !
    const cleanedText = text
      .replace(/[_\-.]{2,}/g, ' ') // Remove sequences of underscores, dashes or dots
      .replace(/\s+/g, ' ')       // Unify spaces
      .trim();

    if (!cleanedText) return;

    const lang = this.detectLanguage(cleanedText);
    const voice = this.getBestVoice(lang);

    // Small delay to ensure previous speech is fully cancelled
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = lang;
      
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.8; // Slower rate for better comprehension
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      if (this.synth) {
        this.synth.speak(utterance);
      }
    }, 50);
  }

  /**
   * Pre-warms the speech engine.
   */
  public preload() {
    this.loadVoices();
  }
}

export const speechService = new SpeechService();
