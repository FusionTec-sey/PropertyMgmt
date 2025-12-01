import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Tenant, User, Property, Unit, Renter, Lease, Payment,
  MaintenanceRequest, Notification,
  ActivityLog, DashboardStats, MoveInChecklist,
  PropertyItem, MaintenanceSchedule, Todo
} from '@/types';

const STORAGE_KEYS = {
  CURRENT_TENANT: '@app/current_tenant',
  CURRENT_USER: '@app/current_user',
  TENANTS: '@app/tenants',
  USERS: '@app/users',
  PROPERTIES: '@app/properties',
  UNITS: '@app/units',
  RENTERS: '@app/renters',
  LEASES: '@app/leases',
  PAYMENTS: '@app/payments',
  MAINTENANCE: '@app/maintenance',
  DOCUMENTS: '@app/documents',
  NOTIFICATIONS: '@app/notifications',
  SETTINGS: '@app/settings',
  ACTIVITY_LOGS: '@app/activity_logs',
  MOVE_IN_CHECKLISTS: '@app/move_in_checklists',
  PROPERTY_ITEMS: '@app/property_items',
  MAINTENANCE_SCHEDULES: '@app/maintenance_schedules',
  TODOS: '@app/todos',
};

export const [AppContext, useApp] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [moveInChecklists, setMoveInChecklists] = useState<MoveInChecklist[]>([]);
  const [propertyItems, setPropertyItems] = useState<PropertyItem[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [
        savedCurrentTenant,
        savedCurrentUser,
        savedTenants,
        savedProperties,
        savedUnits,
        savedRenters,
        savedLeases,
        savedPayments,
        savedMaintenance,
        savedNotifications,
        savedLogs,
        savedMoveInChecklists,
        savedPropertyItems,
        savedMaintenanceSchedules,
        savedTodos,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_TENANT),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.TENANTS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.getItem(STORAGE_KEYS.UNITS),
        AsyncStorage.getItem(STORAGE_KEYS.RENTERS),
        AsyncStorage.getItem(STORAGE_KEYS.LEASES),
        AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.MOVE_IN_CHECKLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTY_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_SCHEDULES),
        AsyncStorage.getItem(STORAGE_KEYS.TODOS),
      ]);

      if (savedCurrentTenant) setCurrentTenant(JSON.parse(savedCurrentTenant));
      if (savedCurrentUser) setCurrentUser(JSON.parse(savedCurrentUser));
      if (savedTenants) setTenants(JSON.parse(savedTenants));
      if (savedProperties) setProperties(JSON.parse(savedProperties));
      if (savedUnits) setUnits(JSON.parse(savedUnits));
      if (savedRenters) setRenters(JSON.parse(savedRenters));
      if (savedLeases) setLeases(JSON.parse(savedLeases));
      if (savedPayments) setPayments(JSON.parse(savedPayments));
      if (savedMaintenance) setMaintenanceRequests(JSON.parse(savedMaintenance));
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
      if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
      if (savedMoveInChecklists) setMoveInChecklists(JSON.parse(savedMoveInChecklists));
      if (savedPropertyItems) setPropertyItems(JSON.parse(savedPropertyItems));
      if (savedMaintenanceSchedules) setMaintenanceSchedules(JSON.parse(savedMaintenanceSchedules));
      if (savedTodos) setTodos(JSON.parse(savedTodos));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = useCallback(async <T,>(key: string, data: T) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }, []);

  const login = useCallback(async (tenant: Tenant, user: User) => {
    setCurrentTenant(tenant);
    setCurrentUser(user);
    await Promise.all([
      saveData(STORAGE_KEYS.CURRENT_TENANT, tenant),
      saveData(STORAGE_KEYS.CURRENT_USER, user),
    ]);
    
    const log: ActivityLog = {
      id: Date.now().toString(),
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'login',
      resource_type: 'auth',
      resource_id: user.id,
      created_at: new Date().toISOString(),
    };
    const updatedLogs = [...activityLogs, log];
    setActivityLogs(updatedLogs);
    await saveData(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
  }, [activityLogs, saveData]);

  const logout = useCallback(async () => {
    if (currentTenant && currentUser) {
      const log: ActivityLog = {
        id: Date.now().toString(),
        tenant_id: currentTenant.id,
        user_id: currentUser.id,
        action: 'logout',
        resource_type: 'auth',
        resource_id: currentUser.id,
        created_at: new Date().toISOString(),
      };
      const updatedLogs = [...activityLogs, log];
      setActivityLogs(updatedLogs);
      await saveData(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
    }
    
    setCurrentTenant(null);
    setCurrentUser(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT),
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER),
    ]);
  }, [currentTenant, currentUser, activityLogs, saveData]);

  const addTenant = useCallback(async (tenant: Omit<Tenant, 'id' | 'created_at'>) => {
    const newTenant: Tenant = {
      ...tenant,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const updated = [...tenants, newTenant];
    setTenants(updated);
    await saveData(STORAGE_KEYS.TENANTS, updated);
    return newTenant;
  }, [tenants, saveData]);

  const addProperty = useCallback(async (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newProperty: Property = {
      ...property,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...properties, newProperty];
    setProperties(updated);
    await saveData(STORAGE_KEYS.PROPERTIES, updated);
    return newProperty;
  }, [currentTenant, properties, saveData]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    const updated = properties.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    setProperties(updated);
    await saveData(STORAGE_KEYS.PROPERTIES, updated);
  }, [properties, saveData]);

  const deleteProperty = useCallback(async (id: string) => {
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    await saveData(STORAGE_KEYS.PROPERTIES, updated);
  }, [properties, saveData]);

  const addUnit = useCallback(async (unit: Omit<Unit, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newUnit: Unit = {
      ...unit,
      id: Date.now().toString() + Math.random(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...units, newUnit];
    setUnits(updated);
    await saveData(STORAGE_KEYS.UNITS, updated);
    return newUnit;
  }, [currentTenant, units, saveData]);

  const updateUnit = useCallback(async (id: string, updates: Partial<Unit>) => {
    const updated = units.map(u => 
      u.id === id ? { ...u, ...updates, updated_at: new Date().toISOString() } : u
    );
    setUnits(updated);
    await saveData(STORAGE_KEYS.UNITS, updated);
  }, [units, saveData]);

  const deleteUnit = useCallback(async (id: string) => {
    const updated = units.filter(u => u.id !== id);
    setUnits(updated);
    await saveData(STORAGE_KEYS.UNITS, updated);
  }, [units, saveData]);

  const addRenter = useCallback(async (renter: Omit<Renter, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newRenter: Renter = {
      ...renter,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...renters, newRenter];
    setRenters(updated);
    await saveData(STORAGE_KEYS.RENTERS, updated);
    return newRenter;
  }, [currentTenant, renters, saveData]);

  const updateRenter = useCallback(async (id: string, updates: Partial<Renter>) => {
    const updated = renters.map(r => 
      r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
    );
    setRenters(updated);
    await saveData(STORAGE_KEYS.RENTERS, updated);
  }, [renters, saveData]);

  const addLease = useCallback(async (lease: Omit<Lease, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newLease: Lease = {
      ...lease,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...leases, newLease];
    setLeases(updated);
    await saveData(STORAGE_KEYS.LEASES, updated);
    
    const unitUpdated = units.map(u => 
      u.id === lease.unit_id ? { ...u, status: 'occupied' as const, updated_at: new Date().toISOString() } : u
    );
    setUnits(unitUpdated);
    await saveData(STORAGE_KEYS.UNITS, unitUpdated);
    
    return newLease;
  }, [currentTenant, leases, units, saveData]);

  const updateLease = useCallback(async (id: string, updates: Partial<Lease>) => {
    const updated = leases.map(l => 
      l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
    );
    setLeases(updated);
    await saveData(STORAGE_KEYS.LEASES, updated);
  }, [leases, saveData]);

  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...payments, newPayment];
    setPayments(updated);
    await saveData(STORAGE_KEYS.PAYMENTS, updated);
    return newPayment;
  }, [currentTenant, payments, saveData]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    const updated = payments.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    setPayments(updated);
    await saveData(STORAGE_KEYS.PAYMENTS, updated);
  }, [payments, saveData]);

  const addMaintenanceRequest = useCallback(async (request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newRequest: MaintenanceRequest = {
      ...request,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...maintenanceRequests, newRequest];
    setMaintenanceRequests(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE, updated);
    return newRequest;
  }, [currentTenant, maintenanceRequests, saveData]);

  const updateMaintenanceRequest = useCallback(async (id: string, updates: Partial<MaintenanceRequest>) => {
    const updated = maintenanceRequests.map(m => 
      m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
    );
    setMaintenanceRequests(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE, updated);
  }, [maintenanceRequests, saveData]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    if (!currentTenant) return;
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
    };
    const updated = [...notifications, newNotification];
    setNotifications(updated);
    await saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
    return newNotification;
  }, [currentTenant, notifications, saveData]);

  const addMoveInChecklist = useCallback(async (checklist: Omit<MoveInChecklist, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newChecklist: MoveInChecklist = {
      ...checklist,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...moveInChecklists, newChecklist];
    setMoveInChecklists(updated);
    await saveData(STORAGE_KEYS.MOVE_IN_CHECKLISTS, updated);
    return newChecklist;
  }, [currentTenant, moveInChecklists, saveData]);

  const updateMoveInChecklist = useCallback(async (id: string, updates: Partial<MoveInChecklist>) => {
    const updated = moveInChecklists.map(c => 
      c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
    );
    setMoveInChecklists(updated);
    await saveData(STORAGE_KEYS.MOVE_IN_CHECKLISTS, updated);
  }, [moveInChecklists, saveData]);

  const addPropertyItem = useCallback(async (item: Omit<PropertyItem, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newItem: PropertyItem = {
      ...item,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...propertyItems, newItem];
    setPropertyItems(updated);
    await saveData(STORAGE_KEYS.PROPERTY_ITEMS, updated);
    return newItem;
  }, [currentTenant, propertyItems, saveData]);

  const updatePropertyItem = useCallback(async (id: string, updates: Partial<PropertyItem>) => {
    const updated = propertyItems.map(i => 
      i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
    );
    setPropertyItems(updated);
    await saveData(STORAGE_KEYS.PROPERTY_ITEMS, updated);
  }, [propertyItems, saveData]);

  const deletePropertyItem = useCallback(async (id: string) => {
    const updated = propertyItems.filter(i => i.id !== id);
    setPropertyItems(updated);
    await saveData(STORAGE_KEYS.PROPERTY_ITEMS, updated);
  }, [propertyItems, saveData]);

  const addMaintenanceSchedule = useCallback(async (schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newSchedule: MaintenanceSchedule = {
      ...schedule,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...maintenanceSchedules, newSchedule];
    setMaintenanceSchedules(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE_SCHEDULES, updated);
    return newSchedule;
  }, [currentTenant, maintenanceSchedules, saveData]);

  const updateMaintenanceSchedule = useCallback(async (id: string, updates: Partial<MaintenanceSchedule>) => {
    const updated = maintenanceSchedules.map(s => 
      s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
    );
    setMaintenanceSchedules(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE_SCHEDULES, updated);
  }, [maintenanceSchedules, saveData]);

  const deleteMaintenanceSchedule = useCallback(async (id: string) => {
    const updated = maintenanceSchedules.filter(s => s.id !== id);
    setMaintenanceSchedules(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE_SCHEDULES, updated);
  }, [maintenanceSchedules, saveData]);

  const addTodo = useCallback(async (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newTodo: Todo = {
      ...todo,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...todos, newTodo];
    setTodos(updated);
    await saveData(STORAGE_KEYS.TODOS, updated);
    return newTodo;
  }, [currentTenant, todos, saveData]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const updated = todos.map(t => 
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    );
    setTodos(updated);
    await saveData(STORAGE_KEYS.TODOS, updated);
  }, [todos, saveData]);

  const deleteTodo = useCallback(async (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    await saveData(STORAGE_KEYS.TODOS, updated);
  }, [todos, saveData]);

  const tenantProperties = useMemo(() => 
    properties.filter(p => p.tenant_id === currentTenant?.id),
    [properties, currentTenant]
  );

  const tenantUnits = useMemo(() => 
    units.filter(u => u.tenant_id === currentTenant?.id),
    [units, currentTenant]
  );

  const tenantRenters = useMemo(() => 
    renters.filter(r => r.tenant_id === currentTenant?.id),
    [renters, currentTenant]
  );

  const tenantLeases = useMemo(() => 
    leases.filter(l => l.tenant_id === currentTenant?.id),
    [leases, currentTenant]
  );

  const tenantPayments = useMemo(() => 
    payments.filter(p => p.tenant_id === currentTenant?.id),
    [payments, currentTenant]
  );

  const tenantMaintenance = useMemo(() => 
    maintenanceRequests.filter(m => m.tenant_id === currentTenant?.id),
    [maintenanceRequests, currentTenant]
  );

  const tenantNotifications = useMemo(() => 
    notifications.filter(n => n.tenant_id === currentTenant?.id),
    [notifications, currentTenant]
  );

  const tenantMoveInChecklists = useMemo(() => 
    moveInChecklists.filter(c => c.tenant_id === currentTenant?.id),
    [moveInChecklists, currentTenant]
  );

  const tenantPropertyItems = useMemo(() => 
    propertyItems.filter(i => i.tenant_id === currentTenant?.id),
    [propertyItems, currentTenant]
  );

  const tenantMaintenanceSchedules = useMemo(() => 
    maintenanceSchedules.filter(s => s.tenant_id === currentTenant?.id),
    [maintenanceSchedules, currentTenant]
  );

  const tenantTodos = useMemo(() => 
    todos.filter(t => t.tenant_id === currentTenant?.id),
    [todos, currentTenant]
  );

  const dashboardStats = useMemo((): DashboardStats => {
    const occupiedUnits = tenantUnits.filter(u => u.status === 'occupied').length;
    const availableUnits = tenantUnits.filter(u => u.status === 'available').length;
    const activeLeases = tenantLeases.filter(l => l.status === 'active').length;
    const pendingPayments = tenantPayments.filter(p => p.status === 'pending').length;
    const overduePayments = tenantPayments.filter(p => p.status === 'overdue').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const totalRevenueMonth = tenantPayments
      .filter(p => {
        const paymentDate = new Date(p.payment_date);
        return p.status === 'paid' && 
               paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    
    const openMaintenance = tenantMaintenance.filter(m => m.status === 'open').length;

    return {
      total_properties: tenantProperties.length,
      total_units: tenantUnits.length,
      occupied_units: occupiedUnits,
      available_units: availableUnits,
      total_renters: tenantRenters.length,
      active_leases: activeLeases,
      pending_payments: pendingPayments,
      overdue_payments: overduePayments,
      total_revenue_month: totalRevenueMonth,
      open_maintenance: openMaintenance,
    };
  }, [tenantProperties, tenantUnits, tenantLeases, tenantPayments, tenantMaintenance, tenantRenters]);

  return {
    isLoading,
    currentTenant,
    currentUser,
    tenants,
    login,
    logout,
    addTenant,
    properties: tenantProperties,
    units: tenantUnits,
    renters: tenantRenters,
    leases: tenantLeases,
    payments: tenantPayments,
    maintenanceRequests: tenantMaintenance,
    notifications: tenantNotifications,
    moveInChecklists: tenantMoveInChecklists,
    propertyItems: tenantPropertyItems,
    maintenanceSchedules: tenantMaintenanceSchedules,
    todos: tenantTodos,
    dashboardStats,
    addProperty,
    updateProperty,
    deleteProperty,
    addUnit,
    updateUnit,
    deleteUnit,
    addRenter,
    updateRenter,
    addLease,
    updateLease,
    addPayment,
    updatePayment,
    addMaintenanceRequest,
    updateMaintenanceRequest,
    addNotification,
    addMoveInChecklist,
    updateMoveInChecklist,
    addPropertyItem,
    updatePropertyItem,
    deletePropertyItem,
    addMaintenanceSchedule,
    updateMaintenanceSchedule,
    deleteMaintenanceSchedule,
    addTodo,
    updateTodo,
    deleteTodo,
  };
});
