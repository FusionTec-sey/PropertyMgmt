import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export interface CalendarEventData {
  title: string;
  notes?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  alarms?: number[];
}

export const requestCalendarPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
};

const getDefaultCalendar = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    const defaultCalendar = calendars.find(
      cal => cal.allowsModifications && (cal.isPrimary || cal.title === 'Calendar')
    );

    if (defaultCalendar) {
      return defaultCalendar.id;
    }

    const writableCalendar = calendars.find(cal => cal.allowsModifications);
    return writableCalendar?.id || null;
  } catch (error) {
    console.error('Error getting default calendar:', error);
    return null;
  }
};

export const addEventToCalendar = async (eventData: CalendarEventData): Promise<string | null> => {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Not Available',
      'Calendar integration is not available on web. Please use the mobile app.',
      [{ text: 'OK' }]
    );
    return null;
  }

  try {
    const hasPermission = await requestCalendarPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable calendar access in your device settings to add events.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const calendarId = await getDefaultCalendar();
    
    if (!calendarId) {
      Alert.alert(
        'No Calendar Found',
        'Could not find a writable calendar on your device.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const alarms = eventData.alarms?.map(minutes => ({
      relativeOffset: -minutes,
      method: Calendar.AlarmMethod.ALERT as Calendar.AlarmMethod,
    })) || [];

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: eventData.title,
      notes: eventData.notes,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      location: eventData.location,
      alarms,
      timeZone: 'UTC',
    });

    return eventId;
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    Alert.alert(
      'Error',
      'Failed to add event to calendar. Please try again.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

export const addLeaseToCalendar = async (
  lease: {
    property_name: string;
    unit_number: string;
    start_date: string;
    end_date: string;
    tenant_name: string;
    rent_amount: number;
    currency: string;
  }
): Promise<void> => {
  const startDate = new Date(lease.start_date);
  const endDate = new Date(lease.start_date);
  endDate.setHours(endDate.getHours() + 1);

  const leaseEndDate = new Date(lease.end_date);
  const leaseEndEventDate = new Date(lease.end_date);
  leaseEndEventDate.setHours(leaseEndEventDate.getHours() + 1);

  const eventId = await addEventToCalendar({
    title: `Lease Start: ${lease.property_name} - Unit ${lease.unit_number}`,
    notes: `Tenant: ${lease.tenant_name}\nRent: ${lease.rent_amount} ${lease.currency}/month`,
    startDate,
    endDate,
    location: lease.property_name,
    alarms: [10080, 1440],
  });

  if (eventId) {
    await addEventToCalendar({
      title: `Lease End: ${lease.property_name} - Unit ${lease.unit_number}`,
      notes: `Tenant: ${lease.tenant_name}\nAction required: Renewal or move-out`,
      startDate: leaseEndDate,
      endDate: leaseEndEventDate,
      location: lease.property_name,
      alarms: [43200, 10080, 1440],
    });

    Alert.alert(
      'Added to Calendar',
      'Lease start and end dates have been added to your calendar with reminders.',
      [{ text: 'OK' }]
    );
  }
};

export const addInspectionToCalendar = async (
  inspection: {
    property_name: string;
    unit_number?: string;
    inspection_type: string;
    scheduled_date: string;
    scheduled_time?: string;
    notes?: string;
  }
): Promise<void> => {
  const startDate = new Date(inspection.scheduled_date);
  
  if (inspection.scheduled_time) {
    const [hours, minutes] = inspection.scheduled_time.match(/(\d+):(\d+)/)?.slice(1) || [];
    if (hours && minutes) {
      startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    }
  } else {
    startDate.setHours(9, 0, 0, 0);
  }

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  const unitInfo = inspection.unit_number ? ` - Unit ${inspection.unit_number}` : '';
  const eventId = await addEventToCalendar({
    title: `${inspection.inspection_type.replace(/_/g, ' ')} Inspection${unitInfo}`,
    notes: inspection.notes || `Inspection at ${inspection.property_name}${unitInfo}`,
    startDate,
    endDate,
    location: inspection.property_name,
    alarms: [10080, 1440, 60],
  });

  if (eventId) {
    Alert.alert(
      'Added to Calendar',
      'Inspection has been added to your calendar with reminders.',
      [{ text: 'OK' }]
    );
  }
};

export const addMaintenanceToCalendar = async (
  maintenance: {
    property_name: string;
    unit_number?: string;
    title: string;
    description: string;
    scheduled_date: string;
    priority: string;
  }
): Promise<void> => {
  const startDate = new Date(maintenance.scheduled_date);
  startDate.setHours(9, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 3);

  const unitInfo = maintenance.unit_number ? ` - Unit ${maintenance.unit_number}` : '';
  const alarms = maintenance.priority === 'urgent' ? [1440, 360, 60] : [10080, 1440];

  const eventId = await addEventToCalendar({
    title: `Maintenance: ${maintenance.title}`,
    notes: `${maintenance.description}\n\nLocation: ${maintenance.property_name}${unitInfo}\nPriority: ${maintenance.priority}`,
    startDate,
    endDate,
    location: maintenance.property_name,
    alarms,
  });

  if (eventId) {
    Alert.alert(
      'Added to Calendar',
      'Maintenance has been added to your calendar with reminders.',
      [{ text: 'OK' }]
    );
  }
};

export const addPaymentDueToCalendar = async (
  payment: {
    tenant_name: string;
    property_name: string;
    unit_number: string;
    amount: number;
    currency: string;
    due_date: string;
  }
): Promise<void> => {
  const dueDate = new Date(payment.due_date);
  dueDate.setHours(9, 0, 0, 0);

  const endDate = new Date(dueDate);
  endDate.setHours(endDate.getHours() + 1);

  const eventId = await addEventToCalendar({
    title: `Payment Due: ${payment.tenant_name}`,
    notes: `Amount: ${payment.amount} ${payment.currency}\nProperty: ${payment.property_name} - Unit ${payment.unit_number}`,
    startDate: dueDate,
    endDate,
    location: payment.property_name,
    alarms: [10080, 4320, 1440],
  });

  if (eventId) {
    Alert.alert(
      'Added to Calendar',
      'Payment due date has been added to your calendar with reminders.',
      [{ text: 'OK' }]
    );
  }
};

export const addTodoToCalendar = async (
  todo: {
    title: string;
    description?: string;
    due_date: string;
    priority: string;
  }
): Promise<void> => {
  const dueDate = new Date(todo.due_date);
  dueDate.setHours(9, 0, 0, 0);

  const endDate = new Date(dueDate);
  endDate.setHours(endDate.getHours() + 1);

  const alarms = todo.priority === 'urgent' || todo.priority === 'high' 
    ? [10080, 1440, 360] 
    : [1440, 360];

  const eventId = await addEventToCalendar({
    title: `Task: ${todo.title}`,
    notes: todo.description || todo.title,
    startDate: dueDate,
    endDate,
    alarms,
  });

  if (eventId) {
    Alert.alert(
      'Added to Calendar',
      'Task has been added to your calendar with reminders.',
      [{ text: 'OK' }]
    );
  }
};
