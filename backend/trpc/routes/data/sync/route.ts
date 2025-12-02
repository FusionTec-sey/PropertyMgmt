import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { inMemoryDB } from '../../../../db/schema';

const syncRoute = {
  getAllData: publicProcedure
    .input(z.object({ 
      tenantId: z.string(),
      lastSyncTime: z.string().optional()
    }))
    .query(({ input }) => {
      console.log(`[SYNC] Getting all data for tenant ${input.tenantId}`);
      
      const filterByTenant = <T extends { tenant_id: string }>(items: T[]) => 
        items.filter(item => item.tenant_id === input.tenantId);

      return {
        properties: filterByTenant(inMemoryDB.properties),
        units: filterByTenant(inMemoryDB.units),
        tenant_renters: filterByTenant(inMemoryDB.tenant_renters),
        leases: filterByTenant(inMemoryDB.leases),
        payments: filterByTenant(inMemoryDB.payments),
        maintenance_requests: filterByTenant(inMemoryDB.maintenance_requests),
        notifications: filterByTenant(inMemoryDB.notifications),
        move_in_checklists: filterByTenant(inMemoryDB.move_in_checklists),
        property_items: filterByTenant(inMemoryDB.property_items),
        maintenance_schedules: filterByTenant(inMemoryDB.maintenance_schedules),
        todos: filterByTenant(inMemoryDB.todos),
        inventory_history: filterByTenant(inMemoryDB.inventory_history),
        invoices: filterByTenant(inMemoryDB.invoices),
        business_documents: filterByTenant(inMemoryDB.business_documents),
        tenant_applications: filterByTenant(inMemoryDB.tenant_applications),
        tenant_onboardings: filterByTenant(inMemoryDB.tenant_onboardings),
        property_inspections: filterByTenant(inMemoryDB.property_inspections),
        expenses: filterByTenant(inMemoryDB.expenses),
        staff_users: filterByTenant(inMemoryDB.staff_users),
        syncTime: new Date().toISOString(),
      };
    }),

  pushChanges: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      changes: z.object({
        properties: z.array(z.any()).optional(),
        units: z.array(z.any()).optional(),
        tenant_renters: z.array(z.any()).optional(),
        leases: z.array(z.any()).optional(),
        payments: z.array(z.any()).optional(),
        maintenance_requests: z.array(z.any()).optional(),
        notifications: z.array(z.any()).optional(),
        move_in_checklists: z.array(z.any()).optional(),
        property_items: z.array(z.any()).optional(),
        maintenance_schedules: z.array(z.any()).optional(),
        todos: z.array(z.any()).optional(),
        inventory_history: z.array(z.any()).optional(),
        invoices: z.array(z.any()).optional(),
        business_documents: z.array(z.any()).optional(),
        tenant_applications: z.array(z.any()).optional(),
        tenant_onboardings: z.array(z.any()).optional(),
        property_inspections: z.array(z.any()).optional(),
        expenses: z.array(z.any()).optional(),
        staff_users: z.array(z.any()).optional(),
      }),
    }))
    .mutation(({ input }) => {
      console.log(`[SYNC] Pushing changes for tenant ${input.tenantId}`);
      
      const mergeData = <T extends { id: string; version: number; tenant_id: string }>(
        dbArray: T[],
        changes: T[] | undefined
      ): T[] => {
        if (!changes || changes.length === 0) return dbArray;

        const merged = [...dbArray];
        
        for (const change of changes) {
          const existingIndex = merged.findIndex(item => item.id === change.id);
          
          if (existingIndex === -1) {
            merged.push({ ...change, version: 1 });
          } else {
            const existing = merged[existingIndex];
            if (change.version >= existing.version) {
              merged[existingIndex] = { ...change, version: change.version + 1 };
            }
          }
        }
        
        return merged;
      };

      inMemoryDB.properties = mergeData(inMemoryDB.properties, input.changes.properties as any);
      inMemoryDB.units = mergeData(inMemoryDB.units, input.changes.units as any);
      inMemoryDB.tenant_renters = mergeData(inMemoryDB.tenant_renters, input.changes.tenant_renters as any);
      inMemoryDB.leases = mergeData(inMemoryDB.leases, input.changes.leases as any);
      inMemoryDB.payments = mergeData(inMemoryDB.payments, input.changes.payments as any);
      inMemoryDB.maintenance_requests = mergeData(inMemoryDB.maintenance_requests, input.changes.maintenance_requests as any);
      inMemoryDB.notifications = mergeData(inMemoryDB.notifications, input.changes.notifications as any);
      inMemoryDB.move_in_checklists = mergeData(inMemoryDB.move_in_checklists, input.changes.move_in_checklists as any);
      inMemoryDB.property_items = mergeData(inMemoryDB.property_items, input.changes.property_items as any);
      inMemoryDB.maintenance_schedules = mergeData(inMemoryDB.maintenance_schedules, input.changes.maintenance_schedules as any);
      inMemoryDB.todos = mergeData(inMemoryDB.todos, input.changes.todos as any);
      inMemoryDB.inventory_history = mergeData(inMemoryDB.inventory_history, input.changes.inventory_history as any);
      inMemoryDB.invoices = mergeData(inMemoryDB.invoices, input.changes.invoices as any);
      inMemoryDB.business_documents = mergeData(inMemoryDB.business_documents, input.changes.business_documents as any);
      inMemoryDB.tenant_applications = mergeData(inMemoryDB.tenant_applications, input.changes.tenant_applications as any);
      inMemoryDB.tenant_onboardings = mergeData(inMemoryDB.tenant_onboardings, input.changes.tenant_onboardings as any);
      inMemoryDB.property_inspections = mergeData(inMemoryDB.property_inspections, input.changes.property_inspections as any);
      inMemoryDB.expenses = mergeData(inMemoryDB.expenses, input.changes.expenses as any);
      inMemoryDB.staff_users = mergeData(inMemoryDB.staff_users, input.changes.staff_users as any);

      return {
        success: true,
        syncTime: new Date().toISOString(),
      };
    }),
};

export default syncRoute;
