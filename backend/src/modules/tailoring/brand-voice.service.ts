import { Injectable, Logger } from '@nestjs/common';

export type VoiceStyle = 'professional' | 'innovative' | 'enthusiastic' | 'formal' | 'conversational' | 'technical';

export interface VoiceProfile {
  id: string;
  name: string;
  style: VoiceStyle;
  characteristics: VoiceCharacteristics;
  examples: VoiceExample[];
}

export interface VoiceCharacteristics {
  formality: number; // 0-1 scale
  enthusiasm: number; // 0-1 scale
  technicalDepth: number; // 0-1 scale
  brevity: number; // 0-1 scale (higher = more concise)
  assertiveness: number; // 0-1 scale
}

export interface VoiceExample {
  before: string;
  after: string;
  context: string;
}

export interface VoiceAnalysisResult {
  currentStyle: VoiceStyle;
  confidence: number;
  suggestions: VoiceSuggestion[];
  toneMarkers: ToneMarker[];
}

export interface VoiceSuggestion {
  original: string;
  suggested: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ToneMarker {
  text: string;
  tone: 'positive' | 'negative' | 'neutral';
  suggestion?: string;
}

@Injectable()
export class BrandVoiceService {
  private readonly logger = new Logger(BrandVoiceService.name);

  // Predefined voice profiles
  private readonly voiceProfiles: Map<VoiceStyle, VoiceProfile> = new Map([
    ['professional', {
      id: 'professional',
      name: 'Professional',
      style: 'professional',
      characteristics: {
        formality: 0.8,
        enthusiasm: 0.5,
        technicalDepth: 0.6,
        brevity: 0.6,
        assertiveness: 0.7,
      },
      examples: [
        {
          before: 'I think this is a great solution',
          after: 'This solution demonstrates proven effectiveness',
          context: 'Describing a solution',
        },
      ],
    }],
    ['innovative', {
      id: 'innovative',
      name: 'Innovative',
      style: 'innovative',
      characteristics: {
        formality: 0.5,
        enthusiasm: 0.8,
        technicalDepth: 0.7,
        brevity: 0.5,
        assertiveness: 0.6,
      },
      examples: [
        {
          before: 'We used modern methods',
          after: 'We leveraged cutting-edge technologies to pioneer new approaches',
          context: 'Describing technical work',
        },
      ],
    }],
    ['enthusiastic', {
      id: 'enthusiastic',
      name: 'Enthusiastic',
      style: 'enthusiastic',
      characteristics: {
        formality: 0.4,
        enthusiasm: 0.9,
        technicalDepth: 0.5,
        brevity: 0.4,
        assertiveness: 0.5,
      },
      examples: [
        {
          before: 'I worked on this project',
          after: 'I was thrilled to lead this exciting project',
          context: 'Starting a description',
        },
      ],
    }],
    ['formal', {
      id: 'formal',
      name: 'Formal',
      style: 'formal',
      characteristics: {
        formality: 0.95,
        enthusiasm: 0.3,
        technicalDepth: 0.6,
        brevity: 0.7,
        assertiveness: 0.8,
      },
      examples: [
        {
          before: 'I think we should do it this way',
          after: 'It is recommended that this approach be implemented',
          context: 'Making recommendations',
        },
      ],
    }],
    ['conversational', {
      id: 'conversational',
      name: 'Conversational',
      style: 'conversational',
      characteristics: {
        formality: 0.3,
        enthusiasm: 0.6,
        technicalDepth: 0.5,
        brevity: 0.5,
        assertiveness: 0.5,
      },
      examples: [
        {
          before: 'I was responsible for managing the team',
          after: 'I had the opportunity to work with a great team',
          context: 'Describing responsibilities',
        },
      ],
    }],
    ['technical', {
      id: 'technical',
      name: 'Technical Expert',
      style: 'technical',
      characteristics: {
        formality: 0.7,
        enthusiasm: 0.4,
        technicalDepth: 0.95,
        brevity: 0.8,
        assertiveness: 0.7,
      },
      examples: [
        {
          before: 'We built a system that handles lots of data',
          after: 'Architected a scalable data pipeline processing 10M+ events daily',
          context: 'Describing technical achievements',
        },
      ],
    }],
  ]);

