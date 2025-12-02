import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateInvoiceNumber, shouldGenerateInvoice, generateMonthlyInvoiceDate, generateInvoiceData } from './invoiceGenerator';
import type { Lease, Invoice, Property, Unit, TenantRenter } from '@/types';

const STORAGE_KEY = '@app/last_reminder_check';
const INVOICE_CHECK_KEY = '@app/last_invoice_check';

const REMINDER_CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const INVOICE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

export class AppInitializer {
  static async checkAndCreateExpiringDocumentReminders(): Promise<void> {
    try {
      console.log('[APP_INITIALIZER] Checking if reminder check is needed...');
      
      const lastCheckStr = await AsyncStorage.getItem(STORAGE_KEY);
      const lastCheck = lastCheckStr ? parseInt(lastCheckStr) : 0;
      const now = Date.now();
      
      if (now - lastCheck < REMINDER_CHECK_INTERVAL) {
        console.log('[APP_INITIALIZER] Last check was recent, skipping...');
        return;
      }
      
      console.log('[APP_INITIALIZER] Running reminder check...');
      
      const businessDocumentsStr = await AsyncStorage.getItem('@app/business_documents');
      if (!businessDocumentsStr) {
        console.log('[APP_INITIALIZER] No documents found, skipping');
        await AsyncStorage.setItem(STORAGE_KEY, now.toString());
        return;
      }
      
      const businessDocuments = JSON.parse(businessDocumentsStr);
      const currentTenantStr = await AsyncStorage.getItem('@app/current_tenant');
      const currentUserStr = await AsyncStorage.getItem('@app/current_user');
      
      if (!currentTenantStr || !currentUserStr) {
        console.log('[APP_INITIALIZER] No current tenant or user, skipping');
        await AsyncStorage.setItem(STORAGE_KEY, now.toString());
        return;
      }
      
      const currentTenant = JSON.parse(currentTenantStr);
      const currentUser = JSON.parse(currentUserStr);
      
      const todosStr = await AsyncStorage.getItem('@app/todos');
      const todos = todosStr ? JSON.parse(todosStr) : [];
      
      const today = new Date();
      const sixtyDaysFromNow = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));
      
      let newRemindersCreated = 0;
      
