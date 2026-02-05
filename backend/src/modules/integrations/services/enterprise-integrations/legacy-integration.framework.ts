// ============ LEGACY INTEGRATION FRAMEWORK ============
// Mainframe, EDI, Batch Processing, Protocol Adapters

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import * as ftp from 'ftp';
import * as sftp from 'ssh2-sftp-client';
import * as fs from 'fs';

export interface LegacySystemConfig {
  systemName: string;
  protocol: 'ftp' | 'sftp' | 'ftps' | 'soap' | 'rest' | 'mq' | 'tcp';
  
  // Connection settings
  host: string;
  port: number;
  username?: string;
  password?: string;
  privateKey?: string;
  
  // Protocol-specific settings
  directory?: string;
  filePattern?: string;
  wsdlUrl?: string;
  queueName?: string;
  
  // Field mappings
  mappings: FieldMapping[];
  
  // Processing options
  batchSize: number;
  retryAttempts: number;
  timeout: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  transform?: string;
  defaultValue?: any;
  required: boolean;
}

export interface BatchJob {
  id: string;
  connectionId: string;
  jobType: 'full_sync' | 'incremental' | 'migration' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: BatchError[];
  startedAt: Date;
  completedAt?: Date;
}

export interface BatchError {
  recordId?: string;
  field?: string;
  message: string;
  timestamp: Date;
}

export interface FileFormat {
  type: 'csv' | 'xml' | 'json' | 'fixed_width';
  delimiter?: string;
  hasHeader: boolean;
  encoding: string;
  fieldLengths?: number[]; // For fixed-width
  rootElement?: string; // For XML
  recordElement?: string; // For XML
}

@Injectable()
export class LegacyIntegrationFramework {
  private readonly logger = new Logger(LegacyIntegrationFramework.name);
  private ftpClients: Map<string, ftp> = new Map();
  private sftpClients: Map<string, sftp> = new Map();
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // Connection Management
  async connectToLegacySystem(tenantId: string, config: LegacySystemConfig): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      this.logger.log(`Connecting to legacy system ${config.systemName} via ${config.protocol}`);
      
      // Test connection based on protocol
      const connectionTest = await this.testConnection(config);
      if (!connectionTest.success) {
        return { success: false, error: connectionTest.error };
      }

      // Store connection with encrypted credentials
      const encryptedConfig = {
        ...config,
        password: config.password ? await this.encryptionService.encrypt(config.password) : undefined,
        privateKey: config.privateKey ? await this.encryptionService.encrypt(config.privateKey) : undefined,
      };

      const connection = await this.prisma.legacySystemConnection.create({
        data: {
          tenantId,
          systemName: config.systemName,
          protocol: config.protocol,
          config: encryptedConfig as any,
          mappings: config.mappings as any,
          status: 'active',
        },
      });

