import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { ClickHouseService } from './clickhouse.service';
import { KafkaService } from '../kafka/kafka.service';

// Mock PrismaService
const mockPrisma = {
  analyticsEvent: {
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  dashboard: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  metric: {
    create: jest.fn(),
  },
  widgetTemplate: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// Mock ClickHouseService
const mockClickHouse = {
  insertEvent: jest.fn(),
  getEventCount: jest.fn(),
  query: jest.fn(),
  getAggregatedMetrics: jest.fn(),
};

// Mock KafkaService
const mockKafka = {
  produce: jest.fn(),
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: ClickHouseService, useValue: mockClickHouse },
        { provide: KafkaService, useValue: mockKafka },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track an event and publish to Kafka', async () => {
      const event = {
        eventType: 'page_view',
        userId: 'user-123',
        sessionId: 'session-456',
        properties: { page: '/dashboard' },
      };

      await service.trackEvent(event);

      expect(mockKafka.produce).toHaveBeenCalledWith(
        'analytics-events',
        expect.objectContaining({
          key: 'user-123',
          value: expect.stringContaining('page_view'),
        })
      );
    });

    it('should flush event buffer when full', async () => {
      // Fill buffer
      for (let i = 0; i < 100; i++) {
        await service.trackEvent({
          eventType: 'test_event',
          properties: {},
        });
      }

      expect(mockClickHouse.insertEvent).toHaveBeenCalled();
      expect(mockPrisma.analyticsEvent.createMany).toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should return paginated events', async () => {
      const mockEvents = [
        { id: '1', eventType: 'page_view', properties: {} },
        { id: '2', eventType: 'click', properties: {} },
      ];

      mockPrisma.analyticsEvent.findMany.mockResolvedValue(mockEvents);
      mockPrisma.analyticsEvent.count.mockResolvedValue(2);

      const result = await service.getEvents(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.events).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter events by eventType', async () => {
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([]);
      mockPrisma.analyticsEvent.count.mockResolvedValue(0);

      await service.getEvents(
        { eventType: 'page_view' },
        { page: 1, limit: 10 }
      );

      expect(mockPrisma.analyticsEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: 'page_view',
          }),
        })
      );
    });
  });

  describe('dashboard management', () => {
    it('should create a dashboard', async () => {
      const dashboardData = {
        userId: 'user-123',
        name: 'My Dashboard',
        layout: { columns: 12 },
        widgets: [],
      };

      mockPrisma.dashboard.create.mockResolvedValue({
        id: 'dashboard-1',
        ...dashboardData,
        isPublic: false,
      });

      const result = await service.createDashboard(
        dashboardData.userId,
        dashboardData
      );

      expect(result.name).toBe('My Dashboard');
      expect(mockPrisma.dashboard.create).toHaveBeenCalled();
    });

    it('should generate share token for public dashboards', async () => {
      mockPrisma.dashboard.create.mockResolvedValue({
        id: 'dashboard-1',
        userId: 'user-123',
        name: 'Public Dashboard',
        layout: {},
        widgets: [],
        isPublic: true,
        shareToken: 'test-token',
      });

      const result = await service.createDashboard('user-123', {
        name: 'Public Dashboard',
        layout: {},
        widgets: [],
        isPublic: true,
      });

      expect(result.isPublic).toBe(true);
      expect(result.shareToken).toBeDefined();
    });
  });

  describe('getEventCount', () => {
    it('should return event count from ClickHouse', async () => {
      mockClickHouse.getEventCount.mockResolvedValue(1500);

      const count = await service.getEventCount('page_view');

      expect(count).toBe(1500);
      expect(mockClickHouse.getEventCount).toHaveBeenCalledWith(
        'page_view',
        undefined,
        undefined
      );
    });

    it('should filter by date range', async () => {
      mockClickHouse.getEventCount.mockResolvedValue(100);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await service.getEventCount('page_view', startDate, endDate);

      expect(mockClickHouse.getEventCount).toHaveBeenCalledWith(
        'page_view',
        startDate,
        endDate
      );
    });
  });
});
