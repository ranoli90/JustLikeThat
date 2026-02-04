import { Injectable, Logger } from '@nestjs/common';

export type DocumentFormat = 'PDF' | 'DOCX' | 'TXT' | 'HTML';
export type ResumeTemplate = 'modern' | 'classic' | 'creative' | 'minimalist' | 'professional';

export interface DocumentGenerationOptions {
  format: DocumentFormat;
  template?: ResumeTemplate;
  includeMetrics?: boolean;
  includeSkills?: boolean;
  includeSummary?: boolean;
  fontFamily?: string;
  fontSize?: number;
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header?: string;
  footer?: string;
}

export interface GeneratedDocument {
  id: string;
  content: string;
  format: DocumentFormat;
  template: ResumeTemplate;
  fileName: string;
  fileSize?: number;
  generatedAt: Date;
  metadata?: Record<string, any>;
}

export interface TemplateStyle {
  id: ResumeTemplate;
  name: string;
  description: string;
  sections: string[];
  fontFamily: string;
  headerStyle: Record<string, any>;
  bodyStyle: Record<string, any>;
  accentColor: string;
}

@Injectable()
export class DocumentGenerationService {
  private readonly logger = new Logger(DocumentGenerationService.name);

  // Available resume templates
  private readonly templates: Map<ResumeTemplate, TemplateStyle> = new Map([
    ['modern', {
      id: 'modern',
      name: 'Modern',
      description: 'Clean, contemporary design with accent colors',
      sections: ['header', 'summary', 'experience', 'education', 'skills', 'projects'],
      fontFamily: 'Inter',
      headerStyle: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
      bodyStyle: { fontSize: 11, lineHeight: 1.5 },
      accentColor: '#2563eb',
    }],
    ['classic', {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional resume layout',
      sections: ['header', 'objective', 'experience', 'education', 'skills'],
      fontFamily: 'Times New Roman',
      headerStyle: { fontSize: 18, fontWeight: 'bold' },
      bodyStyle: { fontSize: 12, lineHeight: 1.6 },
      accentColor: '#333333',
    }],
    ['creative', {
      id: 'creative',
      name: 'Creative',
      description: 'Eye-catching design for creative roles',
      sections: ['header', 'portfolio', 'experience', 'skills', 'education'],
      fontFamily: 'Montserrat',
      headerStyle: { fontSize: 28, fontWeight: 'bold', color: '#7c3aed' },
      bodyStyle: { fontSize: 10, lineHeight: 1.4 },
      accentColor: '#7c3aed',
    }],
    ['minimalist', {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Simple, clean layout focusing on content',
      sections: ['header', 'summary', 'experience', 'education', 'skills'],
      fontFamily: 'Arial',
      headerStyle: { fontSize: 20, fontWeight: 'normal' },
      bodyStyle: { fontSize: 11, lineHeight: 1.5 },
      accentColor: '#000000',
    }],
    ['professional', {
      id: 'professional',
      name: 'Professional',
      description: 'Corporate-style resume for formal positions',
      sections: ['header', 'qualifications', 'experience', 'education', 'certifications', 'skills'],
      fontFamily: 'Calibri',
      headerStyle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
      bodyStyle: { fontSize: 11, lineHeight: 1.5 },
      accentColor: '#1f2937',
    }],
  ]);

