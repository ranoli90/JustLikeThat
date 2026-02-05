import { Injectable, Logger } from '@nestjs/common';
import { MLInfrastructureService } from './ml-infrastructure.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DTO for document analysis input
 */
export interface DocumentAnalysisInput {
  documentId: string;
  documentType: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other';
  documentUrl?: string;
  documentBuffer?: Buffer;
  mimeType?: string;
}

/**
 * DTO for layout analysis result
 */
export interface LayoutAnalysisResult {
  sections: DocumentSection[];
  structureScore: number;
  readabilityScore: number;
  formattingIssues: FormattingIssue[];
  recommendedStructure: string[];
}

/**
 * Document section
 */
export interface DocumentSection {
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'contact' | 'other';
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  text: string;
  position: number;
}

/**
 * Formatting issue
 */
export interface FormattingIssue {
  type: 'alignment' | 'spacing' | 'font' | 'length' | 'structure';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion: string;
}

/**
 * DTO for signature detection result
 */
export interface SignatureDetectionResult {
  hasSignature: boolean;
  signatureLocation?: { x: number; y: number; width: number; height: number };
  signatureQuality: number;
  isAutograph: boolean;
  confidence: number;
}

/**
 * DTO for photo quality assessment
 */
export interface PhotoQualityResult {
  hasPhoto: boolean;
  photoLocation?: { x: number; y: number; width: number; height: number };
  qualityScore: number;
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  brightness?: number;
  contrast?: number;
  focus?: number;
  recommendations: string[];
}

/**
 * DTO for document authenticity result
 */
export interface AuthenticityResult {
  authenticityScore: number;
  manipulationDetected: boolean;
  manipulationRegions?: { x: number; y: number; width: number; height: number }[];
  tamperingIndicators: TamperingIndicator[];
  metadataAnalysis: MetadataAnalysis;
}

/**
 * Tampering indicator
 */
export interface TamperingIndicator {
  type: 'metadata' | 'pixel' | 'structure' | 'compression' | 'content';
  confidence: number;
  description: string;
}

/**
 * Metadata analysis
 */
export interface MetadataAnalysis {
  creationDate?: Date;
  modificationDate?: Date;
  softwareUsed?: string;
  author?: string;
  isEdited: boolean;
}

/**
 * Document categorization result
 */
export interface CategorizationResult {
  documentType: string;
  confidence: number;
  categories: CategoryScore[];
  language: string;
  pageCount?: number;
}

/**
 * Category score
 */
export interface CategoryScore {
  category: string;
  score: number;
  evidence: string[];
}

/**
 * Computer Vision Document Analysis Service
 * Implements resume layout analysis, signature detection, photo quality assessment, and document authenticity detection
 */
@Injectable()
export class DocumentVisionService {
  private readonly logger = new Logger(DocumentVisionService.name);
  
  // Expected resume sections in order
  private readonly expectedResumeSections = [
    'contact',
    'header',
    'summary',
    'experience',
    'education',
    'skills',
    'certifications',
    'projects',
    'additional',
  ] as const;

  // Signature characteristics
  private readonly signatureCharacteristics = {
    minWidth: 50,
    maxWidth: 300,
    minHeight: 20,
    maxHeight: 100,
    aspectRatioRange: { min: 1.5, max: 8 },
  };

