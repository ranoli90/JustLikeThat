import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);

  async subscribe(topic: string, handler: (message: unknown) => void): Promise<void> {
    this.logger.log(`Subscribing to topic: ${topic}`);
  }

  async unsubscribe(topic: string): Promise<void> {
    this.logger.log(`Unsubscribing from topic: ${topic}`);
  }
}
