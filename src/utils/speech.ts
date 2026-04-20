
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

    // Browser lang codes can be 'pt-BR', 'pt_BR', 'pt'
    const langPrefix = lang.split(/[-_]/)[0].toLowerCase();

    // Aggressive priority for Portuguese, looking for "Natural" or "Google" first
    const priorities = langPrefix === 'pt'
      ? ['Natural', 'Google português do Brasil', 'Microsoft Maria', 'Microsoft Heloisa', 'Daniela', 'Heloisa', 'Maria', 'Portuguese']
      : ['Natural', 'Google US English', 'Samantha', 'Microsoft Zira', 'Aria', 'English'];

    // 1. Try finding by priority name AND lang prefix (prefer non-local voices if possible)
    for (const p of priorities) {
      const voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(langPrefix) && 
        v.name.toLowerCase().includes(p.toLowerCase()) &&
        !v.localService
      );
      if (voice) return voice;
    }

    // 2. Try priority name without localService check
    for (const p of priorities) {
      const voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(langPrefix) && 
        v.name.toLowerCase().includes(p.toLowerCase())
      );
      if (voice) return voice;
    }

    // Fallback: just find by lang prefix
    const fallback = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) || null;
    return fallback;
  }

  /**
   * Speaks the given text, supporting [PT] and [EN] tags for mixed language reading.
   */
  public speak(text: string) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    // Clean text: remove blank spaces like "_____" but keep tags and ? !
    let cleanedText = text
      .replace(/[_\-.]{2,}/g, ' ') 
      .replace(/\s+/g, ' ')
      .trim();

    // Pedagogy: If the sentence ends with completion marks (underscores) or a simple period,
    // we force a '?' intonation so it sounds like a prompt for the student.
    if (text.includes('____') && !cleanedText.endsWith('!') && !cleanedText.endsWith('?')) {
      cleanedText = cleanedText.replace(/\.?$/, '?');
    }

    if (!cleanedText) return;

    const chunks = this.parseChunks(cleanedText);
    console.log('TTS Chunks:', chunks);
    
    // Small delay to ensure previous speech is fully cancelled
    setTimeout(() => {
      this.speakSequential(chunks);
    }, 100);
  }

  private stripTags(text: string) {
    return text.replace(/\[\/?(PT|EN)\]/gi, '').trim();
  }

  private parseChunks(text: string): { text: string; lang: 'pt-BR' | 'en-US' }[] {
    const regex = /\[(PT|EN)\](.*?)\[\/\1\]/gi;
    const chunks: { text: string; lang: 'pt-BR' | 'en-US' }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the tag (use auto-detect), stripping any lone tags
      const before = this.stripTags(text.substring(lastIndex, match.index));
      if (before) {
        chunks.push({ text: before, lang: this.detectLanguage(before) });
      }
      
      const lang = match[1].toUpperCase() === 'PT' ? 'pt-BR' : 'en-US';
      const content = match[2].trim();
      if (content) {
        chunks.push({ text: content, lang });
      }
      
      lastIndex = regex.lastIndex;
    }

    // Add remaining text, stripping any lone tags
    const after = this.stripTags(text.substring(lastIndex));
    if (after) {
      chunks.push({ text: after, lang: this.detectLanguage(after) });
    }

    if (chunks.length === 0 && text) {
      const clean = this.stripTags(text);
      if (clean) {
        chunks.push({ text: clean, lang: this.detectLanguage(clean) });
      }
    }

    return chunks;
  }

  private speakSequential(chunks: { text: string; lang: 'pt-BR' | 'en-US' }[]) {
    if (!this.synth || chunks.length === 0) return;

    const current = chunks[0];
    if (!current.text.trim()) {
      this.speakSequential(chunks.slice(1));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = current.lang;
    const voice = this.getBestVoice(current.lang);
    if (voice) utterance.voice = voice;
    
    utterance.rate = 0.7; // Even slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => console.log(`Speaking (${current.lang}): ${current.text}`);
    
    utterance.onend = () => {
      // Add a small pause (300ms) between chunks for more natural flow
      setTimeout(() => {
        this.speakSequential(chunks.slice(1));
      }, 300);
    };

    utterance.onerror = (e) => {
      console.error(`Speech error (${current.lang}):`, e);
      this.speakSequential(chunks.slice(1));
    };

    this.synth.speak(utterance);
  }

  /**
   * Pre-warms the speech engine.
   */
  public preload() {
    this.loadVoices();
  }
}

export const speechService = new SpeechService();