  constructor(
    private readonly mlInfrastructure: MLInfrastructureService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analyze document layout
   */
  async analyzeLayout(input: DocumentAnalysisInput): Promise<LayoutAnalysisResult> {
    const startTime = Date.now();

    try {
      // Simulate document processing (in production, use OCR/ML model)
      const sections = await this.detectSections(input);
      const structureScore = this.calculateStructureScore(sections);
      const readabilityScore = this.calculateReadabilityScore(input.documentBuffer);
      const formattingIssues = this.detectFormattingIssues(sections, input.documentType);
      const recommendedStructure = this.generateRecommendedStructure(input.documentType);

      // Store analysis result
      await this.storeDocumentAnalysis(
        input.documentId,
        'layout',
        { sections, structureScore, readabilityScore, formattingIssues },
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`Layout analysis completed in ${processingTime}ms`);

      return {
        sections,
        structureScore,
        readabilityScore,
        formattingIssues,
        recommendedStructure,
      };
    } catch (error) {
      this.logger.error(`Layout analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect signature in document
   */
  async detectSignature(input: DocumentAnalysisInput): Promise<SignatureDetectionResult> {
    const startTime = Date.now();

    try {
      // In production, use ML model for signature detection
      const signatureRegions = await this.scanForSignatureRegions(input);
      
      if (signatureRegions.length === 0) {
        return {
          hasSignature: false,
          signatureQuality: 0,
          isAutograph: false,
          confidence: 0.9,
          recommendations: ['No signature detected - consider adding a handwritten signature'],
        };
      }

      const signature = signatureRegions[0];
      const quality = this.assessSignatureQuality(signature);
      const isAutograph = this.differentiateSignature(signature);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Signature detection completed in ${processingTime}ms`);

      return {
        hasSignature: true,
        signatureLocation: signature.boundingBox,
        signatureQuality: quality,
        isAutograph,
        confidence: 0.85,
        recommendations: this.generateSignatureRecommendations(quality, isAutograph),
      };
    } catch (error) {
      this.logger.error(`Signature detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assess photo quality
   */
  async assessPhotoQuality(input: DocumentAnalysisInput): Promise<PhotoQualityResult> {
    const startTime = Date.now();

    try {
      // In production, use computer vision for photo analysis
      const photoRegions = await this.scanForPhotoRegions(input);
      
      if (photoRegions.length === 0) {
        return {
          hasPhoto: false,
          qualityScore: 0,
          recommendations: [
            'No headshot detected in resume',
            'Consider including a professional headshot for enhanced personalization',
            'Ensure photo is professional: formal attire, neutral background',
          ],
        };
      }

      const photo = photoRegions[0];
      const quality = await this.assessImageQuality(photo);
      const recommendations = this.generatePhotoRecommendations(quality);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Photo quality assessment completed in ${processingTime}ms`);

      return {
        hasPhoto: true,
        photoLocation: photo.boundingBox,
        qualityScore: quality.score,
        dimensions: photo.dimensions,
        aspectRatio: photo.dimensions.width / photo.dimensions.height,
        brightness: quality.brightness,
        contrast: quality.contrast,
        focus: quality.focus,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Photo quality assessment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect document authenticity
   */
  async detectAuthenticity(input: DocumentAnalysisInput): Promise<AuthenticityResult> {
    const startTime = Date.now();

    try {
      // In production, use ML model for forgery detection
      const manipulationRegions = await this.scanForManipulation(input);
      const tamperingIndicators = await this.detectTamperingIndicators(input);
      const metadataAnalysis = await this.analyzeMetadata(input);

      // Calculate overall authenticity score
      let authenticityScore = 100;
      
      if (manipulationRegions.length > 0) {
        authenticityScore -= manipulationRegions.length * 15;
      }
      
      for (const indicator of tamperingIndicators) {
        authenticityScore -= indicator.confidence * 20;
      }
      
      if (metadataAnalysis.isEdited) {
        authenticityScore -= 10;
      }

      authenticityScore = Math.max(authenticityScore, 0);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Authenticity detection completed in ${processingTime}ms`);

      return {
        authenticityScore,
        manipulationDetected: manipulationRegions.length > 0,
        manipulationRegions,
        tamperingIndicators,
        metadataAnalysis,
      };
    } catch (error) {
      this.logger.error(`Authenticity detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Categorize document
   */
  async categorizeDocument(input: DocumentAnalysisInput): Promise<CategorizationResult> {
    const startTime = Date.now();

    try {
      // Analyze document content to determine type
      const categories = await this.analyzeDocumentCategories(input);
      const topCategory = categories.sort((a, b) => b.score - a.score)[0];
      
      // Detect language
      const language = await this.detectDocumentLanguage(input);
      
      // Estimate page count (for PDF documents)
      const pageCount = await this.estimatePageCount(input);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Document categorization completed in ${processingTime}ms`);

      return {
        documentType: topCategory.category,
        confidence: topCategory.score,
        categories,
        language,
        pageCount,
      };
    } catch (error) {
      this.logger.error(`Document categorization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete document analysis (all features)
   */
  async analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    try {
      // Run all analyses in parallel
      const [layout, signature, photo, authenticity, categorization] = await Promise.all([
        this.analyzeLayout(input),
        this.detectSignature(input),
        this.assessPhotoQuality(input),
        this.detectAuthenticity(input),
        this.categorizeDocument(input),
      ]);

      // Calculate overall quality score
      const overallScore = this.calculateOverallDocumentScore(
        layout.structureScore,
        signature.qualityScore,
        photo.qualityScore,
        authenticity.authenticityScore,
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`Complete document analysis completed in ${processingTime}ms`);

      // Store complete analysis
      await this.storeDocumentAnalysis(input.documentId, 'complete', {
        layout,
        signature,
        photo,
        authenticity,
        categorization,
        overallScore,
      });

      return {
        documentId: input.documentId,
        documentType: input.documentType,
        layout,
        signature,
        photo,
        authenticity,
        categorization,
        overallScore,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Complete document analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store document analysis result
   */
  private async storeDocumentAnalysis(
    documentId: string,
    analysisType: string,
    result: any,
  ): Promise<void> {
    try {
      await this.prisma.documentAnalysis.create({
        data: {
          documentId,
          documentType: analysisType,
          layoutAnalysis: result.layout,
          signatureDetected: result.signature?.hasSignature || false,
          photoQuality: result.photo?.qualityScore,
          authenticityScore: result.authenticity?.authenticityScore,
          categorization: result.categorization,
          analysisResult: result,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to store document analysis: ${error.message}`);
    }
  }

  /**
   * Detect document sections
   */
  private async detectSections(input: DocumentAnalysisInput): Promise<DocumentSection[]> {
    // Simulated section detection
    const sections: DocumentSection[] = [];
    
    // Check for common section headers
    const sectionPatterns: Record<string, RegExp> = {
      contact: /(?:contact|email|phone|address)/i,
      header: /(?:header|name|personal)/i,
      summary: /(?:summary|objective|profile|about|professional.?summary)/i,
      experience: /(?:experience|employment|work.?history|professional.?experience)/i,
      education: /(?:education|academic|qualifications)/i,
      skills: /(?:skills|competencies|technologies|technical.?skills|core.?skills)/i,
      certifications: /(?:certifications|certificates|licenses)/i,
      projects: /(?:projects|portfolio|work.?samples)/i,
    };

    // Simulate section detection (in production, use OCR + ML)
    for (let i = 0; i < 5; i++) {
      const sectionTypes = Object.keys(sectionPatterns);
      const randomType = sectionTypes[Math.floor(Math.random() * sectionTypes.length)];
      
      sections.push({
        type: randomType as any,
        confidence: 0.7 + Math.random() * 0.25,
        text: `Detected ${randomType} section`,
        position: i,
      });
    }

    return sections.sort((a, b) => a.position - b.position);
  }

  /**
   * Calculate structure score
   */
  private calculateStructureScore(sections: DocumentSection[]): number {
    const foundTypes = new Set(sections.map(s => s.type));
    const expectedCount = this.expectedResumeSections.length;
    const foundCount = this.expectedResumeSections.filter(s => foundTypes.has(s)).length;
    
    // Base score on coverage
    const coverageScore = (foundCount / expectedCount) * 70;
    
    // Bonus for having key sections
    const keySections = ['contact', 'summary', 'experience', 'education', 'skills'];
    const keySectionBonus = keySections.filter(s => foundTypes.has(s)).length * 6;
    
    return Math.min(coverageScore + keySectionBonus, 100);
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(buffer?: Buffer): number {
    // Simulated readability score
    return 70 + Math.random() * 25;
  }

  /**
   * Detect formatting issues
   */
  private detectFormattingIssues(sections: DocumentSection[], documentType: string): FormattingIssue[] {
    const issues: FormattingIssue[] = [];
    
    // Check section order
    const sectionOrder = sections.map(s => s.type);
    const expectedOrder = this.expectedResumeSections.filter(s => sectionOrder.includes(s));
    
    if (JSON.stringify(sectionOrder) !== JSON.stringify(expectedOrder)) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: 'Sections may not be in optimal order',
        suggestion: `Recommended order: ${this.expectedResumeSections.join(' → ')}`,
      });
    }

    // Simulate common issues
    if (Math.random() > 0.7) {
      issues.push({
        type: 'spacing',
        severity: 'info',
        message: 'Inconsistent spacing detected between sections',
        suggestion: 'Maintain consistent spacing (typically 1-2 blank lines) between sections',
      });
    }

    if (Math.random() > 0.8) {
      issues.push({
        type: 'font',
        severity: 'info',
        message: 'Multiple fonts detected',
        suggestion: 'Use consistent font throughout (typically 10-12pt for body, 14-16pt for headers)',
      });
    }

    return issues;
  }

  /**
   * Generate recommended structure
   */
  private generateRecommendedStructure(documentType: string): string[] {
    if (documentType === 'resume') {
      return [
        '1. Contact Information (name, email, phone, location)',
        '2. Professional Summary (2-3 sentences highlighting key qualifications)',
        '3. Work Experience (reverse chronological, with achievements)',
        '4. Education (degrees, certifications)',
        '5. Skills (technical and soft skills)',
        '6. Additional Sections (projects, awards, volunteer work)',
      ];
    }
    
    return ['Standard document structure recommended'];
  }

  /**
   * Scan for signature regions
   */
  private async scanForSignatureRegions(input: DocumentAnalysisInput): Promise<any[]> {
    // Simulated signature detection
    if (Math.random() > 0.5) {
      return [{
        boundingBox: { x: 100, y: 500, width: 150, height: 40 },
        confidence: 0.85,
      }];
    }
    return [];
  }

  /**
   * Assess signature quality
   */
  private assessSignatureQuality(signature: any): number {
    // Simulated quality assessment
    return 60 + Math.random() * 35;
  }

  /**
   * Differentiate signature type
   */
  private differentiateSignature(signature: any): boolean {
    // Simulated differentiation (handwritten vs electronic)
    return Math.random() > 0.3;
  }

  /**
   * Generate signature recommendations
   */
  private generateSignatureRecommendations(quality: number, isAutograph: boolean): string[] {
    const recommendations: string[] = [];
    
    if (quality < 60) {
      recommendations.push('Signature appears blurry - ensure clear scan or capture');
    }
    
    if (!isAutograph) {
      recommendations.push('Consider adding a handwritten signature for a more personal touch');
    }
    
    if (quality > 80) {
      recommendations.push('Signature quality is excellent');
    }
    
    return recommendations;
  }

  /**
   * Scan for photo regions
   */
  private async scanForPhotoRegions(input: DocumentAnalysisInput): Promise<any[]> {
    // Simulated photo detection
    if (Math.random() > 0.6) {
      return [{
        boundingBox: { x: 20, y: 20, width: 100, height: 100 },
        dimensions: { width: 100, height: 100 },
        confidence: 0.9,
      }];
    }
    return [];
  }

  /**
   * Assess image quality
   */
  private async assessImageQuality(photo: any): Promise<any> {
    // Simulated quality assessment
    return {
      score: 60 + Math.random() * 35,
      brightness: 0.5 + Math.random() * 0.4,
      contrast: 0.5 + Math.random() * 0.4,
      focus: 0.7 + Math.random() * 0.25,
    };
  }

  /**
   * Generate photo recommendations
   */
  private generatePhotoRecommendations(quality: any): string[] {
    const recommendations: string[] = [];
    
    if (quality.brightness && quality.brightness < 0.4) {
      recommendations.push('Photo may be too dark - consider brighter lighting');
    }
    
    if (quality.focus && quality.focus < 0.7) {
      recommendations.push('Photo may be slightly out of focus - use sharper image');
    }
    
    if (quality.score > 80) {
      recommendations.push('Photo quality is excellent');
    }
    
    recommendations.push('Professional headshot recommended: formal attire, neutral background');
    
    return recommendations;
  }

  /**
   * Scan for manipulation regions
   */
  private async scanForManipulation(input: DocumentAnalysisInput): Promise<any[]> {
    // Simulated manipulation detection
    return [];
  }

  /**
   * Detect tampering indicators
   */
  private async detectTamperingIndicators(input: DocumentAnalysisInput): Promise<TamperingIndicator[]> {
    // Simulated tampering detection
    const indicators: TamperingIndicator[] = [];
    
    if (Math.random() > 0.9) {
      indicators.push({
        type: 'compression',
        confidence: 0.3,
        description: 'Inconsistent compression artifacts detected',
      });
    }
    
    return indicators;
  }

  /**
   * Analyze document metadata
   */
  private async analyzeMetadata(input: DocumentAnalysisInput): Promise<MetadataAnalysis> {
    // Simulated metadata analysis
    return {
      creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      modificationDate: new Date(),
      softwareUsed: 'Microsoft Word',
      author: 'Document Author',
      isEdited: Math.random() > 0.5,
    };
  }

  /**
   * Analyze document categories
   */
  private async analyzeDocumentCategories(input: DocumentAnalysisInput): Promise<CategoryScore[]> {
    const categories = [
      { category: 'resume', baseScore: 0.3 },
      { category: 'cover_letter', baseScore: 0.2 },
      { category: 'cv', baseScore: 0.25 },
      { category: 'portfolio', baseScore: 0.15 },
      { category: 'other', baseScore: 0.1 },
    ];

    return categories.map(cat => ({
      category: cat.category,
      score: Math.min(cat.baseScore + Math.random() * 0.3, 0.95),
      evidence: [`Detected ${cat.category} characteristics`],
    }));
  }

  /**
   * Detect document language
   */
  private async detectDocumentLanguage(input: DocumentAnalysisInput): Promise<string> {
    // Simplified language detection
    return 'en';
  }

  /**
   * Estimate page count
   */
  private async estimatePageCount(input: DocumentAnalysisInput): Promise<number> {
    // Simulated page count estimation
    return 1;
  }

  /**
   * Calculate overall document score
   */
  private calculateOverallDocumentScore(
    structureScore: number,
    signatureScore: number,
    photoScore: number,
    authenticityScore: number,
  ): number {
    // Weight the scores
    const weights = {
      structure: 0.4,
      signature: 0.1,
      photo: 0.1,
      authenticity: 0.4,
    };

    return (
      structureScore * weights.structure +
      (signatureScore || 50) * weights.signature +
      (photoScore || 50) * weights.photo +
      authenticityScore * weights.authenticity
    );
  }
}

/**
 * Complete document analysis result
 */
export interface DocumentAnalysisResult {
  documentId: string;
  documentType: string;
  layout: LayoutAnalysisResult;
  signature: SignatureDetectionResult;
  photo: PhotoQualityResult;
  authenticity: AuthenticityResult;
  categorization: CategorizationResult;
  overallScore: number;
  processingTime: number;
}
