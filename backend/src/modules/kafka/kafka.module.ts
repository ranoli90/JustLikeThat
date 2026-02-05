import { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaProducerService } from './producers/kafka-producer.service';
import { KafkaConsumerService } from './consumers/kafka-consumer.service';
import { KafkaStreamsService } from './streams/kafka-streams.service';

@Global()
@Module({
  providers: [
    KafkaService,
    KafkaProducerService,
    KafkaConsumerService,
    KafkaStreamsService,
  ],
  exports: [
    KafkaService,
    KafkaProducerService,
    KafkaConsumerService,
    KafkaStreamsService,
  ],
})
export class KafkaModule {}
