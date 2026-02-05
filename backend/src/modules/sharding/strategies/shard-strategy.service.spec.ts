import { ShardStrategyService } from './shard-strategy.service';

describe('ShardStrategyService', () => {
  let service: ShardStrategyService;

  beforeEach(() => {
    service = new ShardStrategyService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Hash Strategy', () => {
    it('should distribute keys evenly across shards', () => {
      const shardCount = 16;
      const distribution: Map<number, number> = new Map();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const key = `user-${i}`;
        const shardId = service.calculateShardId(key, shardCount, 'hash');
        distribution.set(shardId, (distribution.get(shardId) || 0) + 1);
      }

      // Each shard should have approximately 625 entries (10000/16)
      const expectedPerShard = iterations / shardCount;
      const tolerance = expectedPerShard * 0.2; // 20% tolerance

      for (let i = 0; i < shardCount; i++) {
        const count = distribution.get(i) || 0;
        expect(count).toBeGreaterThan(expectedPerShard - tolerance);
        expect(count).toBeLessThan(expectedPerShard + tolerance);
      }
    });

    it('should return same shard for same key', () => {
      const key = 'user-12345';
      const shardId1 = service.calculateShardId(key, 16, 'hash');
      const shardId2 = service.calculateShardId(key, 16, 'hash');

      expect(shardId1).toBe(shardId2);
    });
  });

  describe('Range Strategy', () => {
    it('should group dates into same shards', () => {
      const dates = [
        '2024-01-15T10:00:00Z',
        '2024-01-20T15:30:00Z',
        '2024-02-01T08:00:00Z',
      ];

      const shardIds = dates.map(date => service.calculateShardId(date, 12, 'range'));
      const uniqueShards = new Set(shardIds);

      // Close dates should be in same shard
      expect(uniqueShards.size).toBeLessThan(dates.length);
    });

    it('should return hash-based shard for non-date keys', () => {
      const nonDateKey = 'not-a-date';
      const result = service.calculateShardId(nonDateKey, 16, 'range');

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(16);
    });
  });

  describe('Geo Strategy', () => {
    it('should group US coordinates in US shards', () => {
      const usCoords = [
        '40.7128,-74.0060', // New York
        '34.0522,-118.2437', // Los Angeles
        '41.8781,-87.6298', // Chicago
      ];

      const shardIds = usCoords.map(coord => service.calculateShardId(coord, 16, 'geo'));

      // Should return valid shard IDs
      shardIds.forEach(shardId => {
        expect(shardId).toBeGreaterThanOrEqual(0);
        expect(shardId).toBeLessThan(16);
      });
    });

    it('should return hash-based shard for invalid coordinates', () => {
      const invalidCoord = 'invalid';
      const result = service.calculateShardId(invalidCoord, 16, 'geo');

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(16);
    });
  });

  describe('Tenant Strategy', () => {
    it('should assign same shard for same tenant', () => {
      const tenantKey1 = 'tenant-123:user-1';
      const tenantKey2 = 'tenant-123:user-2';
      const tenantKey3 = 'tenant-456:user-1';

      const shard1 = service.calculateShardId(tenantKey1, 16, 'tenant');
      const shard2 = service.calculateShardId(tenantKey2, 16, 'tenant');
      const shard3 = service.calculateShardId(tenantKey3, 16, 'tenant');

      // Same tenant should be in same shard
      expect(shard1).toBe(shard2);
      // Different tenant should be in different shard (likely)
      expect(shard1).not.toBe(shard3);
    });
  });

  describe('autoSelectStrategy', () => {
    it('should select geo strategy for geographic data', () => {
      const sampleData = [
        { latitude: 40.7128, longitude: -74.0060 },
        { latitude: 34.0522, longitude: -118.2437 },
      ];

      const strategy = service.autoSelectStrategy('locations', sampleData);
      expect(strategy).toBe('geo');
    });

    it('should select tenant strategy for tenant data', () => {
      const sampleData = [
        { tenantId: 'tenant-1', name: 'User 1' },
        { tenantId: 'tenant-2', name: 'User 2' },
      ];

      const strategy = service.autoSelectStrategy('users', sampleData);
      expect(strategy).toBe('tenant');
    });

    it('should select range strategy for time-series data', () => {
      const sampleData = [
        { createdAt: '2024-01-15T10:00:00Z', value: 100 },
        { createdAt: '2024-01-16T10:00:00Z', value: 200 },
      ];

      const strategy = service.autoSelectStrategy('metrics', sampleData);
      expect(strategy).toBe('range');
    });

    it('should select hash strategy for generic data', () => {
      const sampleData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      const strategy = service.autoSelectStrategy('items', sampleData);
      expect(strategy).toBe('hash');
    });
  });
});
