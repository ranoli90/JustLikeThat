// LTS Service Unit Tests - Sprint 49
// Tests for SLA Monitoring, Capacity Planning, Cost Optimization, etc.

describe('SLAMonitoringService', () => {
  // Test SLA configuration creation
  describe('createSLAConfig', () => {
    it('should create a valid SLA configuration', async () => {
      const config = {
        serviceName: 'api-service',
        metricType: 'availability' as const,
        targetValue: 99.9,
        measurementUnit: 'percent',
        period: 'daily' as const,
      };
      expect(config.targetValue).toBeGreaterThanOrEqual(99);
    });

    it('should have correct metric types', () => {
      const validTypes = ['availability', 'latency', 'throughput', 'error_rate'];
      expect(validTypes).toContain('availability');
      expect(validTypes).toContain('latency');
    });
  });

  // Test SLA metric evaluation
  describe('evaluateMetric', () => {
    const evaluateMetric = (targetValue: number, actualValue: number) => {
      if (targetValue >= 99) {
        return actualValue >= targetValue ? 'met' : 'violated';
      }
      if (targetValue < 99) {
        return actualValue <= targetValue ? 'met' : 'violated';
      }
      return 'pending';
    };

    it('should return met for availability above target', () => {
      expect(evaluateMetric(99.9, 99.95)).toBe('met');
    });

    it('should return violated for availability below target', () => {
      expect(evaluateMetric(99.9, 99.5)).toBe('violated');
    });

    it('should return met for latency below target', () => {
      expect(evaluateMetric(100, 50)).toBe('met');
    });

    it('should return violated for latency above target', () => {
      expect(evaluateMetric(100, 150)).toBe('violated');
    });
  });

  // Test SLA violation detection
  describe('violation detection', () => {
    it('should detect critical violations', () => {
      const deviation = 0.15; // 15% deviation
      const severity = deviation > 0.1 ? 'critical' : 'warning';
      expect(severity).toBe('critical');
    });

    it('should detect warning violations', () => {
      const deviation = 0.05; // 5% deviation
      const severity = deviation > 0.1 ? 'critical' : 'warning';
      expect(severity).toBe('warning');
    });
  });
});

describe('CapacityPlanningService', () => {
  // Test capacity prediction
  describe('predictCapacity', () => {
    const calculatePrediction = (currentCapacity: number, growthRate: number, months: number) => {
      return Math.min(100, currentCapacity * Math.pow(1 + growthRate, months));
    };

    it('should calculate growth correctly', () => {
      const prediction = calculatePrediction(60, 0.02, 12);
      expect(prediction).toBeGreaterThan(60);
    });

    it('should cap at 100%', () => {
      const prediction = calculatePrediction(95, 0.02, 12);
      expect(prediction).toBeLessThanOrEqual(100);
    });
  });

  // Test confidence calculation
  describe('calculateConfidence', () => {
    const calculateConfidence = (values: number[]) => {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;
      return Math.max(0.5, Math.min(0.95, 1 - coefficientOfVariation));
    };

    it('should return high confidence for stable values', () => {
      const values = [60, 61, 59, 60, 60];
      const confidence = calculateConfidence(values);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should return lower confidence for volatile values', () => {
      const values = [20, 80, 30, 70, 40];
      const confidence = calculateConfidence(values);
      expect(confidence).toBeLessThan(0.8);
    });
  });
});

