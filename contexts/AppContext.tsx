import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Tenant, User, Property, Unit, TenantRenter, Lease, Payment,
  MaintenanceRequest, Notification,
  ActivityLog, DashboardStats, MoveInChecklist,
  PropertyItem, MaintenanceSchedule, Todo, UserPermissions,
  InventoryHistory, Invoice, BusinessDocument,
  TenantApplication, TenantOnboarding, PropertyInspection
} from '@/types';
import { generateMonthlyPayments, generateLeaseRenewalReminder, generateMoveOutChecklistReminder } from '@/utils/automationHelper';

const STORAGE_KEYS = {
  CURRENT_TENANT: '@app/current_tenant',
  CURRENT_USER: '@app/current_user',
  TENANTS: '@app/tenants',
  USERS: '@app/users',
  PROPERTIES: '@app/properties',
  UNITS: '@app/units',
  TENANT_RENTERS: '@app/tenant_renters',
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
  STAFF_USERS: '@app/staff_users',
  INVENTORY_HISTORY: '@app/inventory_history',
  INVOICES: '@app/invoices',
  BUSINESS_DOCUMENTS: '@app/business_documents',
  TENANT_APPLICATIONS: '@app/tenant_applications',
  TENANT_ONBOARDINGS: '@app/tenant_onboardings',
  PROPERTY_INSPECTIONS: '@app/property_inspections',
};