  /**
   * Analyzes the current voice/style of content
   */
  analyzeVoice(content: string): VoiceAnalysisResult {
    const markers = this.detectToneMarkers(content);
    const currentStyle = this.detectVoiceStyle(content);
    const suggestions = this.generateVoiceSuggestions(content, currentStyle);

    return {
      currentStyle,
      confidence: this.calculateStyleConfidence(content, currentStyle),
      suggestions,
      toneMarkers: markers,
    };
  }

  /**
   * Transforms content to match a target voice profile
   */
  transformToVoice(
    content: string,
    targetVoice: VoiceStyle,
    preserveMeaning: boolean = true,
  ): string {
    const profile = this.voiceProfiles.get(targetVoice);
    if (!profile) {
      throw new Error(`Unknown voice profile: ${targetVoice}`);
    }

    let transformed = content;

    // Apply voice-specific transformations
    transformed = this.applyFormalityTransform(transformed, profile.characteristics.formality);
    transformed = this.applyEnthusiasmTransform(transformed, profile.characteristics.enthusiasm);
    transformed = this.applyBrevityTransform(transformed, profile.characteristics.brevity);
    transformed = this.applyTechnicalDepthTransform(transformed, profile.characteristics.technicalDepth);

    this.logger.log(`Transformed content to ${targetVoice} voice`);
    return transformed;
  }

