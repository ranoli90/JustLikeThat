// In-memory data store for Maturity Module with camelCase methods

class MaturityDataStore {
  private static instance: MaturityDataStore;
  
  private documentation: Map<string, any> = new Map();
  private trainingMaterials: Map<string, any> = new Map();
  private trainingProgress: Map<string, any> = new Map();
  private runbooks: Map<string, any> = new Map();
  private runbookExecutions: Map<string, any> = new Map();
  private releases: Map<string, any> = new Map();
  private releaseApprovals: Map<string, any> = new Map();
  private qaReports: Map<string, any> = new Map();
  private signoffs: Map<string, any> = new Map();
  private metrics: Map<string, any> = new Map();
  private faqs: Map<string, any> = new Map();
  private knowledgeTransfers: Map<string, any> = new Map();

  private constructor() {
    this.seed();
  }

  static getInstance(): MaturityDataStore {
    if (!MaturityDataStore.instance) {
      MaturityDataStore.instance = new MaturityDataStore();
    }
    return MaturityDataStore.instance;
  }

  // Documentation - camelCase
  documentationCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const doc = { ...data, id, createdAt: new Date(), updatedAt: new Date(), views: 0, helpfulCount: 0 };
    this.documentation.set(id, doc);
    return doc;
  }

  documentationFindMany() {
    return Array.from(this.documentation.values());
  }

  documentationFindUnique(id: string) {
    return this.documentation.get(id) || null;
  }

  documentationUpdate(id: string, data: any) {
    const existing = this.documentation.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.documentation.set(id, updated);
    return updated;
  }

  documentationDelete(id: string) {
    return this.documentation.delete(id);
  }

  // Training Materials - camelCase
  trainingMaterialCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const material = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.trainingMaterials.set(id, material);
    return material;
  }

  trainingMaterialFindMany() {
    return Array.from(this.trainingMaterials.values());
  }

  trainingMaterialFindUnique(id: string) {
    return this.trainingMaterials.get(id) || null;
  }

  trainingMaterialUpdate(id: string, data: any) {
    const existing = this.trainingMaterials.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.trainingMaterials.set(id, updated);
    return updated;
  }

  // Training Progress - camelCase
  trainingProgressCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const progress = { ...data, id, createdAt: new Date(), lastAccessedAt: new Date() };
    this.trainingProgress.set(id, progress);
    return progress;
  }

  trainingProgressFindMany() {
    return Array.from(this.trainingProgress.values());
  }

  trainingProgressUpdate(id: string, data: any) {
    const existing = this.trainingProgress.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, lastAccessedAt: new Date() };
    this.trainingProgress.set(id, updated);
    return updated;
  }

  // Runbooks - camelCase
  runbookCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const runbook = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.runbooks.set(id, runbook);
    return runbook;
  }

  runbookFindMany() {
    return Array.from(this.runbooks.values());
  }

  runbookFindUnique(id: string) {
    return this.runbooks.get(id) || null;
  }

  runbookUpdate(id: string, data: any) {
    const existing = this.runbooks.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.runbooks.set(id, updated);
    return updated;
  }

  runbookDelete(id: string) {
    return this.runbooks.delete(id);
  }

  // Runbook Executions - camelCase
  runbookExecutionCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const execution = { ...data, id, createdAt: new Date() };
    this.runbookExecutions.set(id, execution);
    return execution;
  }

  runbookExecutionFindMany() {
    return Array.from(this.runbookExecutions.values());
  }

  runbookExecutionUpdate(id: string, data: any) {
    const existing = this.runbookExecutions.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    this.runbookExecutions.set(id, updated);
    return updated;
  }

  // Releases - camelCase
  releasePlanCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const release = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.releases.set(id, release);
    return release;
  }

  releasePlanFindMany() {
    return Array.from(this.releases.values());
  }

  releasePlanFindUnique(id: string) {
    return this.releases.get(id) || null;
  }

  releasePlanUpdate(id: string, data: any) {
    const existing = this.releases.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.releases.set(id, updated);
    return updated;
  }

  // Release Approvals - camelCase
  releaseApprovalCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const approval = { ...data, id, createdAt: new Date() };
    this.releaseApprovals.set(id, approval);
    return approval;
  }

  releaseApprovalFindMany() {
    return Array.from(this.releaseApprovals.values());
  }

  releaseApprovalUpdate(id: string, data: any) {
    const existing = this.releaseApprovals.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    this.releaseApprovals.set(id, updated);
    return updated;
  }

  // QA Reports - camelCase
  qaReportCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const report = { ...data, id, createdAt: new Date() };
    this.qaReports.set(id, report);
    return report;
  }

  qaReportFindMany() {
    return Array.from(this.qaReports.values());
  }

  qaReportFindUnique(id: string) {
    return this.qaReports.get(id) || null;
  }

  qaReportUpdate(id: string, data: any) {
    const existing = this.qaReports.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    this.qaReports.set(id, updated);
    return updated;
  }

  // Sign-offs - camelCase
  signOffCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const signoff = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.signoffs.set(id, signoff);
    return signoff;
  }

  signOffFindMany() {
    return Array.from(this.signoffs.values());
  }

  signOffFindUnique(id: string) {
    return this.signoffs.get(id) || null;
  }

  signOffUpdate(id: string, data: any) {
    const existing = this.signoffs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.signoffs.set(id, updated);
    return updated;
  }

  // Platform Metrics - camelCase
  platformMetricsCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const metric = { ...data, id, createdAt: new Date() };
    this.metrics.set(id, metric);
    return metric;
  }

  platformMetricsFindMany() {
    return Array.from(this.metrics.values());
  }

  // FAQs - camelCase
  faqCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const faq = { ...data, id, createdAt: new Date(), updatedAt: new Date(), helpfulCount: 0, notHelpfulCount: 0, viewCount: 0 };
    this.faqs.set(id, faq);
    return faq;
  }

  faqFindMany() {
    return Array.from(this.faqs.values());
  }

  faqFindUnique(id: string) {
    return this.faqs.get(id) || null;
  }

  faqUpdate(id: string, data: any) {
    const existing = this.faqs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.faqs.set(id, updated);
    return updated;
  }

  faqDelete(id: string) {
    return this.faqs.delete(id);
  }

  // Knowledge Transfer - camelCase
  knowledgeTransferCreate(data: any) {
    const id = data.id || crypto.randomUUID();
    const transfer = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.knowledgeTransfers.set(id, transfer);
    return transfer;
  }

  knowledgeTransferFindMany() {
    return Array.from(this.knowledgeTransfers.values());
  }

  knowledgeTransferFindUnique(id: string) {
    return this.knowledgeTransfers.get(id) || null;
  }

  knowledgeTransferUpdate(id: string, data: any) {
    const existing = this.knowledgeTransfers.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.knowledgeTransfers.set(id, updated);
    return updated;
  }

  // Utility
  clear() {
    this.documentation.clear();
    this.trainingMaterials.clear();
    this.trainingProgress.clear();
    this.runbooks.clear();
    this.runbookExecutions.clear();
    this.releases.clear();
    this.releaseApprovals.clear();
    this.qaReports.clear();
    this.signoffs.clear();
    this.metrics.clear();
    this.faqs.clear();
    this.knowledgeTransfers.clear();
  }

  private seed() {
    // Seed sample documentation
    this.documentationCreate({
      category: 'api',
      title: 'API Documentation Overview',
      content: '# API Overview\n\nWelcome to the Apply-as-a-Service API documentation.',
      version: '1.0.0',
      author: 'Platform Team',
      status: 'published',
      tags: ['api', 'overview', 'getting-started'],
    });

    this.documentationCreate({
      category: 'architecture',
      title: 'System Architecture',
      content: '# System Architecture\n\nThis document describes the platform architecture.',
      version: '1.0.0',
      author: 'Architecture Team',
      status: 'published',
      tags: ['architecture', 'system', 'design'],
    });

    // Seed sample runbooks
    this.runbookCreate({
      category: 'incident',
      title: 'Database Connection Issues',
      content: '# Database Connection Issues\n\nThis runbook covers troubleshooting database connection problems.',
      version: '1.0.0',
      author: 'Ops Team',
      status: 'published',
      priority: 'critical',
      tags: ['database', 'incident', 'troubleshooting'],
    });

    this.runbookCreate({
      category: 'deployment',
      title: 'Production Deployment',
      content: '# Production Deployment\n\nSteps for deploying to production.',
      version: '1.0.0',
      author: 'DevOps Team',
      status: 'published',
      priority: 'high',
      tags: ['deployment', 'production', 'ops'],
    });

    // Seed sample FAQs
    this.faqCreate({
      question: 'How do I reset my password?',
      answer: 'To reset your password, go to the login page and click "Forgot Password".',
      category: 'authentication',
      keywords: ['password', 'reset', 'login', 'authentication'],
      status: 'published',
    });

    this.faqCreate({
      question: 'How can I contact support?',
      answer: 'You can contact support via email at support@example.com or through the in-app chat.',
      category: 'support',
      keywords: ['support', 'contact', 'help', 'assistance'],
      status: 'published',
    });

    // Seed sample release
    this.releasePlanCreate({
      version: '1.0.0',
      name: 'Initial Release',
      description: 'First production release of the platform',
      status: 'released',
      riskLevel: 'medium',
      changelog: [{ type: 'feat', description: 'Initial platform launch' }],
    });

    // Seed sample signoffs
    this.signOffCreate({
      stakeholderType: 'executive',
      stakeholderId: 'user-1',
      stakeholderName: 'John CEO',
      area: 'overall',
      status: 'approved',
      evidence: { checklist: ['all_items_complete'] },
    });

    this.signOffCreate({
      stakeholderType: 'security',
      stakeholderId: 'user-2',
      stakeholderName: 'Jane Security',
      area: 'security',
      status: 'approved',
      evidence: { penetration_test: 'passed', audit: 'complete' },
    });
  }
}

export const dataStore = MaturityDataStore.getInstance();
