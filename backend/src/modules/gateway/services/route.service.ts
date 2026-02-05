import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Route, RouteQueryDto, CreateRouteDto, UpdateRouteDto } from '../../interfaces/gateway.interface';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);
  private routeCache: Map<string, Route> = new Map();
  private routeTree: Map<string, Route[]> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.initializeRoutes();
  }

  private async initializeRoutes(): Promise<void> {
    try {
      const routes = await this.prisma.gatewayRoute.findMany({
        where: { active: true },
      });
      
      for (const route of routes) {
        this.cacheRoute(this.mapToRoute(route));
      }
      
      this.logger.log(`Initialized ${routes.length} gateway routes`);
    } catch (error) {
      this.logger.warn('Failed to load routes from database, using defaults');
      this.initializeDefaultRoutes();
    }
  }

  private initializeDefaultRoutes(): void {
    const defaultRoutes: Route[] = [
      {
        id: 'auth-1',
        path: '/api/v1/auth',
        method: '*',
        targetService: 'auth-service',
        stripPrefix: false,
        preserveHost: false,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-1',
        path: '/api/v1/users',
        method: '*',
        targetService: 'user-service',
        stripPrefix: false,
        preserveHost: false,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'application-1',
        path: '/api/v1/applications',
        method: '*',
        targetService: 'application-service',
        stripPrefix: false,
        preserveHost: false,
        active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const route of defaultRoutes) {
      this.cacheRoute(route);
    }
  }

  async findAll(query: RouteQueryDto): Promise<{ data: Route[]; total: number }> {
    const where: any = {};
    
    if (query.targetService) {
      where.targetService = query.targetService;
    }
    if (query.method) {
      where.method = query.method;
    }
    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [data, total] = await Promise.all([
      this.prisma.gatewayRoute.findMany({
        where,
        skip: query.skip || 0,
        take: query.take || 100,
        orderBy: { priority: 'desc' },
      }),
      this.prisma.gatewayRoute.count({ where }),
    ]);

    return {
      data: data.map(r => this.mapToRoute(r)),
      total,
    };
  }

  async findOne(id: string): Promise<Route | null> {
    // Check cache first
    const cached = this.routeCache.get(id);
    if (cached) return cached;

    const route = await this.prisma.gatewayRoute.findUnique({
      where: { id },
    });

    if (route) {
      const mappedRoute = this.mapToRoute(route);
      this.cacheRoute(mappedRoute);
      return mappedRoute;
    }

    return null;
  }

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const route = await this.prisma.gatewayRoute.create({
      data: {
        path: createRouteDto.path,
        method: createRouteDto.method,
        targetService: createRouteDto.targetService,
        targetPath: createRouteDto.targetPath,
        plugins: createRouteDto.plugins,
        timeout: createRouteDto.timeout,
        retries: createRouteDto.retries,
        stripPrefix: createRouteDto.stripPrefix ?? false,
        preserveHost: createRouteDto.preserveHost ?? false,
        active: createRouteDto.active ?? true,
      },
    });

    const mappedRoute = this.mapToRoute(route);
    this.cacheRoute(mappedRoute);
    this.rebuildRouteTree();

    return mappedRoute;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.prisma.gatewayRoute.update({
      where: { id },
      data: {
        path: updateRouteDto.path,
        method: updateRouteDto.method,
        targetService: updateRouteDto.targetService,
        targetPath: updateRouteDto.targetPath,
        plugins: updateRouteDto.plugins,
        timeout: updateRouteDto.timeout,
        retries: updateRouteDto.retries,
        stripPrefix: updateRouteDto.stripPrefix,
        preserveHost: updateRouteDto.preserveHost,
        active: updateRouteDto.active,
      },
    });

    const mappedRoute = this.mapToRoute(route);
    this.cacheRoute(mappedRoute);
    this.rebuildRouteTree();

    return mappedRoute;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.gatewayRoute.delete({
      where: { id },
    });

    this.routeCache.delete(id);
    this.rebuildRouteTree();
  }

  async findMatchingRoute(path: string, method: string): Promise<Route | null> {
    // Try exact match first
    const exactMatch = this.routeCache.get(`${method}:${path}`);
    if (exactMatch) return exactMatch;

    // Try wildcard method match
    const wildcardPath = `*:${path}`;
    const wildcardMatch = this.routeCache.get(wildcardPath);
    if (wildcardMatch) return wildcardMatch;

    // Try prefix matching
    const segments = path.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
      const prefixPath = `${method}:/${segments.slice(0, i).join('/')}`;
      const prefixMatch = this.findPrefixMatch(prefixPath);
      if (prefixMatch) return prefixMatch;
    }

    return null;
  }

  private findPrefixMatch(path: string): Route | null {
    const wildcardMethod = `*:${path}`;
    
    for (const [key, route] of this.routeCache) {
      if (key.endsWith('*') && path.startsWith(key.replace('*', ''))) {
        return route;
      }
      if (key === wildcardMethod) {
        return route;
      }
    }

    return null;
  }

  private cacheRoute(route: Route): void {
    this.routeCache.set(`${route.method}:${route.path}`, route);
    this.routeCache.set(route.id, route);
  }

  private rebuildRouteTree(): void {
    this.routeTree.clear();
    
    for (const [key, route] of this.routeCache) {
      if (key.includes(':')) {
        const [method, path] = key.split(':');
        const group = path.split('/')[1] || 'root';
        
        if (!this.routeTree.has(group)) {
          this.routeTree.set(group, []);
        }
        this.routeTree.get(group)!.push(route);
      }
    }
  }

  private mapToRoute(data: any): Route {
    return {
      id: data.id,
      path: data.path,
      method: data.method,
      targetService: data.targetService,
      targetPath: data.targetPath,
      plugins: data.plugins,
      timeout: data.timeout,
      retries: data.retries,
      stripPrefix: data.stripPrefix,
      preserveHost: data.preserveHost,
      active: data.active,
      priority: data.priority || 100,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async getStatistics(): Promise<any> {
    const totalRoutes = this.routeCache.size;
    const activeServices = new Set(
      Array.from(this.routeCache.values()).map(r => r.targetService),
    ).size;

    return {
      totalRoutes,
      activeServices,
      cachedRoutes: this.routeCache.size,
      timestamp: new Date(),
    };
  }

  async getThroughput(timeRange: string): Promise<any> {
    // Placeholder for metrics retrieval
    return {
      timeRange,
      requestsPerSecond: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
    };
  }
}
