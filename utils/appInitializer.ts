import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app/last_reminder_check';

const REMINDER_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

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
}
