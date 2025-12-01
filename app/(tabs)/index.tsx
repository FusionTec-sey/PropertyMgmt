import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { 
  Building2, 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Bell,
  Plus,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Todo, TodoStatus } from '@/types';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function DashboardScreen() {
  const router = useRouter();
  const { dashboardStats, currentTenant, properties, leases, maintenanceRequests, todos, updateTodo } = useApp();
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState<boolean>(false);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
    onPress,
  }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR`;
  };

  const recentLeases = leases.slice(-3).reverse();
  const urgentMaintenance = maintenanceRequests.filter(
    (m) => m.priority === 'urgent' || m.priority === 'high'
  ).slice(0, 3);

  const pendingTodos = todos.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const todayTodos = pendingTodos.filter((t) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });
  const overdueTodos = pendingTodos.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && t.status !== 'completed';
  });
  const upcomingTodos = pendingTodos
    .filter((t) => {
      if (!t.due_date) return true;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate > today;
    })
    .slice(0, 5);

  const handleToggleTodoStatus = async (todo: Todo) => {
    const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed';
    await updateTodo(todo.id, {
      status: newStatus,
      completed_date: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const requestNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  const scheduleNotification = async (todo: Todo) => {
    setRequestingNotificationPermission(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!todo.due_date) {
        Alert.alert(
          'No Due Date',
          'This task doesn\'t have a due date. Would you like to set a reminder for a specific time?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Custom',
              onPress: () => {
                Alert.alert(
                  'Custom Reminder',
                  'For custom reminders, please edit the task and set a due date first.',
                  [{ text: 'OK' }]
                );
              },
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Set Reminder',
        'When would you like to be reminded?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '1 hour before',
            onPress: async () => {
              const dueDate = new Date(todo.due_date!);
              const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
              await scheduleNotificationAtTime(todo, reminderTime, '1 hour before');
            },
          },
          {
            text: '1 day before',
            onPress: async () => {
              const dueDate = new Date(todo.due_date!);
              const reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
              await scheduleNotificationAtTime(todo, reminderTime, '1 day before');
            },
          },
          {
            text: 'On due date',
            onPress: async () => {
              const dueDate = new Date(todo.due_date!);
              await scheduleNotificationAtTime(todo, dueDate, 'on due date');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    } finally {
      setRequestingNotificationPermission(false);
    }
  };

  const scheduleNotificationAtTime = async (
    todo: Todo,
    reminderTime: Date,
    timeDescription: string
  ) => {
    const now = new Date();
    if (reminderTime < now) {
      Alert.alert(
        'Past Time',
        `The reminder time (${timeDescription}) is in the past. Please choose a future time.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Task Reminder',
          body: todo.title,
          data: { todoId: todo.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilReminder > 0 ? secondsUntilReminder : 1,
        },
      });

      Alert.alert(
        'Reminder Set',
        `You'll be reminded ${timeDescription} at ${reminderTime.toLocaleString()}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule reminder');
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      default:
        return Circle;
    }
  };

  const getTodoStatusColor = (status: TodoStatus) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.tenantName}>{currentTenant?.name}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon={Building2}
          title="Properties"
          value={dashboardStats.total_properties}
          color="#007AFF"
          onPress={() => router.push('/(tabs)/properties')}
        />
        <StatCard
          icon={Home}
          title="Total Units"
          value={dashboardStats.total_units}
          color="#34C759"
        />
        <StatCard
          icon={Home}
          title="Occupied"
          value={dashboardStats.occupied_units}
          color="#5856D6"
        />
        <StatCard
          icon={Home}
          title="Available"
          value={dashboardStats.available_units}
          color="#FF9500"
        />
        <StatCard
          icon={Users}
          title="Tenants"
          value={dashboardStats.total_tenant_renters}
          color="#FF2D55"
          onPress={() => router.push('/(tabs)/tenants')}
        />
        <StatCard
          icon={FileText}
          title="Active Leases"
          value={dashboardStats.active_leases}
          color="#00C7BE"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Revenue</Text>
        </View>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>This Month</Text>
          <Text style={styles.revenueValue}>
            {formatCurrency(dashboardStats.total_revenue_month)}
          </Text>
          <View style={styles.paymentStats}>
            <View style={styles.paymentStat}>
              <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.paymentStatText}>
                Pending: {dashboardStats.pending_payments}
              </Text>
            </View>
            <View style={styles.paymentStat}>
              <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.paymentStatText}>
                Overdue: {dashboardStats.overdue_payments}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {dashboardStats.open_maintenance > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.sectionTitle}>Maintenance</Text>
          </View>
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              {dashboardStats.open_maintenance} open maintenance request{dashboardStats.open_maintenance !== 1 ? 's' : ''}
            </Text>
            {urgentMaintenance.length > 0 && (
              <View style={styles.urgentList}>
                {urgentMaintenance.map((m) => {
                  const property = properties.find((p) => p.id === m.property_id);
                  return (
                    <View key={m.id} style={styles.urgentItem}>
                      <View style={[styles.priorityBadge, { backgroundColor: m.priority === 'urgent' ? '#FF3B30' : '#FF9500' }]}>
                        <Text style={styles.priorityText}>{m.priority}</Text>
                      </View>
                      <View style={styles.urgentInfo}>
                        <Text style={styles.urgentTitle}>{m.title}</Text>
                        <Text style={styles.urgentProperty}>{property?.name || 'Unknown'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {recentLeases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#5856D6" />
            <Text style={styles.sectionTitle}>Recent Leases</Text>
          </View>
          {recentLeases.map((lease) => {
            const property = properties.find((p) => p.id === lease.property_id);
            return (
              <View key={lease.id} style={styles.leaseCard}>
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{property?.name || 'Unknown'}</Text>
                  <Text style={styles.leaseDetails}>
                    ₨{lease.rent_amount.toLocaleString()} SCR/month
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lease.status) }]}>
                  <Text style={styles.statusText}>{lease.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {pendingTodos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Tasks & To-Do</Text>
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => router.push('/(tabs)/todos')}
            >
              <Plus size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {overdueTodos.length > 0 && (
            <View style={styles.taskSummary}>
              <AlertCircle size={16} color="#FF3B30" />
              <Text style={styles.taskSummaryText}>
                {overdueTodos.length} overdue task{overdueTodos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {todayTodos.length > 0 && (
            <View style={[styles.taskSummary, { marginTop: 4 }]}>
              <Clock size={16} color="#FF9500" />
              <Text style={styles.taskSummaryText}>
                {todayTodos.length} task{todayTodos.length !== 1 ? 's' : ''} due today
              </Text>
            </View>
          )}

          <View style={styles.todosList}>
            {upcomingTodos.map((todo) => {
              const StatusIcon = getStatusIcon(todo.status);
              const isOverdue =
                todo.due_date &&
                new Date(todo.due_date) < new Date() &&
                todo.status !== 'completed';
              const isDueToday =
                todo.due_date &&
                new Date(todo.due_date).toDateString() === new Date().toDateString();

              return (
                <View key={todo.id} style={styles.todoItem}>
                  <TouchableOpacity
                    style={styles.todoCheckbox}
                    onPress={() => handleToggleTodoStatus(todo)}
                  >
                    <StatusIcon size={20} color={getTodoStatusColor(todo.status)} />
                  </TouchableOpacity>

                  <View style={styles.todoContent}>
                    <Text
                      style={[
                        styles.todoTitle,
                        todo.status === 'completed' && styles.completedTodoTitle,
                      ]}
                      numberOfLines={1}
                    >
                      {todo.title}
                    </Text>
                    <View style={styles.todoMeta}>
                      <View
                        style={[
                          styles.todoPriorityBadge,
                          { backgroundColor: getPriorityColor(todo.priority) },
                        ]}
                      >
                        <Text style={styles.todoPriorityText}>{todo.priority}</Text>
                      </View>
                      {todo.due_date && (
                        <Text
                          style={[
                            styles.todoDueDate,
                            isOverdue && styles.todoOverdue,
                            isDueToday && styles.todoDueToday,
                          ]}
                        >
                          {isOverdue
                            ? 'Overdue'
                            : isDueToday
                            ? 'Due today'
                            : new Date(todo.due_date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.reminderButton}
                    onPress={() => scheduleNotification(todo)}
                    disabled={requestingNotificationPermission}
                  >
                    <Bell size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/todos')}
          >
            <Text style={styles.viewAllText}>View All Tasks</Text>
          </TouchableOpacity>
        </View>
      )}

      {properties.length === 0 && (
        <View style={styles.emptyState}>
          <Building2 size={48} color="#999" />
          <Text style={styles.emptyTitle}>Get Started</Text>
          <Text style={styles.emptyText}>
            Add your first property to start managing your real estate
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/properties')}
          >
            <Text style={styles.emptyButtonText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#34C759';
    case 'expired':
      return '#FF3B30';
    case 'draft':
      return '#999';
    default:
      return '#007AFF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tenantName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 12,
  },
  statCard: {
    width: '31%' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    margin: '1%' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center' as const,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  revenueCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  paymentStats: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  paymentStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatText: {
    fontSize: 14,
    color: '#666',
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  urgentList: {
    gap: 8,
  },
  urgentItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
  },
  urgentInfo: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  urgentProperty: {
    fontSize: 12,
    color: '#666',
  },
  leaseCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leaseInfo: {
    flex: 1,
  },
  leaseProperty: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  leaseDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
    textTransform: 'capitalize' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  addTaskButton: {
    marginLeft: 'auto' as const,
    padding: 4,
  },
  taskSummary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  taskSummaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  todosList: {
    gap: 8,
    marginTop: 8,
  },
  todoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todoCheckbox: {
    padding: 4,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  completedTodoTitle: {
    textDecorationLine: 'line-through' as const,
    color: '#8E8E93',
  },
  todoMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  todoPriorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todoPriorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
  },
  todoDueDate: {
    fontSize: 12,
    color: '#666',
  },
  todoOverdue: {
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  todoDueToday: {
    color: '#FF9500',
    fontWeight: '600' as const,
  },
  reminderButton: {
    padding: 8,
    backgroundColor: '#007AFF15',
    borderRadius: 8,
  },
  viewAllButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