  /**
   * Generates a document in the specified format
   */
  async generateDocument(
    content: string,
    options: DocumentGenerationOptions,
  ): Promise<GeneratedDocument> {
    const template = this.templates.get(options.template || 'modern')!;

    switch (options.format) {
      case 'PDF':
        return this.generatePDF(content, template, options);
      case 'DOCX':
        return this.generateDOCX(content, template, options);
      case 'TXT':
        return this.generateTXT(content, options);
      case 'HTML':
        return this.generateHTML(content, template, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Generates a PDF document
   */
  private async generatePDF(
    content: string,
    template: TemplateStyle,
    options: DocumentGenerationOptions,
  ): Promise<GeneratedDocument> {
    // In production, use a library like pdfkit, puppeteer, or @react-pdf/renderer
    // For now, return a placeholder structure
    
    const parsedContent = this.parseContentIntoSections(content);
    const formattedContent = this.applyTemplateStyles(parsedContent, template);

    // Generate PDF structure (placeholder)
    const pdfStructure = {
      template: template.id,
      sections: formattedContent,
      styles: {
        fontFamily: options.fontFamily || template.fontFamily,
        fontSize: options.fontSize || 11,
        margins: options.margins || { top: 1, bottom: 1, left: 1, right: 1 },
        pageSize: options.pageSize || 'LETTER',
      },
      header: options.header,
      footer: options.footer,
    };

    this.logger.log(`Generated PDF structure for ${template.name} template`);

    return {
      id: crypto.randomUUID(),
      content: JSON.stringify(pdfStructure),
      format: 'PDF',
      template: template.id,
      fileName: `resume_${Date.now()}.pdf`,
      generatedAt: new Date(),
      metadata: {
        pageCount: this.estimatePageCount(content, options),
        wordCount: content.split(/\s+/).length,
      },
    };
  }

  /**
   * Generates a DOCX document
   */
  private async generateDOCX(
    content: string,
    template: TemplateStyle,
    options: DocumentGenerationOptions,
  ): Promise<GeneratedDocument> {
    // In production, use a library like docx, docxtemplater, or mammoth
    
    const parsedContent = this.parseContentIntoSections(content);

    // Generate DOCX structure (placeholder)
    const docxStructure = {
      template: template.id,
      sections: parsedContent,
      styles: {
        fontFamily: options.fontFamily || template.fontFamily,
        fontSize: options.fontSize || 11,
        headingStyles: {
          heading1: { size: 28, bold: true },
          heading2: { size: 22, bold: true },
          heading3: { size: 18, bold: true },
        },
      },
    };

    this.logger.log(`Generated DOCX structure for ${template.name} template`);

    return {
      id: crypto.randomUUID(),
      content: JSON.stringify(docxStructure),
      format: 'DOCX',
      template: template.id,
      fileName: `resume_${Date.now()}.docx`,
      generatedAt: new Date(),
      metadata: {
        wordCount: content.split(/\s+/).length,
        paragraphCount: content.split('\n\n').length,
      },
    };
  }

  /**
   * Generates a plain text document
   */
  private async generateTXT(
    content: string,
    options: DocumentGenerationOptions,
  ): Promise<GeneratedDocument> {
    // Plain text is just the content with basic formatting
    let formattedContent = content;

    // Apply basic formatting
    formattedContent = this.applyBasicTextFormatting(content);

    return {
      id: crypto.randomUUID(),
      content: formattedContent,
      format: 'TXT',
      template: 'minimalist',
      fileName: `resume_${Date.now()}.txt`,
      generatedAt: new Date(),
      metadata: {
        characterCount: formattedContent.length,
        lineCount: formattedContent.split('\n').length,
      },
    };
  }

  /**
   * Generates an HTML document
   */
  private async generateHTML(
    content: string,
    template: TemplateStyle,
    options: DocumentGenerationOptions,
  ): Promise<GeneratedDocument> {
    const parsedContent = this.parseContentIntoSections(content);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    :root {
      --accent-color: ${template.accentColor};
      --font-family: ${template.fontFamily}, sans-serif;
      --font-size: ${options.fontSize || 11}px;
      --line-height: 1.5;
    }
    
    body {
      font-family: var(--font-family);
      font-size: var(--font-size);
      line-height: var(--line-height);
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--accent-color);
    }
    
    h1 {
      font-size: ${template.headerStyle.fontSize}px;
      color: ${template.headerStyle.color || '#333'};
      margin: 0;
    }
    
    h2 {
      font-size: 18px;
      color: var(--accent-color);
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
      margin-top: 25px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .job-title {
      font-weight: bold;
    }
    
    .company {
      color: #666;
    }
    
    .date {
      float: right;
      color: #888;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  ${this.sectionsToHTML(parsedContent)}
</body>
</html>
    `.trim();

    return {
      id: crypto.randomUUID(),
      content: html,
      format: 'HTML',
      template: template.id,
      fileName: `resume_${Date.now()}.html`,
      generatedAt: new Date(),
      metadata: {
        characterCount: html.length,
        hasCSS: true,
        printReady: true,
      },
    };
  }

  /**
   * Parses raw content into structured sections
   */
  private parseContentIntoSections(content: string): Record<string, any> {
    const sections: Record<string, any> = {};
    const lines = content.split('\n');
    
    let currentSection = 'header';
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect section headers
      const sectionMatch = trimmed.match(/^(#{1,3})\s+(.+)$/) ||
                          /^([A-Z][A-Z\s]+):$/;
      
      if (sectionMatch && trimmed.length < 50) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        
        // Start new section
        currentSection = this.normalizeSectionName(trimmed);
        currentContent = [];
      } else if (trimmed) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  private normalizeSectionName(name: string): string {
    const normalized = name
      .replace(/^#{1,3}\s+/, '')
      .replace(/:$/, '')
      .toLowerCase()
      .replace(/\s+/g, '_');
    
    return normalized;
  }

  /**
   * Applies template styles to parsed content
   */
  private applyTemplateStyles(
    sections: Record<string, any>,
    template: TemplateStyle,
  ): Record<string, any> {
    // Apply template-specific styling
    const styledSections: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(sections)) {
      styledSections[key] = {
        content: value,
        style: {
          ...template.bodyStyle,
          ...(template.sections.includes(key) ? template.headerStyle : {}),
        },
      };
    }

    return styledSections;
  }

  /**
   * Applies basic text formatting for plain text output
   */
  private applyBasicTextFormatting(content: string): string {
    let formatted = content;

    // Convert markdown headers to uppercase
    formatted = formatted.replace(/^### (.+)$/gm, '$1');
    formatted = formatted.replace(/^## (.+)$/gm, '=== $1 ===');
    formatted = formatted.replace(/^# (.+)$/gm, '=== $1 ===');

    // Format bullet points
    formatted = formatted.replace(/^[•\-\*]\s+/gm, '• ');

    return formatted;
  }

  /**
   * Converts parsed sections to HTML
   */
  private sectionsToHTML(sections: Record<string, any>): string {
    let html = '';

    for (const [key, value] of Object.entries(sections)) {
      const sectionTitle = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      html += `<section class="section">\n`;
      html += `<h2>${sectionTitle}</h2>\n`;
      
      // Convert content to HTML
      const contentHtml = this.contentToHTML(value as string);
      html += `<div class="content">${contentHtml}</div>\n`;
      html += `</section>\n`;
    }

    return html;
  }

  /**
   * Converts plain text content to HTML
   */
  private contentToHTML(content: string): string {
    let html = content
      // Escape HTML
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      // Convert line breaks
      .replace(/\n/g, '<br>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert lists
    html = html.replace(/<br>• /g, '</p><ul><li>');
    html = html.replace(/(<li>.*)<br>/g, '$1</li>');

    return `<p>${html}</p>`;
  }

  /**
   * Estimates page count based on content length
   */
  private estimatePageCount(content: string, options: DocumentGenerationOptions): number {
    const wordsPerPage = 300; // Approximate words per page
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerPage);
  }

  /**
   * Gets all available templates
   */
  getTemplates(): TemplateStyle[] {
    return Array.from(this.templates.values());
  }

  /**
   * Gets a specific template
   */
  getTemplate(id: ResumeTemplate): TemplateStyle | undefined {
    return this.templates.get(id);
  }

  /**
   * Converts document between formats
   */
  async convertDocument(
    document: GeneratedDocument,
    targetFormat: DocumentFormat,
  ): Promise<GeneratedDocument> {
    // Parse the existing document
    let sourceContent: string;
    
    if (document.format === 'PDF' || document.format === 'DOCX') {
      // Extract text from structured format
      try {
        const parsed = JSON.parse(document.content);
        sourceContent = Object.values(parsed).join('\n\n');
      } catch {
        sourceContent = document.content;
      }
    } else {
      sourceContent = document.content;
    }

    // Generate new document in target format
    return this.generateDocument(sourceContent, {
      format: targetFormat,
      template: document.template as ResumeTemplate,
    });
  }
}
