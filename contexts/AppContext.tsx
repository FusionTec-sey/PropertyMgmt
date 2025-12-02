import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSync } from './SyncContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runMigrations } from '@/utils/dataMigration';
import { validateData } from '@/utils/dataValidation';
import { AppInitializer } from '@/utils/appInitializer';
import type {
  Tenant, User, Property, Unit, TenantRenter, Lease, Payment,
  MaintenanceRequest, Notification,
  ActivityLog, DashboardStats, MoveInChecklist,
  PropertyItem, MaintenanceSchedule, Todo, UserPermissions,
  InventoryHistory, Invoice, BusinessDocument,
  TenantApplication, TenantOnboarding, PropertyInspection, Expense, JournalEntry
} from '@/types';
import { 
  generateMonthlyPayments, 
  generateLeaseRenewalReminder, 
  generateMoveOutChecklistReminder,
  generateOverduePaymentTodo,
  generateMaintenanceCompletionInspectionTodo,
  generatePreventiveMaintenanceTodo,
  linkPaymentToInvoice,
  shouldTriggerAutomation,
  generateInvoiceFromPayment,
  shouldGenerateInvoiceFromPayment,
  generateDocumentExpiryReminder
} from '@/utils/automationHelper';
import { 
  assignAccountCodeToExpense, 
  assignAccountCodeToPayment,
  createPaymentJournalEntries,
  createExpenseJournalEntries
} from '@/utils/financialTransactions';
import { mapExpenseCategoryToAccount } from '@/constants/chartOfAccounts';

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
  BUSINESS_LOGO: '@app/business_logo',
  EXPENSES: '@app/expenses',
  JOURNAL_ENTRIES: '@app/journal_entries',
};

