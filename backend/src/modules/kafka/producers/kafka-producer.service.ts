import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);

  async send(topic: string, message: unknown): Promise<void> {
    this.logger.log(`Sending message to topic: ${topic}`);
  }

  async sendBatch(topic: string, messages: unknown[]): Promise<void> {
    this.logger.log(`Sending batch of ${messages.length} messages to topic: ${topic}`);
  }
}