  /**
   * Gets all available voice profiles
   */
  getVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.voiceProfiles.values());
  }

  /**
   * Gets a specific voice profile
   */
  getVoiceProfile(style: VoiceStyle): VoiceProfile | undefined {
    return this.voiceProfiles.get(style);
  }

  /**
   * Creates a custom voice profile
   */
  createCustomProfile(
    name: string,
    characteristics: VoiceCharacteristics,
  ): VoiceProfile {
    const style: VoiceStyle = 'professional'; // Default
    return {
      id: crypto.randomUUID(),
      name,
      style,
      characteristics,
      examples: [],
    };
  }

  // Private helper methods

  private detectToneMarkers(content: string): ToneMarker[] {
    const markers: ToneMarker[] = [];
    const positivePatterns = [
      /\b(excited|passionate|thrilled|enthusiastic|amazing|excellent|outstanding|exceptional)\b/gi,
    ];
    const negativePatterns = [
      /\b(struggled|failed|difficult|problem|issue|challenge)\b/gi,
    ];

    positivePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          markers.push({ text: match, tone: 'positive' });
        });
      }
    });

    negativePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          markers.push({ text: match, tone: 'negative' });
        });
      }
    });

    return markers;
  }

  private detectVoiceStyle(content: string): VoiceStyle {
    // Simple heuristic-based detection
    const lower = content.toLowerCase();
    
    if (/\b(pioneered|innovative|cutting-edge|revolutionary|transformative)\b/.test(lower)) {
      return 'innovative';
    }
    if (/\b(thrilled|excited|passionate|love|great opportunity)\b/.test(lower)) {
      return 'enthusiastic';
    }
    if (/\b(it is recommended|it is advised|please note|furthermore|consequently)\b/.test(lower)) {
      return 'formal';
    }
    if (/\b(i had the opportunity|i was able to|i worked with)\b/.test(lower)) {
      return 'conversational';
    }
    if (/\b(architected|implemented|deployed|scalable|optimized)\b/.test(lower)) {
      return 'technical';
    }
    return 'professional';
  }

  private generateVoiceSuggestions(content: string, currentStyle: VoiceStyle): VoiceSuggestion[] {
    const suggestions: VoiceSuggestion[] = [];
    const profile = this.voiceProfiles.get(currentStyle);

    if (!profile) return suggestions;

    // Generate suggestions based on voice characteristics
    if (profile.characteristics.formality > 0.7) {
      // Suggest more formal language
      const casualPhrases = [
        { from: /\bi think\b/gi, to: 'it appears' },
        { from: /\breally good\b/gi, to: 'exceptional' },
      ];
      casualPhrases.forEach(({ from, to }) => {
        if (from.test(content)) {
          suggestions.push({
            original: 'i think',
            suggested: to,
            reason: 'Increase formality',
            impact: 'medium',
          });
        }
      });
    }

    if (profile.characteristics.brevity > 0.7) {
      // Suggest more concise language
      const wordyPhrases = [
        { from: /due to the fact that/gi, to: 'because' },
        { from: /at this point in time/gi, to: 'now' },
        { from: /in order to/gi, to: 'to' },
      ];
      wordyPhrases.forEach(({ from, to }) => {
        if (from.test(content)) {
          suggestions.push({
            original: from.source,
            suggested: to,
            reason: 'Improve conciseness',
            impact: 'low',
          });
        }
      });
    }

    return suggestions;
  }

  private calculateStyleConfidence(content: string, style: VoiceStyle): number {
    // Simple confidence calculation
    const profile = this.voiceProfiles.get(style);
    if (!profile) return 0.5;

    const wordCount = content.split(/\s+/).length;
    const markerCount = this.detectToneMarkers(content).length;
    
    // Higher marker density suggests clearer style
    return Math.min(0.95, 0.5 + (markerCount / Math.max(wordCount, 1)) * 50);
  }

  private applyFormalityTransform(content: string, targetFormality: number): string {
    let transformed = content;
    
    if (targetFormality > 0.7) {
      // Make more formal
      const informalToFormal: [RegExp, string][] = [
        [/\bi think\b/gi, 'it appears that'],
        [/\bgot\b/gi, 'obtained'],
        [/\breally good\b/gi, 'exceptional'],
        [/\blots of\b/gi, 'substantial'],
        [/\bpretty\b/gi, 'notably'],
      ];
      informalToFormal.forEach(([from, to]) => {
        transformed = transformed.replace(from, to);
      });
    } else if (targetFormality < 0.4) {
      // Make more casual
      const formalToCasual: [RegExp, string][] = [
        [/\bit appears that\b/gi, 'I think'],
        [/\bsubstantial\b/gi, 'lots of'],
        [/however\b/gi, 'but'],
        [/therefore\b/gi, 'so'],
      ];
      formalToCasual.forEach(([from, to]) => {
        transformed = transformed.replace(from, to);
      });
    }

    return transformed;
  }

  private applyEnthusiasmTransform(content: string, targetEnthusiasm: number): string {
    let transformed = content;
    
    if (targetEnthusiasm > 0.7) {
      // Add enthusiasm
      const neutralToEnthusiastic: [RegExp, string][] = [
        [/\bworked on\b/gi, 'was passionate about working on'],
        [/\bcompleted\b/gi, 'successfully delivered'],
        [/\blead\b/gi, 'spearheaded'],
        [/\bhelped\b/gi, 'made a significant impact by helping'],
      ];
      neutralToEnthusiastic.forEach(([from, to]) => {
        transformed = transformed.replace(from, to);
      });
    } else if (targetEnthusiasm < 0.4) {
      // Reduce enthusiasm
      const enthusiasticToNeutral: [RegExp, string][] = [
        [/was passionate about/gi, 'worked on'],
        [/successfully delivered/gi, 'completed'],
        [/spearheaded/gi, 'led'],
      ];
      enthusiasticToNeutral.forEach(([from, to]) => {
        transformed = transformed.replace(from, to);
      });
    }

    return transformed;
  }

  private applyBrevityTransform(content: string, targetBrevity: number): string {
    let transformed = content;
    
    if (targetBrevity > 0.7) {
      // Make more concise
      const wordyToConcise: [RegExp, string][] = [
        [/\bdue to the fact that\b/gi, 'because'],
        [/\bat this point in time\b/gi, 'now'],
        [/\bin order to\b/gi, 'to'],
        [/\bfor the purpose of\b/gi, 'for'],
        [/\bit should be noted that\b/gi, 'notably'],
      ];
      wordyToConcise.forEach(([from, to]) => {
        transformed = transformed.replace(from, to);
      });

      // Remove filler words
      transformed = transformed.replace(/\bvery\s+/gi, '');
      transformed = transformed.replace(/\breally\s+/gi, '');
    }

    return transformed;
  }

  private applyTechnicalDepthTransform(content: string, targetDepth: number): string {
    let transformed = content;
    
    if (targetDepth > 0.7) {
      // Add technical specificity
      const vagueToTechnical: [RegExp, string][] = [
        [/\bbig\b/gi, 'large-scale'],
        [/\bfast\b/gi, 'high-performance'],
        [/\blots of data\b/gi, 'millions of data points'],
        [/\bquickly\b/gi, 'with low latency'],
        [/\bgood\b/gi, 'optimal'],
        [/\bsystem\b/gi, 'architecture'],
      ];
      vagueToTechnical.forEach(([from, to]) => {
        transformed = transformed.replace(from, to);
      });

      // Add metrics where possible
      transformed = transformed.replace(
        /\bimproved\b/gi,
        'improved (30% efficiency gain)'
      );
    }

    return transformed;
  }
}
