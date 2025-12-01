import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type {
  DateReminder,
  NotificationSettings,
  UpcomingEvent,
  DateReminderType,
  Lease,
  BusinessDocument,
  Invoice,
  Payment,
  MaintenanceSchedule,
  Todo,
  PropertyItem,
  TenantId,
  UserId,
} from '@/types';

const STORAGE_KEYS = {
  REMINDERS: '@app/date_reminders',
  NOTIFICATION_SETTINGS: '@app/notification_settings',
};

const DEFAULT_SETTINGS: Omit<NotificationSettings, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
  enabled: true,
  lease_start_days: [7, 1],
  lease_end_days: [60, 30, 7, 1],
  lease_renewal_days: [60, 30],
  document_expiry_days: [30, 14, 7, 1],
  invoice_due_days: [7, 3, 1],
  payment_due_days: [7, 3, 1],
  maintenance_scheduled_days: [7, 3, 1],
  todo_due_days: [3, 1],
  warranty_expiry_days: [30, 14, 7],
  push_notifications_enabled: true,
  email_notifications_enabled: false,
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const [NotificationContext, useNotifications] = createContextHook(() => {
  const [reminders, setReminders] = useState<DateReminder[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [savedReminders, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REMINDERS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS),
      ]);

      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveReminders = useCallback(async (data: DateReminder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }, []);

  const saveSettings = useCallback(async (data: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    requestPermissions();
  }, [loadData]);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      setPermissionsGranted(false);
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setPermissionsGranted(finalStatus === 'granted');
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setPermissionsGranted(false);
    }
  };

  const initializeSettings = useCallback(async (tenantId: TenantId) => {
    if (!settings || settings.tenant_id !== tenantId) {
      const newSettings: NotificationSettings = {
        id: Date.now().toString(),
        tenant_id: tenantId,
        ...DEFAULT_SETTINGS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSettings(newSettings);
      await saveSettings(newSettings);
    }
  }, [settings, saveSettings]);

  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    if (!settings) return;

    const updated: NotificationSettings = {
      ...settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings, saveSettings]);

  const addReminder = useCallback(async (
    reminder: Omit<DateReminder, 'id' | 'created_at' | 'updated_at' | 'notification_ids'>
  ) => {
    const newReminder: DateReminder = {
      ...reminder,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...reminders, newReminder];
    setReminders(updated);
    await saveReminders(updated);

    if (permissionsGranted && settings?.push_notifications_enabled && Platform.OS !== 'web') {
      await scheduleNotificationsForReminder(newReminder);
    }

    return newReminder;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, saveReminders, permissionsGranted, settings]);

  const updateReminder = useCallback(async (id: string, updates: Partial<DateReminder>) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
    );
    setReminders(updated);
    await saveReminders(updated);

    const reminder = updated.find(r => r.id === id);
    if (reminder && permissionsGranted && settings?.push_notifications_enabled && Platform.OS !== 'web') {
      if (reminder.notification_ids) {
        await Promise.all(
          reminder.notification_ids.map(nId => Notifications.cancelScheduledNotificationAsync(nId))
        );
      }
      
      if (reminder.is_active) {
        await scheduleNotificationsForReminder(reminder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, saveReminders, permissionsGranted, settings]);

  const deleteReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder?.notification_ids && Platform.OS !== 'web') {
      await Promise.all(
        reminder.notification_ids.map(nId => Notifications.cancelScheduledNotificationAsync(nId))
      );
    }

    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    await saveReminders(updated);
  }, [reminders, saveReminders]);

  const scheduleNotificationsForReminder = useCallback(async (reminder: DateReminder): Promise<string[]> => {
    if (Platform.OS === 'web') return [];

    const notificationIds: string[] = [];
    const targetDate = new Date(reminder.target_date);
    const now = new Date();

    for (const daysBefore of reminder.reminder_days_before) {
      const notificationDate = new Date(targetDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);
      notificationDate.setHours(9, 0, 0, 0);

      if (notificationDate > now) {
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title,
              body: reminder.description || `Reminder: ${reminder.title} in ${daysBefore} days`,
              data: {
                reminderId: reminder.id,
                type: reminder.type,
                relatedToType: reminder.related_to_type,
                relatedToId: reminder.related_to_id,
              },
            },
            trigger: notificationDate as any,
          });
          notificationIds.push(id);
        } catch (error) {
          console.error('Error scheduling notification:', error);
        }
      }
    }

    if (notificationIds.length > 0) {
      const updated = reminders.map(r => 
        r.id === reminder.id ? { ...r, notification_ids: notificationIds, updated_at: new Date().toISOString() } : r
      );
      setReminders(updated);
      await saveReminders(updated);
    }

    return notificationIds;
  }, [reminders, saveReminders]);

  const syncRemindersFromData = useCallback(async (
    tenantId: TenantId,
    currentUserId: UserId,
    leases: Lease[],
    documents: BusinessDocument[],
    invoices: Invoice[],
    payments: Payment[],
    maintenanceSchedules: MaintenanceSchedule[],
    todos: Todo[],
    propertyItems: PropertyItem[]
  ) => {
    if (!settings) return;

    const existingReminders = reminders.filter(r => r.tenant_id === tenantId);
    const newReminders: DateReminder[] = [];

    for (const lease of leases) {
      if (lease.status !== 'active') continue;

      const existingLeaseEndReminder = existingReminders.find(
        r => r.type === 'lease_end' && r.related_to_id === lease.id
      );

      if (!existingLeaseEndReminder) {
        newReminders.push({
          id: `${Date.now()}-${lease.id}-end`,
          tenant_id: tenantId,
          type: 'lease_end',
          title: `Lease Ending`,
          description: `Lease for Unit ${lease.unit_id} is ending`,
          target_date: lease.end_date,
          reminder_days_before: settings.lease_end_days,
          related_to_type: 'lease',
          related_to_id: lease.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (const doc of documents) {
      if (!doc.expiry_date) continue;

      const existingDocReminder = existingReminders.find(
        r => r.type === 'document_expiry' && r.related_to_id === doc.id
      );

      if (!existingDocReminder) {
        const reminderDays = doc.reminder_days_before 
          ? [doc.reminder_days_before]
          : settings.document_expiry_days;

        newReminders.push({
          id: `${Date.now()}-${doc.id}-expiry`,
          tenant_id: tenantId,
          type: 'document_expiry',
          title: `${doc.name} Expiring`,
          description: `Business document "${doc.name}" will expire`,
          target_date: doc.expiry_date,
          reminder_days_before: reminderDays,
          related_to_type: 'business_document',
          related_to_id: doc.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (const invoice of invoices) {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') continue;

      const existingInvoiceReminder = existingReminders.find(
        r => r.type === 'invoice_due' && r.related_to_id === invoice.id
      );

      if (!existingInvoiceReminder) {
        newReminders.push({
          id: `${Date.now()}-${invoice.id}-due`,
          tenant_id: tenantId,
          type: 'invoice_due',
          title: `Invoice Due`,
          description: `Invoice ${invoice.invoice_number} is due`,
          target_date: invoice.due_date,
          reminder_days_before: settings.invoice_due_days,
          related_to_type: 'invoice',
          related_to_id: invoice.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (const payment of payments) {
      if (payment.status === 'paid' || payment.status === 'cancelled') continue;

      const existingPaymentReminder = existingReminders.find(
        r => r.type === 'payment_due' && r.related_to_id === payment.id
      );

      if (!existingPaymentReminder) {
        newReminders.push({
          id: `${Date.now()}-${payment.id}-due`,
          tenant_id: tenantId,
          type: 'payment_due',
          title: `Payment Due`,
          description: `Payment of ${payment.amount} ${payment.currency} is due`,
          target_date: payment.due_date,
          reminder_days_before: settings.payment_due_days,
          related_to_type: 'payment',
          related_to_id: payment.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (const schedule of maintenanceSchedules) {
      if (!schedule.is_active) continue;

      const existingMaintenanceReminder = existingReminders.find(
        r => r.type === 'maintenance_scheduled' && r.related_to_id === schedule.id
      );

      if (!existingMaintenanceReminder) {
        const reminderDays = schedule.reminder_days_before 
          ? [schedule.reminder_days_before]
          : settings.maintenance_scheduled_days;

        newReminders.push({
          id: `${Date.now()}-${schedule.id}-scheduled`,
          tenant_id: tenantId,
          type: 'maintenance_scheduled',
          title: `Maintenance Scheduled`,
          description: `${schedule.asset_name} - ${schedule.task_description}`,
          target_date: schedule.next_service_date,
          reminder_days_before: reminderDays,
          related_to_type: 'maintenance',
          related_to_id: schedule.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (const todo of todos) {
      if (!todo.due_date || todo.status === 'completed' || todo.status === 'cancelled') continue;

      const existingTodoReminder = existingReminders.find(
        r => r.type === 'todo_due' && r.related_to_id === todo.id
      );

      if (!existingTodoReminder) {
        newReminders.push({
          id: `${Date.now()}-${todo.id}-due`,
          tenant_id: tenantId,
          type: 'todo_due',
          title: `Todo Due: ${todo.title}`,
          description: todo.description,
          target_date: todo.due_date,
          reminder_days_before: settings.todo_due_days,
          related_to_type: 'todo',
          related_to_id: todo.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    for (const item of propertyItems) {
      if (!item.warranty_expiry) continue;

      const existingWarrantyReminder = existingReminders.find(
        r => r.type === 'warranty_expiry' && r.related_to_id === item.id
      );

      if (!existingWarrantyReminder) {
        newReminders.push({
          id: `${Date.now()}-${item.id}-warranty`,
          tenant_id: tenantId,
          type: 'warranty_expiry',
          title: `Warranty Expiring`,
          description: `Warranty for ${item.name} is expiring`,
          target_date: item.warranty_expiry,
          reminder_days_before: settings.warranty_expiry_days,
          related_to_type: 'property_item',
          related_to_id: item.id,
          is_active: true,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (newReminders.length > 0) {
      const allReminders = [...reminders, ...newReminders];
      setReminders(allReminders);
      await saveReminders(allReminders);

      if (permissionsGranted && settings.push_notifications_enabled && Platform.OS !== 'web') {
        for (const reminder of newReminders) {
          await scheduleNotificationsForReminder(reminder);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, settings, saveReminders, permissionsGranted]);

  const getUpcomingEvents = useCallback((daysAhead: number = 30): UpcomingEvent[] => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const events: UpcomingEvent[] = [];

    for (const reminder of reminders) {
      if (!reminder.is_active) continue;

      const targetDate = new Date(reminder.target_date);
      if (targetDate >= now && targetDate <= futureDate) {
        const daysUntil = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
        if (daysUntil <= 1) priority = 'urgent';
        else if (daysUntil <= 3) priority = 'high';
        else if (daysUntil <= 7) priority = 'medium';

        events.push({
          id: reminder.id,
          type: reminder.type,
          title: reminder.title,
          description: reminder.description,
          date: reminder.target_date,
          days_until: daysUntil,
          related_to_type: reminder.related_to_type,
          related_to_id: reminder.related_to_id,
          priority,
        });
      }
    }

    return events.sort((a, b) => a.days_until - b.days_until);
  }, [reminders]);

  const getEventsByType = useCallback((type: DateReminderType): UpcomingEvent[] => {
    return getUpcomingEvents().filter(event => event.type === type);
  }, [getUpcomingEvents]);

  const urgentEventsCount = useMemo(() => {
    return getUpcomingEvents(7).filter(e => e.days_until <= 3).length;
  }, [getUpcomingEvents]);

  return {
    isLoading,
    reminders,
    settings,
    permissionsGranted,
    initializeSettings,
    updateSettings,
    addReminder,
    updateReminder,
    deleteReminder,
    syncRemindersFromData,
    getUpcomingEvents,
    getEventsByType,
    urgentEventsCount,
    requestPermissions,
  };
});
