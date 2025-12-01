import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, Clock, AlertCircle, FileText, Wrench, ClipboardCheck, Home } from 'lucide-react-native';

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: 'lease' | 'inspection' | 'maintenance' | 'payment' | 'document' | 'todo';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  subtitle?: string;
}

interface UpcomingEventsWidgetProps {
  events: UpcomingEvent[];
  maxEvents?: number;
  onEventPress?: (event: UpcomingEvent) => void;
  testID?: string;
}

export default function UpcomingEventsWidget({
  events,
  maxEvents = 5,
  onEventPress,
  testID,
}: UpcomingEventsWidgetProps) {

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'lease':
        return Home;
      case 'inspection':
        return ClipboardCheck;
      case 'maintenance':
        return Wrench;
      case 'payment':
        return FileText;
      case 'document':
        return FileText;
      case 'todo':
        return Calendar;
      default:
        return Calendar;
    }
  };

  const getEventColor = (type: string, priority?: string) => {
    if (priority === 'urgent') return '#FF3B30';
    if (priority === 'high') return '#FF9500';

    switch (type) {
      case 'lease':
        return '#007AFF';
      case 'inspection':
        return '#5856D6';
      case 'maintenance':
        return '#FF9500';
      case 'payment':
        return '#34C759';
      case 'document':
        return '#FF2D55';
      case 'todo':
        return '#007AFF';
      default:
        return '#007AFF';
    }
  };

  const getDaysUntil = (dateString: string): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDateDisplay = (dateString: string): string => {
    const daysUntil = getDaysUntil(dateString);
    
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil === -1) return 'Yesterday';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`;
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sortedEvents = [...events]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxEvents);

  if (sortedEvents.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.headerTitle}>Upcoming Events</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Clock size={32} color="#C7C7CC" />
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={20} color="#007AFF" />
          <Text style={styles.headerTitle}>Upcoming Events</Text>
        </View>
        <Text style={styles.headerCount}>{events.length} events</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.eventsScroll}
      >
        {sortedEvents.map((event) => {
          const Icon = getEventIcon(event.type);
          const color = getEventColor(event.type, event.priority);
          const daysUntil = getDaysUntil(event.date);
          const isUrgent = daysUntil <= 3 || event.priority === 'urgent' || event.priority === 'high';

          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, isUrgent && styles.eventCardUrgent]}
              onPress={() => onEventPress?.(event)}
              activeOpacity={0.7}
              testID={`event-${event.id}`}
            >
              <View style={[styles.eventIcon, { backgroundColor: `${color}20` }]}>
                <Icon size={20} color={color} />
              </View>
              
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                {event.subtitle && (
                  <Text style={styles.eventSubtitle} numberOfLines={1}>
                    {event.subtitle}
                  </Text>
                )}
              </View>

              <View style={styles.eventFooter}>
                <Text style={[styles.eventDate, isUrgent && styles.eventDateUrgent]}>
                  {formatDateDisplay(event.date)}
                </Text>
                {isUrgent && (
                  <View style={styles.urgentIndicator}>
                    <AlertCircle size={12} color="#FF3B30" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  eventsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  eventCard: {
    width: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  eventCardUrgent: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF9E6',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  eventContent: {
    flex: 1,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  eventFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  eventDate: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  eventDateUrgent: {
    color: '#FF9500',
  },
  urgentIndicator: {
    padding: 2,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