      for (const doc of businessDocuments) {
        if (!doc.expiry_date || doc.tenant_id !== currentTenant.id) continue;
        
        const expiryDate = new Date(doc.expiry_date);
        
        if (expiryDate < today) continue;
        if (expiryDate > sixtyDaysFromNow) continue;
        
        const existingReminder = todos.find(
          (t: any) => 
            t.related_to_id === doc.id && 
            t.category === 'document' && 
            t.title.includes('expiring')
        );
        
        if (existingReminder) continue;
        
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (daysUntilExpiry <= 7) priority = 'urgent';
        else if (daysUntilExpiry <= 14) priority = 'high';
        else if (daysUntilExpiry <= 30) priority = 'medium';
        else priority = 'low';
        
        const newTodo = {
          id: `${Date.now()}-${Math.random()}-doc-expiry-${doc.id}`,
          tenant_id: currentTenant.id,
          title: `Document expiring: ${doc.name}`,
          description: `${doc.name} will expire on ${expiryDate.toLocaleDateString()}. Please renew or update this document.`,
          status: 'pending',
          priority,
          category: 'document',
          due_date: doc.expiry_date,
          related_to_type: 'business_document',
          related_to_id: doc.id,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        todos.push(newTodo);
        newRemindersCreated++;
        
        console.log(
          `[APP_INITIALIZER] Created reminder for document "${doc.name}" expiring in ${daysUntilExpiry} days`
        );
      }
      
      if (newRemindersCreated > 0) {
        await AsyncStorage.setItem('@app/todos', JSON.stringify(todos));
        console.log(`[APP_INITIALIZER] Created ${newRemindersCreated} new document expiry reminders`);
      } else {
        console.log('[APP_INITIALIZER] No new reminders needed');
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, now.toString());
      console.log('[APP_INITIALIZER] Reminder check completed');
    } catch (error) {
      console.error('[APP_INITIALIZER] Error checking expiring documents:', error);
    }
  }

  static async autoGenerateMonthlyInvoices(): Promise<void> {
    try {
      console.log('[APP_INITIALIZER] Checking if invoice generation is needed...');
      
      const lastCheckStr = await AsyncStorage.getItem(INVOICE_CHECK_KEY);
      const lastCheck = lastCheckStr ? parseInt(lastCheckStr) : 0;
      const now = Date.now();
      
      if (now - lastCheck < INVOICE_CHECK_INTERVAL) {
        console.log('[APP_INITIALIZER] Last invoice check was recent, skipping...');
        return;
      }
      
      console.log('[APP_INITIALIZER] Running invoice auto-generation check...');
      
      const [currentTenantStr, leasesStr, invoicesStr, propertiesStr, unitsStr, tenantRentersStr] = await Promise.all([
        AsyncStorage.getItem('@app/current_tenant'),
        AsyncStorage.getItem('@app/leases'),
        AsyncStorage.getItem('@app/invoices'),
        AsyncStorage.getItem('@app/properties'),
        AsyncStorage.getItem('@app/units'),
        AsyncStorage.getItem('@app/tenant_renters'),
      ]);
      
      if (!currentTenantStr) {
        console.log('[APP_INITIALIZER] No current tenant, skipping invoice generation');
        await AsyncStorage.setItem(INVOICE_CHECK_KEY, now.toString());
        return;
      }
      
      const currentTenant = JSON.parse(currentTenantStr);
      const leases: Lease[] = leasesStr ? JSON.parse(leasesStr) : [];
      const invoices: Invoice[] = invoicesStr ? JSON.parse(invoicesStr) : [];
      const properties: Property[] = propertiesStr ? JSON.parse(propertiesStr) : [];
      const units: Unit[] = unitsStr ? JSON.parse(unitsStr) : [];
      const tenantRenters: TenantRenter[] = tenantRentersStr ? JSON.parse(tenantRentersStr) : [];
      
      const activeLeases = leases.filter(l => 
        l.status === 'active' && l.tenant_id === currentTenant.id
      );
      
      if (activeLeases.length === 0) {
        console.log('[APP_INITIALIZER] No active leases found, skipping');
        await AsyncStorage.setItem(INVOICE_CHECK_KEY, now.toString());
        return;
      }
      
      let newInvoicesCreated = 0;
      
      for (const lease of activeLeases) {
        if (!shouldGenerateInvoice(lease, invoices)) {
          continue;
        }
        
        const property = properties.find(p => p.id === lease.property_id);
        const unit = units.find(u => u.id === lease.unit_id);
        const tenantRenter = tenantRenters.find(tr => tr.id === lease.tenant_renter_id);
        
        if (!property || !unit || !tenantRenter) {
          console.log(`[APP_INITIALIZER] Missing data for lease ${lease.id}, skipping`);
          continue;
        }
        
        const { invoiceDate, dueDate, rentPeriod } = generateMonthlyInvoiceDate(lease);
        const invoiceNumber = generateInvoiceNumber(invoices.length);
        
        const invoiceData = generateInvoiceData({
          lease,
          tenantRenter,
          property,
          unit,
          invoiceDate,
          dueDate,
          currency: 'SCR',
          invoiceNumber,
          autoGenerated: true,
          recurringPeriod: 'monthly',
          rentPeriod,
        });
        
        const newInvoice: Invoice = {
          ...invoiceData,
          id: `${Date.now()}-${Math.random()}-auto`,
          tenant_id: currentTenant.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        invoices.push(newInvoice);
        newInvoicesCreated++;
        
        console.log(
          `[APP_INITIALIZER] Auto-generated invoice ${invoiceNumber} for lease ${lease.id} (${rentPeriod})`
        );
      }
      
      if (newInvoicesCreated > 0) {
        await AsyncStorage.setItem('@app/invoices', JSON.stringify(invoices));
        console.log(`[APP_INITIALIZER] Auto-generated ${newInvoicesCreated} monthly invoices`);
      } else {
        console.log('[APP_INITIALIZER] No new invoices needed for this month');
      }
      
      await AsyncStorage.setItem(INVOICE_CHECK_KEY, now.toString());
      console.log('[APP_INITIALIZER] Invoice auto-generation check completed');
    } catch (error) {
      console.error('[APP_INITIALIZER] Error auto-generating invoices:', error);
    }
  }

  static async runAllInitializers(): Promise<void> {
    console.log('[APP_INITIALIZER] Running all initialization tasks...');
    await Promise.all([
      this.checkAndCreateExpiringDocumentReminders(),
      this.autoGenerateMonthlyInvoices(),
    ]);
    console.log('[APP_INITIALIZER] All initialization tasks completed');
  }
}
