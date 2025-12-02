import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ERROR_LOGS: '@analytics/error_logs',
  EVENT_LOGS: '@analytics/event_logs',
  PERFORMANCE_LOGS: '@analytics/performance_logs',
};

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EventCategory = 'user_action' | 'system' | 'navigation' | 'data' | 'sync' | 'other';

export interface ErrorLog {
  id: string;
  timestamp: string;
  error: string;
  errorMessage: string;
  errorStack?: string;
  severity: ErrorSeverity;
  context?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface EventLog {
  id: string;
  timestamp: string;
  eventName: string;
  category: EventCategory;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

const MAX_LOGS = 500;

export class Analytics {
  private static errorLogs: ErrorLog[] = [];
  private static eventLogs: EventLog[] = [];
  private static initialized = false;

  static async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const [savedErrorLogs, savedEventLogs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.EVENT_LOGS),
      ]);

      if (savedErrorLogs) {
        this.errorLogs = JSON.parse(savedErrorLogs);
      }
      if (savedEventLogs) {
        this.eventLogs = JSON.parse(savedEventLogs);
      }

      this.initialized = true;
      console.log('[ANALYTICS] Initialized successfully');
    } catch (error) {
      console.error('[ANALYTICS] Failed to initialize:', error);
    }
  }

  static async trackError(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        id: `error-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        error: typeof error === 'string' ? error : error.name,
        errorMessage: typeof error === 'string' ? error : error.message,
        errorStack: typeof error === 'string' ? undefined : error.stack,
        severity,
        context,
        metadata,
      };

      this.errorLogs.unshift(errorLog);

      if (this.errorLogs.length > MAX_LOGS) {
        this.errorLogs = this.errorLogs.slice(0, MAX_LOGS);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.ERROR_LOGS, JSON.stringify(this.errorLogs));

      console.error(`[ANALYTICS] Error tracked (${severity}):`, errorLog.errorMessage);

      if (severity === 'critical') {
        console.error('[ANALYTICS] CRITICAL ERROR:', {
          error: errorLog.error,
          message: errorLog.errorMessage,
          context: errorLog.context,
          metadata: errorLog.metadata,
        });
      }
    } catch (e) {
      console.error('[ANALYTICS] Failed to track error:', e);
    }
  }

  static async trackEvent(
    eventName: string,
    category: EventCategory = 'other',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const eventLog: EventLog = {
        id: `event-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        eventName,
        category,
        metadata,
      };

      this.eventLogs.unshift(eventLog);

      if (this.eventLogs.length > MAX_LOGS) {
        this.eventLogs = this.eventLogs.slice(0, MAX_LOGS);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.EVENT_LOGS, JSON.stringify(this.eventLogs));

      console.log(`[ANALYTICS] Event tracked: ${eventName} (${category})`);
    } catch (error) {
      console.error('[ANALYTICS] Failed to track event:', error);
    }
  }

  static getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  static getEventLogs(): EventLog[] {
    return [...this.eventLogs];
  }

  static async clearErrorLogs(): Promise<void> {
    this.errorLogs = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.ERROR_LOGS);
    console.log('[ANALYTICS] Error logs cleared');
  }

  static async clearEventLogs(): Promise<void> {
    this.eventLogs = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.EVENT_LOGS);
    console.log('[ANALYTICS] Event logs cleared');
  }

  static async clearAllLogs(): Promise<void> {
    await Promise.all([this.clearErrorLogs(), this.clearEventLogs()]);
    console.log('[ANALYTICS] All logs cleared');
  }

  static getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorLog[];
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    this.errorLogs.forEach((log) => {
      bySeverity[log.severity]++;
    });

    return {
      total: this.errorLogs.length,
      bySeverity,
      recentErrors: this.errorLogs.slice(0, 10),
    };
  }

  static getEventStats(): {
    total: number;
    byCategory: Record<EventCategory, number>;
    recentEvents: EventLog[];
  } {
    const byCategory: Record<EventCategory, number> = {
      user_action: 0,
      system: 0,
      navigation: 0,
      data: 0,
      sync: 0,
      other: 0,
    };

    this.eventLogs.forEach((log) => {
      byCategory[log.category]++;
    });

    return {
      total: this.eventLogs.length,
      byCategory,
      recentEvents: this.eventLogs.slice(0, 10),
    };
  }

  static async exportLogs(): Promise<string> {
    const data = {
      errorLogs: this.errorLogs,
      eventLogs: this.eventLogs,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

export const trackError = (
  error: Error | string,
  severity?: ErrorSeverity,
  context?: string,
  metadata?: Record<string, unknown>
) => Analytics.trackError(error, severity, context, metadata);

export const trackEvent = (
  eventName: string,
  category?: EventCategory,
  metadata?: Record<string, unknown>
) => Analytics.trackEvent(eventName, category, metadata);
