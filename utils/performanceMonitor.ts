import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, Platform } from 'react-native';

const STORAGE_KEY = '@performance/metrics';
const MAX_METRICS = 1000;

export interface PerformanceMetric {
  id: string;
  name: string;
  category: 'render' | 'network' | 'storage' | 'computation' | 'navigation' | 'other';
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface PerformanceStats {
  totalMetrics: number;
  averageDuration: number;
  slowestOperations: PerformanceMetric[];
  byCategory: Record<string, { count: number; avgDuration: number }>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static activeMetrics: Map<string, PerformanceMetric> = new Map();
  private static initialized = false;

  static async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const savedMetrics = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedMetrics) {
        this.metrics = JSON.parse(savedMetrics);
      }
      this.initialized = true;
      console.log('[PERFORMANCE] Initialized successfully');
    } catch (error) {
      console.error('[PERFORMANCE] Failed to initialize:', error);
    }
  }

  static startMeasure(
    name: string,
    category: PerformanceMetric['category'] = 'other',
    metadata?: Record<string, unknown>
  ): string {
    const id = `perf-${Date.now()}-${Math.random()}`;
    
    const metric: PerformanceMetric = {
      id,
      name,
      category,
      startTime: performance.now(),
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.activeMetrics.set(id, metric);
    console.log(`[PERFORMANCE] Started measuring: ${name}`);
    
    return id;
  }

  static async endMeasure(id: string): Promise<void> {
    const metric = this.activeMetrics.get(id);
    
    if (!metric) {
      console.warn(`[PERFORMANCE] No active metric found for id: ${id}`);
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeMetrics.delete(id);
    this.metrics.unshift(metric);

    if (this.metrics.length > MAX_METRICS) {
      this.metrics = this.metrics.slice(0, MAX_METRICS);
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[PERFORMANCE] Failed to save metric:', error);
    }

    console.log(`[PERFORMANCE] ${metric.name} took ${metric.duration.toFixed(2)}ms`);

    if (metric.duration > 1000) {
      console.warn(`[PERFORMANCE] Slow operation detected: ${metric.name} (${metric.duration.toFixed(2)}ms)`);
    }
  }

  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'other',
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const id = this.startMeasure(name, category, metadata);
    
    try {
      const result = await fn();
      await this.endMeasure(id);
      return result;
    } catch (error) {
      await this.endMeasure(id);
      throw error;
    }
  }

  static measureSync<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'other',
    metadata?: Record<string, unknown>
  ): T {
    const id = this.startMeasure(name, category, metadata);
    
    try {
      const result = fn();
      this.endMeasure(id);
      return result;
    } catch (error) {
      this.endMeasure(id);
      throw error;
    }
  }

  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  static getStats(): PerformanceStats {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;

    const slowestOperations = [...completedMetrics]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const byCategory: Record<string, { count: number; avgDuration: number }> = {};
    
    for (const metric of completedMetrics) {
      if (!byCategory[metric.category]) {
        byCategory[metric.category] = { count: 0, avgDuration: 0 };
      }
      byCategory[metric.category].count++;
    }

    for (const category in byCategory) {
      const categoryMetrics = completedMetrics.filter(m => m.category === category);
      const categoryTotal = categoryMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      byCategory[category].avgDuration = categoryTotal / categoryMetrics.length;
    }

    return {
      totalMetrics: completedMetrics.length,
      averageDuration,
      slowestOperations,
      byCategory,
    };
  }

  static async clearMetrics(): Promise<void> {
    this.metrics = [];
    this.activeMetrics.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[PERFORMANCE] Metrics cleared');
  }

  static logStats(): void {
    const stats = this.getStats();
    
    console.log('[PERFORMANCE] ===== Performance Stats =====');
    console.log(`Total metrics: ${stats.totalMetrics}`);
    console.log(`Average duration: ${stats.averageDuration.toFixed(2)}ms`);
    
    console.log('\nBy Category:');
    for (const [category, data] of Object.entries(stats.byCategory)) {
      console.log(`  ${category}: ${data.count} operations, avg ${data.avgDuration.toFixed(2)}ms`);
    }

    if (stats.slowestOperations.length > 0) {
      console.log('\nSlowest Operations:');
      stats.slowestOperations.forEach((op, index) => {
        console.log(`  ${index + 1}. ${op.name}: ${op.duration?.toFixed(2)}ms`);
      });
    }
  }

  static measureInteraction(name: string, callback: () => void): void {
    const handle = InteractionManager.createInteractionHandle();
    const id = this.startMeasure(name, 'other', { type: 'interaction' });

    InteractionManager.runAfterInteractions(() => {
      this.endMeasure(id);
      InteractionManager.clearInteractionHandle(handle);
      callback();
    });
  }

  static async exportMetrics(): Promise<string> {
    const data = {
      metrics: this.metrics,
      stats: this.getStats(),
      platform: Platform.OS,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>,
  category?: PerformanceMetric['category'],
  metadata?: Record<string, unknown>
): Promise<T> => PerformanceMonitor.measure(name, fn, category, metadata);

export const measurePerformanceSync = <T>(
  name: string,
  fn: () => T,
  category?: PerformanceMetric['category'],
  metadata?: Record<string, unknown>
): T => PerformanceMonitor.measureSync(name, fn, category, metadata);
