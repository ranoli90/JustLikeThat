import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KafkaStreamsService {
  private readonly logger = new Logger(KafkaStreamsService.name);

  async createStream(topology: unknown): Promise<void> {
    this.logger.log('Creating Kafka stream');
  }

  async destroyStream(): Promise<void> {
    this.logger.log('Destroying Kafka stream');
  }
}