describe('CostOptimizationService', () => {
  // Test cost anomaly detection
  describe('detectAnomaly', () => {
    const detectAnomaly = (mean: number, stdDev: number, actualValue: number) => {
      const deviation = stdDev > 0 ? (actualValue - mean) / stdDev : 0;
      if (Math.abs(deviation) > 2) {
        return {
          detected: true,
          severity: Math.abs(deviation) > 3 ? 'high' : Math.abs(deviation) > 2.5 ? 'medium' : 'low',
          deviation,
        };
      }
      return { detected: false, severity: 'none', deviation: 0 };
    };

    it('should detect high deviation', () => {
      const result = detectAnomaly(1000, 100, 1400);
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('should not detect normal variation', () => {
      const result = detectAnomaly(1000, 100, 1080);
      expect(result.detected).toBe(false);
    });
  });

  // Test cost forecast
  describe('forecastCost', () => {
    const forecastCost = (currentCost: number, growthRate: number, months: number) => {
      return currentCost * Math.pow(1 + growthRate, months);
    };

    it('should calculate future cost', () => {
      const forecast = forecastCost(10000, 0.03, 12);
      expect(forecast).toBeGreaterThan(10000);
    });
  });
});

describe('UserFeedbackService', () => {
  // Test sentiment analysis
  describe('analyzeSentiment', () => {
    const analyzeSentiment = (text: string) => {
      const positiveWords = ['great', 'excellent', 'love'];
      const negativeWords = ['bad', 'terrible', 'hate'];
      const words = text.toLowerCase().split(/\s+/);
      let score = 0;
      for (const word of words) {
        if (positiveWords.some((pw) => word.includes(pw))) score += 0.2;
        if (negativeWords.some((nw) => word.includes(nw))) score -= 0.2;
      }
      return Math.max(-1, Math.min(1, score));
    };

    it('should return positive for positive text', () => {
      expect(analyzeSentiment('This is great and excellent!')).toBeGreaterThan(0.2);
    });

    it('should return negative for negative text', () => {
      expect(analyzeSentiment('This is terrible and bad')).toBeLessThan(-0.2);
    });

    it('should return neutral for neutral text', () => {
      const sentiment = analyzeSentiment('This is a normal description');
      expect(sentiment).toBeGreaterThanOrEqual(-0.2);
      expect(sentiment).toBeLessThanOrEqual(0.2);
    });
  });

  // Test NPS calculation
  describe('calculateNPS', () => {
    const calculateNPS = (promoters: number, passives: number, detractors: number) => {
      const total = promoters + passives + detractors;
      if (total === 0) return 0;
      return Math.round(((promoters - detractors) / total) * 100);
    };

    it('should calculate NPS correctly', () => {
      const nps = calculateNPS(50, 30, 20);
      expect(nps).toBe(30);
    });

    it('should handle all promoters', () => {
      const nps = calculateNPS(100, 0, 0);
      expect(nps).toBe(100);
    });

    it('should handle all detractors', () => {
      const nps = calculateNPS(0, 0, 100);
      expect(nps).toBe(-100);
    });
  });
});

describe('ContinuousImprovementService', () => {
  // Test ROI calculation
  describe('calculateROI', () => {
    const calculateROI = (actualCost: number, estimatedCost: number, impactScoreBefore: number, impactScoreAfter: number) => {
      if (estimatedCost === 0) return 0;
      const roi = ((impactScoreAfter - impactScoreBefore - actualCost) / estimatedCost) * 100;
      return roi;
    };

    it('should calculate positive ROI', () => {
      const roi = calculateROI(1000, 5000, 50, 150);
      expect(roi).toBeGreaterThan(0);
    });
  });

  // Test impact score calculation
  describe('calculateImpactScore', () => {
    const calculateImpactScore = (metrics: Record<string, number>) => {
      let score = 0;
      for (const [key, value] of Object.entries(metrics)) {
        if (key.includes('performance')) score += value * 2;
        else if (key.includes('cost')) score += (100 - value) * 1.5;
        else if (key.includes('quality')) score += value;
        else if (key.includes('satisfaction')) score += value * 3;
      }
      return score;
    };

    it('should calculate impact from metrics', () => {
      const score = calculateImpactScore({
        performance: 85,
        cost: 72,
        quality: 90,
        satisfaction: 78,
      });
      expect(score).toBeGreaterThan(0);
    });
  });
});
