import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Admin, Producer, Consumer, logLevel } from 'kafkajs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private admin: Admin;
  private readonly brokers: string[];

  constructor(private readonly prisma: PrismaService) {
    this.brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: 'gateway-service',
      brokers: this.brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });

    this.admin = this.kafka.admin();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      await this.initializeTopics();
      this.logger.log('Kafka service initialized');
    } catch (error) {
      this.logger.warn(`Kafka initialization failed, running in standalone mode: ${error.message}`);
    }
  }

  private async connect(): Promise<void> {
    await this.admin.connect();
    this.logger.log(`Connected to Kafka brokers: ${this.brokers.join(', ')}`);
  }

  private async initializeTopics(): Promise<void> {
    const topics = [
      { topic: 'applications', numPartitions: 32, replicationFactor: 3 },
      { topic: 'users', numPartitions: 32, replicationFactor: 3 },
      { topic: 'auth-events', numPartitions: 16, replicationFactor: 3 },
      { topic: 'notifications', numPartitions: 16, replicationFactor: 3 },
      { topic: 'analytics', numPartitions: 32, replicationFactor: 3 },
      { topic: 'metrics', numPartitions: 16, replicationFactor: 3 },
      { topic: 'dead-letter', numPartitions: 8, replicationFactor: 3 },
    ];

    try {
      const existingTopics = await this.admin.listTopics();
      const topicsToCreate = topics.filter(t => !existingTopics.includes(t.topic));

      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({
          topics: topicsToCreate,
          waitForLeaders: true,
        });
        this.logger.log(`Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to create topics: ${error.message}`);
    }
  }

  async createTopic(topic: string, partitions?: number, replicationFactor?: number): Promise<void> {
    const config = await this.prisma.messageQueueConfig.findUnique({
      where: { topic },
    });

    await this.admin.createTopics({
      topics: [{
        topic,
        numPartitions: partitions || config?.partitions || 32,
        replicationFactor: replicationFactor || config?.replicationFactor || 3,
      }],
      waitForLeaders: true,
    });

    if (!config) {
      await this.prisma.messageQueueConfig.create({
        data: {
          topic,
          partitions: partitions || 32,
          replicationFactor: replicationFactor || 3,
          retentionMs: 604800000, // 7 days
        },
      });
    }
  }

  async deleteTopic(topic: string): Promise<void> {
    await this.admin.deleteTopics({ topics: [topic] });
    await this.prisma.messageQueueConfig.delete({ where: { topic } });
  }

  async getTopics(): Promise<any[]> {
    const topics = await this.admin.listTopics();
    const metadata = await this.admin.fetchTopicMetadata({ topics });
    
    return metadata.topics.map(t => ({
      name: t.name,
      partitions: t.partitions.map(p => ({
        id: p.partitionId,
        leader: p.leader,
        replicas: p.replicas,
        isr: p.isr,
      })),
    }));
  }

  async getTopicConfig(topic: string): Promise<any> {
    const configs = await this.admin.fetchTopicConfig(topic);
    return configs;
  }

  async getConsumerGroups(): Promise<any[]> {
    const groups = await this.admin.listGroups();
    return Promise.all(
      groups.map(async (group) => {
        const description = await this.admin.describeGroups([group.groupId]);
        return {
          groupId: group.groupId,
          protocolType: description[0]?.protocolType,
          members: description[0]?.members.length || 0,
        };
      }),
    );
  }

  async getBrokerInfo(): Promise<any[]> {
    const brokers = await this.admin.describeCluster();
    return brokers.brokers.map(b => ({
      nodeId: b.nodeId,
      host: b.host,
      port: b.port,
      rack: b.rack,
    }));
  }

  async updateTopicConfig(topic: string, config: Record<string, string>): Promise<void> {
    await this.admin.alterTopicConfig(topic, config);
  }

  async getTopicOffsets(topic: string): Promise<any[]> {
    const offsets = await this.admin.fetchTopicOffsets(topic);
    return offsets;
  }

  async getEarliestOffsets(topic: string): Promise<any[]> {
    const offsets = await this.admin.fetchEarliestOffsets(topic);
    return offsets;
  }

  async getLatestOffsets(topic: string): Promise<any[]> {
    const offsets = await this.admin.fetchLatestOffsets(topic);
    return offsets;
  }

  async reassignPartitions(assignments: any[]): Promise<void> {
    await this.admin.reassignPartitions({
      version: 1,
      assignment: assignments,
    });
  }

  getProducer(): Producer {
    return this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  getConsumer(groupId: string): Consumer {
    return this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        retries: 10,
      },
    });
  }

  getKafka(): Kafka {
    return this.kafka;
  }
}