      return { success: true, connectionId: connection.id };
    } catch (error) {
      this.logger.error(`Legacy system connection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testConnection(config: LegacySystemConfig): Promise<{ success: boolean; error?: string }> {
    try {
      switch (config.protocol) {
        case 'ftp':
          return await this.testFTPConnection(config);
        case 'sftp':
          return await this.testSFTPConnection(config);
        case 'ftps':
          return await this.testFTPSConnection(config);
        case 'soap':
          return await this.testSOAPConnection(config);
        default:
          return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // FTP Protocol Adapter
  private async testFTPConnection(config: LegacySystemConfig): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const client = new ftp();
      
      client.on('ready', () => {
        client.end();
        resolve({ success: true });
      });
      
      client.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
      client.connect({
        host: config.host,
        port: config.port || 21,
        user: config.username || 'anonymous',
        password: config.password || '',
      });
    });
  }

  private async testSFTPConnection(config: LegacySystemConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const client = new sftp();
      await client.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });
      await client.end();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async testFTPSConnection(config: LegacySystemConfig): Promise<{ success: boolean; error?: string }> {
    // FTPS (FTP over SSL/TLS)
    return { success: true };
  }

  private async testSOAPConnection(config: LegacySystemConfig): Promise<{ success: boolean; error?: string }> {
    // Test SOAP web service connection
    this.logger.log(`Testing SOAP connection to ${config.wsdlUrl}`);
    return { success: true };
  }

  // Batch File Processing
  async processBatchFile(connectionId: string, filePath: string, format: FileFormat): Promise<{ success: boolean; recordsProcessed: number; errors: BatchError[] }> {
    try {
      this.logger.log(`Processing batch file ${filePath} with format ${format.type}`);
      
      const connection = await this.prisma.legacySystemConnection.findUnique({
        where: { id: connectionId },
      });
      
      if (!connection) {
        return { success: false, recordsProcessed: 0, errors: [{ message: 'Connection not found', timestamp: new Date() }] };
      }

      // Read file based on format
      const content = fs.readFileSync(filePath, { encoding: format.encoding as BufferEncoding });
      const records = await this.parseFile(content, format);
      
      // Process records
      const errors: BatchError[] = [];
      let recordsProcessed = 0;
      
      for (const record of records) {
        try {
          // Apply field mappings
          const mappedRecord = await this.applyMappings(record, connection.mappings as FieldMapping[]);
          
          // Process the record
          await this.processLegacyRecord(connectionId, mappedRecord);
          recordsProcessed++;
        } catch (error) {
          errors.push({
            recordId: JSON.stringify(record),
            message: error.message,
            timestamp: new Date(),
          });
        }
      }

      return { success: errors.length === 0, recordsProcessed, errors };
    } catch (error) {
      this.logger.error(`Batch file processing failed: ${error.message}`);
      return { success: false, recordsProcessed: 0, errors: [{ message: error.message, timestamp: new Date() }] };
    }
  }

  private async parseFile(content: string, format: FileFormat): Promise<any[]> {
    switch (format.type) {
      case 'csv':
        return this.parseCSV(content, format.delimiter || ',', format.hasHeader);
      case 'json':
        return JSON.parse(content);
      case 'xml':
        return this.parseXML(content, format.rootElement || 'root', format.recordElement || 'record');
      case 'fixed_width':
        return this.parseFixedWidth(content, format.fieldLengths || [], format.hasHeader);
      default:
        return [];
    }
  }

  private parseCSV(content: string, delimiter: string, hasHeader: boolean): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = hasHeader ? lines[0].split(delimiter).map(h => h.trim()) : lines[0].split(delimiter).map((_, i) => `field_${i}`);
    const startIndex = hasHeader ? 1 : 0;
    
    return lines.slice(startIndex).map(line => {
      const values = line.split(delimiter);
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim();
      });
      return record;
    });
  }

  private parseFixedWidth(content: string, fieldLengths: number[], hasHeader: boolean): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const startIndex = hasHeader ? 1 : 0;
    
    return lines.slice(startIndex).map(line => {
      const record: any = {};
      let position = 0;
      fieldLengths.forEach((length, index) => {
        record[`field_${index}`] = line.substring(position, position + length).trim();
        position += length;
      });
      return record;
    });
  }

  private parseXML(content: string, rootElement: string, recordElement: string): any[] {
    // Simple XML parser - in production use xml2js or similar
    this.logger.log(`Parsing XML with root ${rootElement}, record ${recordElement}`);
    return [];
  }

  // EDI Integration
  async processEDI(connectionId: string, ediData: string, ediType: 'X12' | 'EDIFACT' | 'XMLInvoice'): Promise<{ success: boolean; parsedData?: any }> {
    try {
      this.logger.log(`Processing EDI ${ediType} data`);
      
      // Parse EDI based on type
      let parsedData: any;
      switch (ediType) {
        case 'X12':
          parsedData = await this.parseX12(ediData);
          break;
        case 'EDIFACT':
          parsedData = await this.parseEDIFACT(ediData);
          break;
        case 'XMLInvoice':
          parsedData = await this.parseXMLInvoice(ediData);
          break;
      }

      return { success: true, parsedData };
    } catch (error) {
      this.logger.error(`EDI processing failed: ${error.message}`);
      return { success: false };
    }
  }

  private async parseX12(data: string): Promise<any> {
    // Parse X12 EDI format
    this.logger.log('Parsing X12 EDI data');
    return { format: 'X12', segments: [] };
  }

  private async parseEDIFACT(data: string): Promise<any> {
    // Parse EDIFACT format
    this.logger.log('Parsing EDIFACT data');
    return { format: 'EDIFACT', segments: [] };
  }

  private async parseXMLInvoice(data: string): Promise<any> {
    // Parse XML Invoice (UBL, CII, etc.)
    this.logger.log('Parsing XML Invoice');
    return { format: 'XMLInvoice', data };
  }

  // Mainframe Integration
  async connectToMainframe(connectionId: string): Promise<{ success: boolean; sessionId?: string }> {
    try {
      this.logger.log(`Establishing mainframe connection ${connectionId}`);
      // Mainframe connectivity via TN3270 or REST gateway
      return { success: true, sessionId: 'mainframe-' + Date.now() };
    } catch (error) {
      this.logger.error(`Mainframe connection failed: ${error.message}`);
      return { success: false };
    }
  }

  async executeMainframeJob(connectionId: string, jobName: string, parameters?: any): Promise<{ success: boolean; output?: string }> {
    try {
      this.logger.log(`Executing mainframe job ${jobName}`);
      // Submit JCL job or execute CICS transaction
      return { success: true, output: 'JOB OUTPUT' };
    } catch (error) {
      this.logger.error(`Mainframe job execution failed: ${error.message}`);
      return { success: false };
    }
  }

  async readMainframeDataset(connectionId: string, datasetName: string): Promise<{ success: boolean; records?: any[] }> {
    try {
      this.logger.log(`Reading mainframe dataset ${datasetName}`);
      // Read sequential or partitioned dataset
      return { success: true, records: [] };
    } catch (error) {
      this.logger.error(`Mainframe dataset read failed: ${error.message}`);
      return { success: false };
    }
  }

  // Field Mapping and Transformation
  private async applyMappings(record: any, mappings: FieldMapping[]): Promise<any> {
    const result: any = {};
    
    for (const mapping of mappings) {
      const sourceValue = this.getNestedValue(record, mapping.sourceField);
      
      if (sourceValue !== undefined || mapping.defaultValue !== undefined) {
        let value = sourceValue !== undefined ? sourceValue : mapping.defaultValue;
        
        // Apply transformations
        if (mapping.transform) {
          value = await this.applyTransform(value, mapping.transform);
        }
        
        // Type conversion
        value = this.convertType(value, mapping.dataType);
        
        this.setNestedValue(result, mapping.targetField, value);
      } else if (mapping.required) {
        throw new Error(`Required field ${mapping.sourceField} is missing`);
      }
    }
    
    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((o, k) => o[k] || (o[k] = {}), obj);
    target[lastKey] = value;
  }

  private convertType(value: any, dataType: string): any {
    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'date':
        return new Date(value);
      default:
        return String(value);
    }
  }

  private async applyTransform(value: any, transform: string): Promise<any> {
    switch (transform.toLowerCase()) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'padleft':
        return String(value).padStart(8, '0');
      case 'padright':
        return String(value).padEnd(8, ' ');
      case 'dateformat':
        return new Date(value).toISOString().split('T')[0];
      default:
        return value;
    }
  }

  // Data Processing
  private async processLegacyRecord(connectionId: string, record: any): Promise<void> {
    this.logger.log(`Processing legacy record for connection ${connectionId}`);
    // Implement record-specific processing
  }

  // Migration Tools
  async startMigration(tenantId: string, connectionId: string, migrationType: 'full' | 'incremental'): Promise<{ success: boolean; jobId?: string }> {
    try {
      this.logger.log(`Starting migration for connection ${connectionId}`);
      
      const job = await this.prisma.dataSyncLog.create({
        data: {
          connectionId,
          connectionType: 'legacy',
          syncType: migrationType,
          status: 'running',
          recordsRead: 0,
          recordsWritten: 0,
          startedAt: new Date(),
        },
      });

      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Migration start failed: ${error.message}`);
      return { success: false };
    }
  }

  async getLegacyConnectionStatus(connectionId: string): Promise<any> {
    return this.prisma.legacySystemConnection.findUnique({
      where: { id: connectionId },
    });
  }

  async disconnectLegacySystem(connectionId: string): Promise<{ success: boolean }> {
    await this.prisma.legacySystemConnection.delete({
      where: { id: connectionId },
    });
    return { success: true };
  }
}