export const [AppContext, useApp] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenantRenters, setTenantRenters] = useState<TenantRenter[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [moveInChecklists, setMoveInChecklists] = useState<MoveInChecklist[]>([]);
  const [propertyItems, setPropertyItems] = useState<PropertyItem[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [businessDocuments, setBusinessDocuments] = useState<BusinessDocument[]>([]);
  const [tenantApplications, setTenantApplications] = useState<TenantApplication[]>([]);
  const [tenantOnboardings, setTenantOnboardings] = useState<TenantOnboarding[]>([]);
  const [propertyInspections, setPropertyInspections] = useState<PropertyInspection[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [
        savedCurrentTenant,
        savedCurrentUser,
        savedTenants,
        savedStaffUsers,
        savedProperties,
        savedUnits,
        savedTenantRenters,
        savedLeases,
        savedPayments,
        savedMaintenance,
        savedNotifications,
        savedLogs,
        savedMoveInChecklists,
        savedPropertyItems,
        savedMaintenanceSchedules,
        savedTodos,
        savedInventoryHistory,
        savedInvoices,
        savedBusinessDocuments,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_TENANT),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.TENANTS),
        AsyncStorage.getItem(STORAGE_KEYS.STAFF_USERS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
        AsyncStorage.getItem(STORAGE_KEYS.UNITS),
        AsyncStorage.getItem(STORAGE_KEYS.TENANT_RENTERS),
        AsyncStorage.getItem(STORAGE_KEYS.LEASES),
        AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.MOVE_IN_CHECKLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTY_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_SCHEDULES),
        AsyncStorage.getItem(STORAGE_KEYS.TODOS),
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.INVOICES),
        AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_DOCUMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.TENANT_APPLICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TENANT_ONBOARDINGS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTY_INSPECTIONS),
      ]);

      if (savedCurrentTenant) setCurrentTenant(JSON.parse(savedCurrentTenant));
      if (savedCurrentUser) setCurrentUser(JSON.parse(savedCurrentUser));
      if (savedTenants) setTenants(JSON.parse(savedTenants));
      if (savedStaffUsers) setStaffUsers(JSON.parse(savedStaffUsers));
      if (savedProperties) setProperties(JSON.parse(savedProperties));
      if (savedUnits) setUnits(JSON.parse(savedUnits));
      if (savedTenantRenters) setTenantRenters(JSON.parse(savedTenantRenters));
      if (savedLeases) setLeases(JSON.parse(savedLeases));
      if (savedPayments) setPayments(JSON.parse(savedPayments));
      if (savedMaintenance) setMaintenanceRequests(JSON.parse(savedMaintenance));
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
      if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
      if (savedMoveInChecklists) setMoveInChecklists(JSON.parse(savedMoveInChecklists));
      if (savedPropertyItems) setPropertyItems(JSON.parse(savedPropertyItems));
      if (savedMaintenanceSchedules) setMaintenanceSchedules(JSON.parse(savedMaintenanceSchedules));
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      if (savedInventoryHistory) setInventoryHistory(JSON.parse(savedInventoryHistory));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedBusinessDocuments) setBusinessDocuments(JSON.parse(savedBusinessDocuments));
      const [savedTenantApplications, savedTenantOnboardings, savedPropertyInspections] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TENANT_APPLICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TENANT_ONBOARDINGS),
        AsyncStorage.getItem(STORAGE_KEYS.PROPERTY_INSPECTIONS),
      ]);
      if (savedTenantApplications) setTenantApplications(JSON.parse(savedTenantApplications));
      if (savedTenantOnboardings) setTenantOnboardings(JSON.parse(savedTenantOnboardings));
      if (savedPropertyInspections) setPropertyInspections(JSON.parse(savedPropertyInspections));
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

  const addTenantRenter = useCallback(async (tenantRenter: Omit<TenantRenter, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newTenantRenter: TenantRenter = {
      ...tenantRenter,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...tenantRenters, newTenantRenter];
    setTenantRenters(updated);
    await saveData(STORAGE_KEYS.TENANT_RENTERS, updated);
    return newTenantRenter;
  }, [currentTenant, tenantRenters, saveData]);

  const updateTenantRenter = useCallback(async (id: string, updates: Partial<TenantRenter>) => {
    const updated = tenantRenters.map(r => 
      r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
    );
    setTenantRenters(updated);
    await saveData(STORAGE_KEYS.TENANT_RENTERS, updated);
  }, [tenantRenters, saveData]);

  const addLease = useCallback(async (lease: Omit<Lease, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>, autoGeneratePayments: boolean = true) => {
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
    
    if (autoGeneratePayments && (newLease.status === 'active' || newLease.status === 'draft')) {
      const generatedPayments = generateMonthlyPayments(newLease, currentTenant.id);
      const newPayments = generatedPayments.map(payment => ({
        ...payment,
        id: `${Date.now()}-${Math.random()}`,
        tenant_id: currentTenant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      const updatedPayments = [...payments, ...newPayments];
      setPayments(updatedPayments);
      await saveData(STORAGE_KEYS.PAYMENTS, updatedPayments);
      
      const renewalReminder = generateLeaseRenewalReminder(newLease, currentTenant.id);
      const renewalTodo: Todo = {
        ...renewalReminder,
        id: `${Date.now()}-renewal`,
        tenant_id: currentTenant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const moveOutReminder = generateMoveOutChecklistReminder(newLease, currentTenant.id);
      const moveOutTodo: Todo = {
        ...moveOutReminder,
        id: `${Date.now()}-moveout`,
        tenant_id: currentTenant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedTodos = [...todos, renewalTodo, moveOutTodo];
      setTodos(updatedTodos);
      await saveData(STORAGE_KEYS.TODOS, updatedTodos);
    }
    
    return newLease;
  }, [currentTenant, leases, units, payments, todos, saveData]);

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

  const addInventoryHistory = useCallback(async (history: Omit<InventoryHistory, 'id' | 'created_at' | 'tenant_id' | 'performed_by' | 'performed_at'>) => {
    if (!currentTenant || !currentUser) return;
    
    const newHistory: InventoryHistory = {
      ...history,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      performed_by: currentUser.id,
      performed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    const updated = [...inventoryHistory, newHistory];
    setInventoryHistory(updated);
    await saveData(STORAGE_KEYS.INVENTORY_HISTORY, updated);
    return newHistory;
  }, [currentTenant, currentUser, inventoryHistory, saveData]);

  const updateInventoryHistory = useCallback(async (id: string, updates: Partial<InventoryHistory>) => {
    const updated = inventoryHistory.map(h => 
      h.id === id ? { ...h, ...updates } : h
    );
    setInventoryHistory(updated);
    await saveData(STORAGE_KEYS.INVENTORY_HISTORY, updated);
  }, [inventoryHistory, saveData]);

  const deleteInventoryHistory = useCallback(async (id: string) => {
    const updated = inventoryHistory.filter(h => h.id !== id);
    setInventoryHistory(updated);
    await saveData(STORAGE_KEYS.INVENTORY_HISTORY, updated);
  }, [inventoryHistory, saveData]);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...invoices, newInvoice];
    setInvoices(updated);
    await saveData(STORAGE_KEYS.INVOICES, updated);
    return newInvoice;
  }, [currentTenant, invoices, saveData]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const updated = invoices.map(i => 
      i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
    );
    setInvoices(updated);
    await saveData(STORAGE_KEYS.INVOICES, updated);
  }, [invoices, saveData]);

  const deleteInvoice = useCallback(async (id: string) => {
    const updated = invoices.filter(i => i.id !== id);
    setInvoices(updated);
    await saveData(STORAGE_KEYS.INVOICES, updated);
  }, [invoices, saveData]);

  const addBusinessDocument = useCallback(async (document: Omit<BusinessDocument, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'uploaded_by'>) => {
    if (!currentTenant || !currentUser) return;
    
    const newDocument: BusinessDocument = {
      ...document,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      uploaded_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...businessDocuments, newDocument];
    setBusinessDocuments(updated);
    await saveData(STORAGE_KEYS.BUSINESS_DOCUMENTS, updated);
    return newDocument;
  }, [currentTenant, currentUser, businessDocuments, saveData]);

  const updateBusinessDocument = useCallback(async (id: string, updates: Partial<BusinessDocument>) => {
    const updated = businessDocuments.map(d => 
      d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
    );
    setBusinessDocuments(updated);
    await saveData(STORAGE_KEYS.BUSINESS_DOCUMENTS, updated);
  }, [businessDocuments, saveData]);

  const deleteBusinessDocument = useCallback(async (id: string) => {
    const updated = businessDocuments.filter(d => d.id !== id);
    setBusinessDocuments(updated);
    await saveData(STORAGE_KEYS.BUSINESS_DOCUMENTS, updated);
  }, [businessDocuments, saveData]);

  const addTenantApplication = useCallback(async (application: Omit<TenantApplication, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'status'>) => {
    if (!currentTenant) return;
    
    const newApplication: TenantApplication = {
      ...application,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      status: 'pending',
      documents: application.documents || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...tenantApplications, newApplication];
    setTenantApplications(updated);
    await saveData(STORAGE_KEYS.TENANT_APPLICATIONS, updated);
    return newApplication;
  }, [currentTenant, tenantApplications, saveData]);

  const updateTenantApplication = useCallback(async (id: string, updates: Partial<TenantApplication>) => {
    const updated = tenantApplications.map(a => 
      a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    );
    setTenantApplications(updated);
    await saveData(STORAGE_KEYS.TENANT_APPLICATIONS, updated);
  }, [tenantApplications, saveData]);

  const deleteTenantApplication = useCallback(async (id: string) => {
    const updated = tenantApplications.filter(a => a.id !== id);
    setTenantApplications(updated);
    await saveData(STORAGE_KEYS.TENANT_APPLICATIONS, updated);
  }, [tenantApplications, saveData]);

  const addTenantOnboarding = useCallback(async (onboarding: Omit<TenantOnboarding, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newOnboarding: TenantOnboarding = {
      ...onboarding,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...tenantOnboardings, newOnboarding];
    setTenantOnboardings(updated);
    await saveData(STORAGE_KEYS.TENANT_ONBOARDINGS, updated);
    return newOnboarding;
  }, [currentTenant, tenantOnboardings, saveData]);

  const updateTenantOnboarding = useCallback(async (id: string, updates: Partial<TenantOnboarding>) => {
    const updated = tenantOnboardings.map(o => 
      o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    setTenantOnboardings(updated);
    await saveData(STORAGE_KEYS.TENANT_ONBOARDINGS, updated);
  }, [tenantOnboardings, saveData]);

  const deleteTenantOnboarding = useCallback(async (id: string) => {
    const updated = tenantOnboardings.filter(o => o.id !== id);
    setTenantOnboardings(updated);
    await saveData(STORAGE_KEYS.TENANT_ONBOARDINGS, updated);
  }, [tenantOnboardings, saveData]);

  const addPropertyInspection = useCallback(async (inspection: Omit<PropertyInspection, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newInspection: PropertyInspection = {
      ...inspection,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...propertyInspections, newInspection];
    setPropertyInspections(updated);
    await saveData(STORAGE_KEYS.PROPERTY_INSPECTIONS, updated);
    return newInspection;
  }, [currentTenant, propertyInspections, saveData]);

  const updatePropertyInspection = useCallback(async (id: string, updates: Partial<PropertyInspection>) => {
    const updated = propertyInspections.map(i => 
      i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
    );
    setPropertyInspections(updated);
    await saveData(STORAGE_KEYS.PROPERTY_INSPECTIONS, updated);
  }, [propertyInspections, saveData]);

  const deletePropertyInspection = useCallback(async (id: string) => {
    const updated = propertyInspections.filter(i => i.id !== id);
    setPropertyInspections(updated);
    await saveData(STORAGE_KEYS.PROPERTY_INSPECTIONS, updated);
  }, [propertyInspections, saveData]);

  const addStaffUser = useCallback(async (user: Omit<User, 'id' | 'created_at' | 'tenant_id'>) => {
    if (!currentTenant || !currentUser) return;
    
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };
    const updated = [...staffUsers, newUser];
    setStaffUsers(updated);
    await saveData(STORAGE_KEYS.STAFF_USERS, updated);
    
    const log: ActivityLog = {
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      user_id: currentUser.id,
      action: 'create_staff',
      resource_type: 'user',
      resource_id: newUser.id,
      details: { email: newUser.email, role: newUser.role },
      created_at: new Date().toISOString(),
    };
    const updatedLogs = [...activityLogs, log];
    setActivityLogs(updatedLogs);
    await saveData(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
    
    return newUser;
  }, [currentTenant, currentUser, staffUsers, activityLogs, saveData]);

  const updateStaffUser = useCallback(async (id: string, updates: Partial<User>) => {
    const updated = staffUsers.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    setStaffUsers(updated);
    await saveData(STORAGE_KEYS.STAFF_USERS, updated);
    
    if (currentTenant && currentUser) {
      const log: ActivityLog = {
        id: Date.now().toString(),
        tenant_id: currentTenant.id,
        user_id: currentUser.id,
        action: 'update_staff',
        resource_type: 'user',
        resource_id: id,
        details: updates,
        created_at: new Date().toISOString(),
      };
      const updatedLogs = [...activityLogs, log];
      setActivityLogs(updatedLogs);
      await saveData(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
    }
  }, [staffUsers, currentTenant, currentUser, activityLogs, saveData]);

  const deleteStaffUser = useCallback(async (id: string) => {
    const updated = staffUsers.filter(u => u.id !== id);
    setStaffUsers(updated);
    await saveData(STORAGE_KEYS.STAFF_USERS, updated);
    
    if (currentTenant && currentUser) {
      const log: ActivityLog = {
        id: Date.now().toString(),
        tenant_id: currentTenant.id,
        user_id: currentUser.id,
        action: 'delete_staff',
        resource_type: 'user',
        resource_id: id,
        created_at: new Date().toISOString(),
      };
      const updatedLogs = [...activityLogs, log];
      setActivityLogs(updatedLogs);
      await saveData(STORAGE_KEYS.ACTIVITY_LOGS, updatedLogs);
    }
  }, [staffUsers, currentTenant, currentUser, activityLogs, saveData]);

  const tenantProperties = useMemo(() => 
    properties.filter(p => p.tenant_id === currentTenant?.id),
    [properties, currentTenant]
  );

  const tenantUnits = useMemo(() => 
    units.filter(u => u.tenant_id === currentTenant?.id),
    [units, currentTenant]
  );

  const filteredTenantRenters = useMemo(() => 
    tenantRenters.filter(r => r.tenant_id === currentTenant?.id),
    [tenantRenters, currentTenant]
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

  const tenantInventoryHistory = useMemo(() => 
    inventoryHistory.filter(h => h.tenant_id === currentTenant?.id),
    [inventoryHistory, currentTenant]
  );

  const tenantInvoices = useMemo(() => 
    invoices.filter(i => i.tenant_id === currentTenant?.id),
    [invoices, currentTenant]
  );

  const tenantBusinessDocuments = useMemo(() => 
    businessDocuments.filter(d => d.tenant_id === currentTenant?.id),
    [businessDocuments, currentTenant]
  );

  const tenantTenantApplications = useMemo(() => 
    tenantApplications.filter(a => a.tenant_id === currentTenant?.id),
    [tenantApplications, currentTenant]
  );

  const tenantTenantOnboardings = useMemo(() => 
    tenantOnboardings.filter(o => o.tenant_id === currentTenant?.id),
    [tenantOnboardings, currentTenant]
  );

  const tenantPropertyInspections = useMemo(() => 
    propertyInspections.filter(i => i.tenant_id === currentTenant?.id),
    [propertyInspections, currentTenant]
  );

  const tenantStaffUsers = useMemo(() => 
    staffUsers.filter(u => u.tenant_id === currentTenant?.id),
    [staffUsers, currentTenant]
  );

  const hasPermission = useCallback((resource: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    return currentUser.permissions?.[resource] || false;
  }, [currentUser]);

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
      total_tenant_renters: filteredTenantRenters.length,
      active_leases: activeLeases,
      pending_payments: pendingPayments,
      overdue_payments: overduePayments,
      total_revenue_month: totalRevenueMonth,
      open_maintenance: openMaintenance,
    };
  }, [tenantProperties, tenantUnits, tenantLeases, tenantPayments, tenantMaintenance, filteredTenantRenters]);

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
    tenantRenters: filteredTenantRenters,
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
    addTenantRenter,
    updateTenantRenter,
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
    staffUsers: tenantStaffUsers,
    addStaffUser,
    updateStaffUser,
    deleteStaffUser,
    hasPermission,
    inventoryHistory: tenantInventoryHistory,
    addInventoryHistory,
    updateInventoryHistory,
    deleteInventoryHistory,
    invoices: tenantInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    businessDocuments: tenantBusinessDocuments,
    addBusinessDocument,
    updateBusinessDocument,
    deleteBusinessDocument,
    tenantApplications: tenantTenantApplications,
    addTenantApplication,
    updateTenantApplication,
    deleteTenantApplication,
    tenantOnboardings: tenantTenantOnboardings,
    addTenantOnboarding,
    updateTenantOnboarding,
    deleteTenantOnboarding,
    propertyInspections: tenantPropertyInspections,
    addPropertyInspection,
    updatePropertyInspection,
    deletePropertyInspection,
  };
});
