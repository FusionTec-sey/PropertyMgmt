import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Plus, CheckSquare, Circle, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Todo, TodoPriority, TodoStatus } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed';

export default function TodosScreen() {
  const { todos, addTodo, updateTodo, deleteTodo } = useApp();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TodoPriority,
    status: 'pending' as TodoStatus,
    due_date: '',
    category: 'general' as 'general' | 'maintenance' | 'lease' | 'payment' | 'inspection' | 'other',
    related_to_type: '' as '' | 'property' | 'unit' | 'renter' | 'lease' | 'maintenance' | 'payment',
    related_to_id: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: '',
      category: 'general',
      related_to_type: '',
      related_to_id: '',
    });
    setEditingTodo(null);
  };

  const filteredTodos = useMemo(() => {
    if (filterTab === 'all') return todos;
    return todos.filter(t => t.status === filterTab);
  }, [todos, filterTab]);

  const pendingCount = useMemo(() => todos.filter(t => t.status === 'pending').length, [todos]);
  const inProgressCount = useMemo(() => todos.filter(t => t.status === 'in_progress').length, [todos]);
  const completedCount = useMemo(() => todos.filter(t => t.status === 'completed').length, [todos]);

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status: todo.status,
      due_date: todo.due_date || '',
      category: todo.category || 'general',
      related_to_type: todo.related_to_type || '',
      related_to_id: todo.related_to_id || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Please provide a title for the task');
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      status: formData.status,
      due_date: formData.due_date || undefined,
      category: formData.category || undefined,
      related_to_type: formData.related_to_type || undefined,
      related_to_id: formData.related_to_id || undefined,
    };

    if (editingTodo) {
      await updateTodo(editingTodo.id, data);
    } else {
      await addTodo(data);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleToggleStatus = async (todo: Todo) => {
    let newStatus: TodoStatus;
    
    if (todo.status === 'pending') {
      newStatus = 'in_progress';
    } else if (todo.status === 'in_progress') {
      newStatus = 'completed';
    } else if (todo.status === 'completed') {
      newStatus = 'pending';
    } else {
      newStatus = 'pending';
    }

    await updateTodo(todo.id, {
      status: newStatus,
      completed_date: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteTodo(id);
          }
        },
      ]
    );
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return Circle;
      case 'cancelled': return AlertCircle;
      default: return Circle;
    }
  };

  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in_progress': return '#007AFF';
      case 'pending': return '#8E8E93';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderTodo = ({ item }: { item: Todo }) => {
    const StatusIcon = getStatusIcon(item.status);
    const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed';
    const dueDate = item.due_date ? new Date(item.due_date) : null;

    return (
      <Card style={styles.todoCard}>
        <View style={styles.todoHeader}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleToggleStatus(item)}
            testID={`toggle-todo-${item.id}`}
          >
            <StatusIcon size={24} color={getStatusColor(item.status)} />
          </TouchableOpacity>
          <View style={styles.todoContent}>
            <Text style={[
              styles.todoTitle,
              item.status === 'completed' && styles.completedText
            ]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.todoDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.todoMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.badgeText}>{item.priority}</Text>
              </View>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
              {dueDate && (
                <View style={styles.dueDateContainer}>
                  <Calendar size={12} color={isOverdue ? '#FF3B30' : '#666'} />
                  <Text style={[
                    styles.dueDateText,
                    isOverdue && styles.overdueText
                  ]}>
                    {dueDate.toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.todoActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-todo-${item.id}`}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
            testID={`delete-todo-${item.id}`}
          >
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContentContainer}
        >
          <TouchableOpacity
            style={[styles.tab, filterTab === 'all' && styles.activeTab]}
            onPress={() => setFilterTab('all')}
            testID="tab-all"
          >
            <Text style={[styles.tabText, filterTab === 'all' && styles.activeTabText]}>
              All ({todos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filterTab === 'pending' && styles.activeTab]}
            onPress={() => setFilterTab('pending')}
            testID="tab-pending"
          >
            <Text style={[styles.tabText, filterTab === 'pending' && styles.activeTabText]}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filterTab === 'in_progress' && styles.activeTab]}
            onPress={() => setFilterTab('in_progress')}
            testID="tab-in-progress"
          >
            <Text style={[styles.tabText, filterTab === 'in_progress' && styles.activeTabText]}>
              In Progress ({inProgressCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filterTab === 'completed' && styles.activeTab]}
            onPress={() => setFilterTab('completed')}
            testID="tab-completed"
          >
            <Text style={[styles.tabText, filterTab === 'completed' && styles.activeTabText]}>
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-todo-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {filteredTodos.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={filterTab === 'all' ? 'No Tasks' : `No ${filterTab.replace('_', ' ')} tasks`}
          message="Stay organized by adding tasks to your to-do list"
          actionLabel="Add Task"
          onAction={handleAdd}
          testID="todos-empty"
        />
      ) : (
        <FlatList
          data={filteredTodos}
          renderItem={renderTodo}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        title={editingTodo ? 'Edit Task' : 'New Task'}
        testID="todo-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Input
            label="Title"
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
            placeholder="Task title"
            required
            testID="todo-title-input"
          />

          <Input
            label="Description"
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Task description"
            multiline
            numberOfLines={3}
            testID="todo-description-input"
          />

          <Input
            label="Due Date (YYYY-MM-DD)"
            value={formData.due_date}
            onChangeText={text => setFormData({ ...formData, due_date: text })}
            placeholder="2025-12-25"
            testID="todo-due-date-input"
          />

          <Input
            label="Category"
            value={formData.category}
            onChangeText={text => setFormData({ ...formData, category: text as any })}
            placeholder="general, maintenance, lease"
            testID="todo-category-input"
          />

          <Input
            label="Related To (Type)"
            value={formData.related_to_type}
            onChangeText={text => setFormData({ ...formData, related_to_type: text as any })}
            placeholder="property, unit, renter, lease"
            testID="todo-related-type-input"
          />

          <Input
            label="Related To (ID)"
            value={formData.related_to_id}
            onChangeText={text => setFormData({ ...formData, related_to_id: text })}
            placeholder="Related item ID"
            testID="todo-related-id-input"
          />

          <Button
            title={editingTodo ? 'Update Task' : 'Add Task'}
            onPress={handleSave}
            fullWidth
            testID="save-todo-button"
          />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  tabContainer: {
    flex: 1,
  },
  tabContentContainer: {
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  list: {
    padding: 16,
  },
  todoCard: {
    marginBottom: 16,
  },
  todoHeader: {
    flexDirection: 'row' as const,
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through' as const,
    color: '#8E8E93',
  },
  todoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  todoMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'capitalize' as const,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textTransform: 'capitalize' as const,
  },
  dueDateContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  todoActions: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center' as const,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B3015',
  },
  deleteText: {
    color: '#FF3B30',
  },
});