export const [AppContext, useApp] = createContextHook(() => {
  const sync = useSync();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const loadData = useCallback(async () => {
    try {
      console.log('[APP] Running data migrations...');
      const migrationResult = await runMigrations();
      if (migrationResult.success) {
        console.log(`[APP] Migrations completed: v${migrationResult.previousVersion} -> v${migrationResult.currentVersion}`);
      } else {
        console.error('[APP] Migrations failed:', migrationResult.errors);
      }
      
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
        savedTenantApplications,
        savedTenantOnboardings,
        savedPropertyInspections,
        savedBusinessLogo,
        savedExpenses,
        savedJournalEntries,
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
        AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_LOGO),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES),
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
      if (savedTenantApplications) setTenantApplications(JSON.parse(savedTenantApplications));
      if (savedTenantOnboardings) setTenantOnboardings(JSON.parse(savedTenantOnboardings));
      if (savedPropertyInspections) setPropertyInspections(JSON.parse(savedPropertyInspections));
      if (savedBusinessLogo) setBusinessLogo(savedBusinessLogo);
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedJournalEntries) setJournalEntries(JSON.parse(savedJournalEntries));
      
      console.log('[APP] Running initialization tasks...');
      await AppInitializer.runAllInitializers();
      console.log('[APP] Initialization tasks completed');
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
      const { isValid, errors } = validateData(key, data as any);
      if (!isValid) {
        console.error(`[VALIDATION] Data validation failed for ${key}:`, errors);
        throw new Error(`Validation failed for ${key}: ${errors.join(', ')}`);
      }
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }, []);

  const login = useCallback(async (tenant: Tenant, user: User) => {
    setCurrentTenant(tenant);
    setCurrentUser(user);
    await Promise.all([
      saveData(STORAGE_KEYS.CURRENT_TENANT, tenant),
      saveData(STORAGE_KEYS.CURRENT_USER, user),
    ]);
    
    console.log(`[APP] User logged in: ${user.email}, setting tenant ID for sync`);
    sync.setTenantId(tenant.id);
    
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
  }, [activityLogs, saveData, sync]);

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
    await sync.addPendingChange('properties', 'create', newProperty as unknown as Record<string, unknown>);
    return newProperty;
  }, [currentTenant, properties, saveData, sync]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    const updated = properties.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    setProperties(updated);
    await saveData(STORAGE_KEYS.PROPERTIES, updated);
    
    const updatedProperty = updated.find(p => p.id === id);
    if (updatedProperty) {
      await sync.addPendingChange('properties', 'update', updatedProperty as unknown as Record<string, unknown>);
    }
  }, [properties, saveData, sync]);

  const deleteProperty = useCallback(async (id: string) => {
    const property = properties.find(p => p.id === id);
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    await saveData(STORAGE_KEYS.PROPERTIES, updated);
    
    if (property) {
      await sync.addPendingChange('properties', 'delete', { id } as Record<string, unknown>);
    }
  }, [properties, saveData, sync]);

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
    const lease = leases.find(l => l.id === id);
    const wasTerminated = (updates.status === 'terminated' || updates.status === 'expired') && 
                         lease && 
                         (lease.status === 'active' || lease.status === 'draft');
    
    const updated = leases.map(l => 
      l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
    );
    setLeases(updated);
    await saveData(STORAGE_KEYS.LEASES, updated);
    
    if (wasTerminated && lease) {
      console.log(`[AUTOMATION] Lease ${id} terminated - Updating unit availability`);
      
      const updatedUnits = units.map(u => 
        u.id === lease.unit_id ? { ...u, status: 'available' as const, updated_at: new Date().toISOString() } : u
      );
      setUnits(updatedUnits);
      await saveData(STORAGE_KEYS.UNITS, updatedUnits);
      
      console.log(`[AUTOMATION] Unit ${lease.unit_id} marked as available`);
    }
  }, [leases, units, saveData]);

  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!currentTenant) return;
    
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (!newPayment.account_code) {
      newPayment.account_code = assignAccountCodeToPayment(newPayment);
      console.log(`[FINANCE] Auto-assigned account code ${newPayment.account_code} to payment ${newPayment.payment_type || 'rent'}`);
    }
    
    const updated = [...payments, newPayment];
    setPayments(updated);
    await saveData(STORAGE_KEYS.PAYMENTS, updated);
    
    if (newPayment.status === 'paid' && currentUser) {
      const lease = leases.find(l => l.id === newPayment.lease_id);
      if (lease) {
        const entries = createPaymentJournalEntries(newPayment, lease, currentTenant.id, currentUser.id);
        const updatedJournalEntries = [...journalEntries, ...entries];
        setJournalEntries(updatedJournalEntries);
        await saveData(STORAGE_KEYS.JOURNAL_ENTRIES, updatedJournalEntries);
        console.log(`[FINANCE] Created ${entries.length} journal entries for payment ${newPayment.id}`);
      }
    }
    
    if (shouldGenerateInvoiceFromPayment(newPayment, invoices) && currentTenant) {
      console.log(`[AUTOMATION] Generating invoice for payment ${newPayment.id}`);
      
      const lease = leases.find(l => l.id === newPayment.lease_id);
      if (lease) {
        const property = properties.find(p => p.id === lease.property_id);
        const unit = units.find(u => u.id === lease.unit_id);
        
        if (property && unit) {
          const invoiceData = generateInvoiceFromPayment(
            newPayment,
            lease,
            property,
            unit,
            currentTenant.id
          );
          
          const newInvoice: Invoice = {
            ...invoiceData,
            id: `${Date.now()}-auto`,
            tenant_id: currentTenant.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Invoice;
          
          const updatedInvoices = [...invoices, newInvoice];
          setInvoices(updatedInvoices);
          await saveData(STORAGE_KEYS.INVOICES, updatedInvoices);
          
          console.log(`[AUTOMATION] Auto-generated invoice ${newInvoice.invoice_number} for payment`);
        }
      }
    }
    
    return newPayment;
  }, [currentTenant, currentUser, payments, invoices, leases, properties, units, journalEntries, saveData]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    const payment = payments.find(p => p.id === id);
    const amountChanged = updates.amount && updates.amount !== payment?.amount;
    
    const updated = payments.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    setPayments(updated);
    await saveData(STORAGE_KEYS.PAYMENTS, updated);
    
    if (amountChanged) {
      console.log(`[FINANCE] Payment amount updated from ${payment?.amount} to ${updates.amount} - Triggering financial recalculation`);
    } else {
      console.log('[FINANCE] Payment updated - Financial reports will auto-recalculate via React');
    }
    
    if (currentTenant && payment && updates.status === 'overdue') {
      if (shouldTriggerAutomation('overdue_payment_followup', { payment: { ...payment, ...updates } })) {
        const dueDate = new Date(payment.due_date);
        const daysOverdue = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const hasExistingTodo = todos.some(
          t => t.related_to_id === id && t.category === 'payment' && t.title.includes('Overdue')
        );
        
        if (!hasExistingTodo) {
          const overduePaymentTodo = generateOverduePaymentTodo({ ...payment, ...updates }, currentTenant.id, daysOverdue);
          const newTodo: Todo = {
            ...overduePaymentTodo,
            id: `${Date.now()}-overdue-payment`,
            tenant_id: currentTenant.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const updatedTodos = [...todos, newTodo];
          setTodos(updatedTodos);
          await saveData(STORAGE_KEYS.TODOS, updatedTodos);
        }
      }
    }
    
    if (currentTenant && payment && updates.status === 'paid') {
      const matchingInvoiceId = linkPaymentToInvoice({ ...payment, ...updates }, invoices);
      if (matchingInvoiceId) {
        console.log(`[AUTOMATION] Auto-linking payment ${id} to invoice ${matchingInvoiceId}`);
        const updatedInvoices = invoices.map(inv => 
          inv.id === matchingInvoiceId ? { 
            ...inv, 
            payment_id: id,
            status: 'paid' as const,
            paid_at: new Date().toISOString(),
            amount_paid: inv.total_amount,
            balance_due: 0,
            updated_at: new Date().toISOString() 
          } : inv
        );
        setInvoices(updatedInvoices);
        await saveData(STORAGE_KEYS.INVOICES, updatedInvoices);
        console.log(`[AUTOMATION] Invoice ${matchingInvoiceId} marked as paid and linked to payment`);
        console.log('[FINANCE] Payment-invoice link created - Financial recalculation triggered');
      }
    }
  }, [payments, currentTenant, todos, invoices, saveData]);

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
    const maintenance = maintenanceRequests.find(m => m.id === id);
    const updated = maintenanceRequests.map(m => 
      m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
    );
    setMaintenanceRequests(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE, updated);
    
    if (currentTenant && currentUser && maintenance && updates.cost && maintenance.cost !== updates.cost) {
      console.log(`[AUTOMATION] Maintenance cost updated to ${updates.cost} - Creating/updating expense record`);
      console.log('[FINANCE] Triggering financial recalculation due to maintenance cost update');
      
      const updatedMaintenance = { ...maintenance, ...updates };
      
      const existingExpense = expenses.find(
        e => e.notes?.includes(`maintenance request ${maintenance.id}`)
      );
      
      if (existingExpense) {
        const updatedExpenses = expenses.map(e => 
          e.id === existingExpense.id ? {
            ...e,
            amount: updates.cost!,
            expense_date: updates.completed_date || e.expense_date,
            receipts: updatedMaintenance.receipts || e.receipts,
            updated_at: new Date().toISOString(),
          } : e
        );
        setExpenses(updatedExpenses);
        await saveData(STORAGE_KEYS.EXPENSES, updatedExpenses);
        console.log(`[AUTOMATION] Expense ${existingExpense.id} updated with new cost and receipts`);
      } else {
        const newExpense: Expense = {
          id: Date.now().toString(),
          tenant_id: currentTenant.id,
          created_by: currentUser.id,
          property_id: maintenance.property_id,
          unit_id: maintenance.unit_id,
          category: 'maintenance',
          description: `Maintenance: ${maintenance.title}`,
          amount: updates.cost!,
          currency: 'SCR',
          expense_date: updates.completed_date || new Date().toISOString().split('T')[0],
          paid_by: 'landlord',
          status: 'paid',
          notes: `Auto-generated from maintenance request ${maintenance.id}`,
          receipts: updatedMaintenance.receipts,
          account_code: mapExpenseCategoryToAccount('maintenance'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedExpenses = [...expenses, newExpense];
        setExpenses(updatedExpenses);
        await saveData(STORAGE_KEYS.EXPENSES, updatedExpenses);
        console.log(`[AUTOMATION] Expense created for maintenance ${maintenance.id} with ${updatedMaintenance.receipts?.length || 0} receipts`);
      }
      console.log('[FINANCE] Financial recalculation triggered - React will re-render finance reports');
    }
    
    if (currentTenant && maintenance && updates.status === 'resolved' && !updates.cost) {
      if (shouldTriggerAutomation('maintenance_inspection', { maintenance: { ...maintenance, ...updates } })) {
        const hasExistingTodo = todos.some(
          t => t.related_to_id === id && t.category === 'inspection' && t.title.includes('Post-Maintenance')
        );
        
        if (!hasExistingTodo) {
          const inspectionTodo = generateMaintenanceCompletionInspectionTodo({ ...maintenance, ...updates }, currentTenant.id);
          const newTodo: Todo = {
            ...inspectionTodo,
            id: `${Date.now()}-maintenance-inspection`,
            tenant_id: currentTenant.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const updatedTodos = [...todos, newTodo];
          setTodos(updatedTodos);
          await saveData(STORAGE_KEYS.TODOS, updatedTodos);
        }
      }
    }
  }, [maintenanceRequests, currentTenant, currentUser, todos, expenses, saveData]);

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
    const schedule = maintenanceSchedules.find(s => s.id === id);
    const updated = maintenanceSchedules.map(s => 
      s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
    );
    setMaintenanceSchedules(updated);
    await saveData(STORAGE_KEYS.MAINTENANCE_SCHEDULES, updated);
    
    if (currentTenant && schedule && updates.next_service_date) {
      if (shouldTriggerAutomation('preventive_maintenance', { schedule: { ...schedule, ...updates } })) {
        const hasExistingTodo = todos.some(
          t => t.related_to_id === id && t.title.includes(schedule.asset_name)
        );
        
        if (!hasExistingTodo) {
          const preventiveTodo = generatePreventiveMaintenanceTodo({ ...schedule, ...updates }, currentTenant.id);
          const newTodo: Todo = {
            ...preventiveTodo,
            id: `${Date.now()}-preventive-maintenance`,
            tenant_id: currentTenant.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const updatedTodos = [...todos, newTodo];
          setTodos(updatedTodos);
          await saveData(STORAGE_KEYS.TODOS, updatedTodos);
        }
      }
    }
  }, [maintenanceSchedules, currentTenant, todos, saveData]);

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
    const invoice = invoices.find(i => i.id === id);
    const updated = invoices.map(i => 
      i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
    );
    setInvoices(updated);
    await saveData(STORAGE_KEYS.INVOICES, updated);
    
    if (currentTenant && currentUser && invoice && updates.status === 'paid' && invoice.status !== 'paid') {
      console.log(`[AUTOMATION] Invoice ${id} marked as paid - Auto-creating payment record`);
      
      const lease = leases.find(l => l.id === invoice.lease_id);
      if (lease) {
        const newPayment: Payment = {
          id: `${Date.now()}-from-invoice-${id}`,
          tenant_id: currentTenant.id,
          lease_id: lease.id,
          tenant_renter_id: invoice.tenant_renter_id,
          amount: invoice.total_amount,
          currency: invoice.currency,
          payment_date: updates.paid_at || new Date().toISOString().split('T')[0],
          due_date: invoice.due_date,
          status: 'paid',
          payment_method: 'bank_transfer',
          notes: `Auto-generated from invoice ${invoice.invoice_number}`,
          account_code: assignAccountCodeToPayment({ payment_type: 'rent' } as Payment),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedPayments = [...payments, newPayment];
        setPayments(updatedPayments);
        await saveData(STORAGE_KEYS.PAYMENTS, updatedPayments);
        
        const updatedInvoices = invoices.map(inv => 
          inv.id === id ? { ...inv, payment_id: newPayment.id } : inv
        );
        setInvoices(updatedInvoices);
        await saveData(STORAGE_KEYS.INVOICES, updatedInvoices);
        
        console.log(`[AUTOMATION] Payment record ${newPayment.id} created and linked to invoice ${id}`);
        console.log('[FINANCE] Invoice marked paid - Financial recalculation triggered');
      }
    }
  }, [invoices, currentTenant, currentUser, leases, payments, saveData]);

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
    
    if (document.expiry_date && currentTenant) {
      const expiryDate = new Date(document.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
        console.log(`[AUTOMATION] Document ${newDocument.id} expires in ${daysUntilExpiry} days - Creating reminder`);
        
        const reminderTodo = generateDocumentExpiryReminder(
          newDocument.id,
          newDocument.name,
          newDocument.expiry_date!,
          currentTenant.id
        );
        
        const newTodo: Todo = {
          ...reminderTodo,
          id: `${Date.now()}-doc-expiry`,
          tenant_id: currentTenant.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedTodos = [...todos, newTodo];
        setTodos(updatedTodos);
        await saveData(STORAGE_KEYS.TODOS, updatedTodos);
        
        console.log(`[AUTOMATION] Created document expiry reminder for ${newDocument.name}`);
      }
    }
    
    return newDocument;
  }, [currentTenant, currentUser, businessDocuments, todos, saveData]);

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
    const application = tenantApplications.find(a => a.id === id);
    const wasApproved = updates.status === 'approved' && application && application.status !== 'approved';
    
    const updated = tenantApplications.map(a => 
      a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    );
    setTenantApplications(updated);
    await saveData(STORAGE_KEYS.TENANT_APPLICATIONS, updated);
    
    if (wasApproved && application && currentTenant) {
      console.log(`[AUTOMATION] Application ${id} approved - Creating tenant automatically`);
      
      const existingTenant = tenantRenters.find(
        t => t.email === application.applicant_email
      );
      
      if (!existingTenant) {
        const newTenantRenter: TenantRenter = {
          id: `${Date.now()}-from-app-${application.id}`,
          tenant_id: currentTenant.id,
          type: application.applicant_type,
          first_name: application.applicant_type === 'individual' ? application.applicant_first_name : undefined,
          last_name: application.applicant_type === 'individual' ? application.applicant_last_name : undefined,
          business_name: application.applicant_type === 'business' ? application.business_name : undefined,
          email: application.applicant_email,
          phone: application.applicant_phone,
          date_of_birth: application.date_of_birth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedTenantRenters = [...tenantRenters, newTenantRenter];
        setTenantRenters(updatedTenantRenters);
        await saveData(STORAGE_KEYS.TENANT_RENTERS, updatedTenantRenters);
        
        console.log(`[AUTOMATION] Tenant created: ${newTenantRenter.id} from application ${id}`);
      } else {
        console.log(`[AUTOMATION] Tenant already exists with email ${application.applicant_email}`);
      }
    }
  }, [tenantApplications, tenantRenters, currentTenant, saveData]);

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

  const updateBusinessLogo = useCallback(async (logoUri: string | null) => {
    setBusinessLogo(logoUri);
    if (logoUri) {
      await saveData(STORAGE_KEYS.BUSINESS_LOGO, logoUri);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.BUSINESS_LOGO);
    }
  }, [saveData]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'created_by'>) => {
    if (!currentTenant || !currentUser) return;
    
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      tenant_id: currentTenant.id,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (!newExpense.account_code) {
      newExpense.account_code = assignAccountCodeToExpense(newExpense);
      console.log(`[FINANCE] Auto-assigned account code ${newExpense.account_code} to expense ${newExpense.category}`);
    }
    
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    await saveData(STORAGE_KEYS.EXPENSES, updated);
    
    if (newExpense.status === 'paid' || newExpense.status === 'pending' || newExpense.status === 'approved') {
      const entries = createExpenseJournalEntries(newExpense, currentTenant.id, currentUser.id);
      const updatedJournalEntries = [...journalEntries, ...entries];
      setJournalEntries(updatedJournalEntries);
      await saveData(STORAGE_KEYS.JOURNAL_ENTRIES, updatedJournalEntries);
      console.log(`[FINANCE] Created ${entries.length} journal entries for expense ${newExpense.id}`);
    }
    
    return newExpense;
  }, [currentTenant, currentUser, expenses, journalEntries, saveData]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const expense = expenses.find(e => e.id === id);
    const amountChanged = updates.amount && updates.amount !== expense?.amount;
    
    const updated = expenses.map(e => 
      e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
    );
    setExpenses(updated);
    await saveData(STORAGE_KEYS.EXPENSES, updated);
    
    if (amountChanged) {
      console.log(`[FINANCE] Expense amount updated from ${expense?.amount} to ${updates.amount} - Triggering financial recalculation`);
    } else {
      console.log('[FINANCE] Expense updated - Financial reports will auto-recalculate via React');
    }
  }, [expenses, saveData]);

  const deleteExpense = useCallback(async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await saveData(STORAGE_KEYS.EXPENSES, updated);
  }, [expenses, saveData]);

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

  const tenantExpenses = useMemo(() => 
    expenses.filter(e => e.tenant_id === currentTenant?.id),
    [expenses, currentTenant]
  );

  const tenantJournalEntries = useMemo(() => 
    journalEntries.filter(j => j.tenant_id === currentTenant?.id),
    [journalEntries, currentTenant]
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
    businessLogo,
    updateBusinessLogo,
    expenses: tenantExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    journalEntries: tenantJournalEntries,
  };
});
