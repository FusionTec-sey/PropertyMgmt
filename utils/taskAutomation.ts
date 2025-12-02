import {
  Lease,
  Payment,
  MaintenanceRequest,
  Invoice,
  BusinessDocument,
  TenantApplication,
  PropertyInspection,
  Todo,
  Expense,
  Property,
  Unit,
} from '@/types';
import {
  generateLeaseRenewalReminder,
  generateMoveOutChecklistReminder,
  generateOverduePaymentTodo,
  generateMaintenanceCompletionInspectionTodo,
  generateDocumentExpiryReminder,
} from '@/utils/automationHelper';

export interface TaskGenerationResult {
  tasks: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>[];
  completedTaskIds: string[];
  summary: {
    generated: number;
    completed: number;
    categories: { [key: string]: number };
  };
}

export const generateAutomaticTasks = (
  leases: Lease[],
  payments: Payment[],
  maintenanceRequests: MaintenanceRequest[],
  invoices: Invoice[],
  businessDocuments: BusinessDocument[],
  tenantApplications: TenantApplication[],
  propertyInspections: PropertyInspection[],
  expenses: Expense[],
  properties: Property[],
  units: Unit[],
  existingTodos: Todo[],
  tenantId: string
): TaskGenerationResult => {
  const newTasks: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>[] = [];
  const categories: { [key: string]: number } = {};

  const addTask = (task: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    const isDuplicate = existingTodos.some(
      t =>
        t.title === task.title &&
        t.related_to_id === task.related_to_id &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );

    if (!isDuplicate) {
      newTasks.push(task);
      categories[task.category || 'general'] = (categories[task.category || 'general'] || 0) + 1;
    }
  };

  leases.forEach(lease => {
    const endDate = new Date(lease.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (lease.status === 'active') {
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 60) {
        addTask(generateLeaseRenewalReminder(lease, tenantId, 60));
      }

      if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        addTask(generateMoveOutChecklistReminder(lease, tenantId));
      }

      if (daysUntilExpiry > 0 && daysUntilExpiry <= 30 && !lease.renewal_offer) {
        addTask({
          title: `Prepare Lease Renewal Offer - ${lease.unit_id}`,
          description: `Lease expires in ${daysUntilExpiry} days. Prepare and send renewal offer to tenant.`,
          priority: 'high',
          status: 'pending',
          due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: 'lease',
          related_to_type: 'lease',
          related_to_id: lease.id,
        });
      }
    }

    if (lease.status === 'draft' && !lease.signed_agreement) {
      const daysSinceDraft = Math.ceil(
        (today.getTime() - new Date(lease.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDraft >= 7) {
        addTask({
          title: `Complete Draft Lease - ${lease.unit_id}`,
          description: `Draft lease has been pending for ${daysSinceDraft} days. Finalize and get signatures.`,
          priority: 'high',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'lease',
          related_to_type: 'lease',
          related_to_id: lease.id,
        });
      }
    }
  });

  payments.forEach(payment => {
    if (payment.status === 'overdue') {
      const dueDate = new Date(payment.due_date);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue >= 3) {
        addTask(generateOverduePaymentTodo(payment, tenantId, daysOverdue));
      }

      if (daysOverdue >= 30 && daysOverdue < 35) {
        addTask({
          title: `Escalate: 30+ Days Overdue Payment`,
          description: `Payment of ${payment.amount} ${payment.currency} is ${daysOverdue} days overdue. Consider legal action or lease termination discussion.`,
          priority: 'urgent',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'payment',
          related_to_type: 'payment',
          related_to_id: payment.id,
        });
      }
    }

    if (payment.status === 'pending') {
      const dueDate = new Date(payment.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 3 && daysUntilDue >= 0) {
        addTask({
          title: `Send Payment Reminder`,
          description: `Payment of ${payment.amount} ${payment.currency} due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Send reminder to tenant.`,
          priority: 'medium',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'payment',
          related_to_type: 'payment',
          related_to_id: payment.id,
        });
      }
    }
  });

  maintenanceRequests.forEach(maintenance => {
    if (maintenance.status === 'open') {
      const reportedDate = new Date(maintenance.reported_date);
      const daysSinceReported = Math.ceil(
        (today.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (maintenance.priority === 'urgent' && daysSinceReported >= 1) {
        addTask({
          title: `URGENT: Address Maintenance Request`,
          description: `Urgent maintenance request: ${maintenance.title}. Reported ${daysSinceReported} day${daysSinceReported !== 1 ? 's' : ''} ago.`,
          priority: 'urgent',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'maintenance',
          related_to_type: 'maintenance',
          related_to_id: maintenance.id,
        });
      } else if (daysSinceReported >= 7) {
        addTask({
          title: `Follow Up: Pending Maintenance`,
          description: `Maintenance request: ${maintenance.title}. Open for ${daysSinceReported} days - assign or schedule.`,
          priority: maintenance.priority === 'high' ? 'high' : 'medium',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'maintenance',
          related_to_type: 'maintenance',
          related_to_id: maintenance.id,
        });
      }
    }

    if (maintenance.status === 'in_progress' && maintenance.scheduled_date) {
      const scheduledDate = new Date(maintenance.scheduled_date);
      const daysOverdue = Math.ceil((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue > 0) {
        addTask({
          title: `Check Maintenance Progress`,
          description: `Maintenance: ${maintenance.title} was scheduled ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago. Check status and completion.`,
          priority: maintenance.priority === 'urgent' ? 'urgent' : 'high',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'maintenance',
          related_to_type: 'maintenance',
          related_to_id: maintenance.id,
        });
      }
    }

    if (maintenance.status === 'resolved' && (maintenance.priority === 'urgent' || maintenance.priority === 'high')) {
      addTask(generateMaintenanceCompletionInspectionTodo(maintenance, tenantId));
    }

    if (maintenance.status === 'resolved' && maintenance.cost && !maintenance.related_expense_id) {
      addTask({
        title: `Record Expense: ${maintenance.title}`,
        description: `Maintenance completed with cost ${maintenance.cost}. Create expense record for tracking.`,
        priority: 'medium',
        status: 'pending',
        due_date: today.toISOString().split('T')[0],
        category: 'maintenance',
        related_to_type: 'maintenance',
        related_to_id: maintenance.id,
      });
    }
  });

  businessDocuments.forEach(doc => {
    if (doc.expiry_date) {
      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry > 0 && daysUntilExpiry <= 60) {
        addTask(generateDocumentExpiryReminder(doc.id, doc.name, doc.expiry_date, tenantId, 60));
      }

      if (daysUntilExpiry <= 0 && daysUntilExpiry >= -7) {
        addTask({
          title: `EXPIRED: Renew ${doc.name}`,
          description: `${doc.name} has expired. Renew immediately to maintain compliance.`,
          priority: 'urgent',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'other',
          related_to_type: 'property',
          related_to_id: doc.id,
        });
      }
    }
  });

  invoices.forEach(invoice => {
    if (invoice.status === 'overdue') {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      addTask({
        title: `Follow Up: Overdue Invoice ${invoice.invoice_number}`,
        description: `Invoice ${daysOverdue} days overdue. Contact tenant for payment.`,
        priority: daysOverdue > 7 ? 'urgent' : 'high',
        status: 'pending',
        due_date: today.toISOString().split('T')[0],
        category: 'payment',
        related_to_type: 'payment',
        related_to_id: invoice.id,
      });
    }

    if (invoice.status === 'sent') {
      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 3 && daysUntilDue >= 0) {
        addTask({
          title: `Invoice Payment Reminder - ${invoice.invoice_number}`,
          description: `Invoice due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Send payment reminder.`,
          priority: 'medium',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'payment',
          related_to_type: 'payment',
          related_to_id: invoice.id,
        });
      }
    }
  });

  tenantApplications.forEach(app => {
    if (app.status === 'pending' || app.status === 'under_review') {
      const submittedDate = new Date(app.created_at);
      const daysPending = Math.ceil((today.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPending >= 3) {
        addTask({
          title: `Review Tenant Application`,
          description: `Application from ${app.applicant_email} pending for ${daysPending} days. Review and make decision.`,
          priority: daysPending >= 7 ? 'high' : 'medium',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'lease',
          related_to_type: 'tenant_renter',
          related_to_id: app.id,
        });
      }
    }

    if (app.status === 'approved' && !app.tenant_renter_id) {
      addTask({
        title: `Create Tenant Profile`,
        description: `Application approved for ${app.applicant_email}. Create tenant profile and initiate lease process.`,
        priority: 'high',
        status: 'pending',
        due_date: today.toISOString().split('T')[0],
        category: 'lease',
        related_to_type: 'tenant_renter',
        related_to_id: app.id,
      });
    }
  });

  propertyInspections.forEach(inspection => {
    if (inspection.status === 'scheduled') {
      const scheduledDate = new Date(inspection.scheduled_date);
      const daysUntilInspection = Math.ceil(
        (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilInspection === 1) {
        addTask({
          title: `Tomorrow: Property Inspection`,
          description: `${inspection.inspection_type} inspection scheduled for tomorrow. Prepare and confirm with tenant.`,
          priority: 'high',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'inspection',
          related_to_type: 'property',
          related_to_id: inspection.id,
        });
      }

      if (daysUntilInspection < 0) {
        addTask({
          title: `Missed Inspection - Reschedule`,
          description: `${inspection.inspection_type} inspection was scheduled ${Math.abs(daysUntilInspection)} day${Math.abs(daysUntilInspection) !== 1 ? 's' : ''} ago. Reschedule or mark as completed.`,
          priority: 'high',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'inspection',
          related_to_type: 'property',
          related_to_id: inspection.id,
        });
      }
    }

    if (inspection.status === 'completed' && inspection.issues_found && inspection.issues_found.length > 0) {
      addTask({
        title: `Address Inspection Issues`,
        description: `${inspection.inspection_type} inspection found ${inspection.issues_found.length} issue${inspection.issues_found.length !== 1 ? 's' : ''}. Create maintenance requests for resolution.`,
        priority: 'high',
        status: 'pending',
        due_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'maintenance',
        related_to_type: 'property',
        related_to_id: inspection.id,
      });
    }
  });

  expenses.forEach(expense => {
    if (expense.status === 'pending') {
      const expenseDate = new Date(expense.expense_date);
      const daysPending = Math.ceil((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPending >= 7) {
        addTask({
          title: `Approve/Pay Expense`,
          description: `Expense: ${expense.description} - ${expense.amount} ${expense.currency}. Pending for ${daysPending} days.`,
          priority: 'medium',
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          category: 'payment',
          related_to_type: 'payment',
          related_to_id: expense.id,
        });
      }
    }
  });

  properties.forEach(property => {
    const propertyUnits = units.filter(u => u.property_id === property.id);
    const availableUnits = propertyUnits.filter(u => u.status === 'available');

    if (availableUnits.length > 0) {
      const hasMarketingTask = existingTodos.some(
        t =>
          t.related_to_id === property.id &&
          t.title.includes('Market') &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
      );

      if (!hasMarketingTask && availableUnits.length >= 2) {
        addTask({
          title: `Market Available Units - ${property.name}`,
          description: `${availableUnits.length} unit${availableUnits.length !== 1 ? 's' : ''} available at ${property.name}. Review marketing strategy.`,
          priority: 'medium',
          status: 'pending',
          due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: 'other',
          related_to_type: 'property',
          related_to_id: property.id,
        });
      }
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    tasks: newTasks,
    completedTaskIds: [],
    summary: {
      generated: newTasks.length,
      completed: 0,
      categories,
    },
  };
};

export const detectCompletedTasks = (
  todos: Todo[],
  leases: Lease[],
  payments: Payment[],
  maintenanceRequests: MaintenanceRequest[],
  invoices: Invoice[],
  businessDocuments: BusinessDocument[],
  tenantApplications: TenantApplication[],
  propertyInspections: PropertyInspection[],
  expenses: Expense[]
): string[] => {
  const completedTaskIds: string[] = [];

  todos.forEach(todo => {
    if (todo.status === 'completed' || todo.status === 'cancelled') {
      return;
    }

    let shouldComplete = false;

    if (todo.related_to_type === 'payment' && todo.related_to_id) {
      const payment = payments.find(p => p.id === todo.related_to_id);
      const invoice = invoices.find(i => i.id === todo.related_to_id);

      if (payment && payment.status === 'paid' && todo.title.includes('Overdue')) {
        shouldComplete = true;
      }

      if (invoice && invoice.status === 'paid' && todo.title.includes('Overdue')) {
        shouldComplete = true;
      }

      if (payment && payment.status === 'paid' && todo.title.includes('Reminder')) {
        shouldComplete = true;
      }

      const expense = expenses.find(e => e.id === todo.related_to_id);
      if (expense && (expense.status === 'paid' || expense.status === 'approved') && todo.title.includes('Approve')) {
        shouldComplete = true;
      }
    }

    if (todo.related_to_type === 'maintenance' && todo.related_to_id) {
      const maintenance = maintenanceRequests.find(m => m.id === todo.related_to_id);

      if (maintenance) {
        if (maintenance.status === 'resolved' && todo.title.includes('Address')) {
          shouldComplete = true;
        }

        if (maintenance.status === 'in_progress' && todo.title.includes('Follow Up: Pending')) {
          shouldComplete = true;
        }

        if (maintenance.related_expense_id && todo.title.includes('Record Expense')) {
          shouldComplete = true;
        }
      }
    }

    if (todo.related_to_type === 'lease' && todo.related_to_id) {
      const lease = leases.find(l => l.id === todo.related_to_id);

      if (lease) {
        if (lease.signed_agreement && todo.title.includes('Complete Draft Lease')) {
          shouldComplete = true;
        }

        if (lease.renewal_offer && todo.title.includes('Prepare Lease Renewal Offer')) {
          shouldComplete = true;
        }

        if (lease.status === 'renewed' && todo.title.includes('Renewal')) {
          shouldComplete = true;
        }
      }
    }

    if (todo.related_to_type === 'tenant_renter' && todo.related_to_id) {
      const application = tenantApplications.find(a => a.id === todo.related_to_id);

      if (application) {
        if ((application.status === 'approved' || application.status === 'rejected') && todo.title.includes('Review')) {
          shouldComplete = true;
        }

        if (application.tenant_renter_id && todo.title.includes('Create Tenant Profile')) {
          shouldComplete = true;
        }
      }
    }

    if (todo.related_to_type === 'property' && todo.related_to_id) {
      const inspection = propertyInspections.find(i => i.id === todo.related_to_id);

      if (inspection) {
        if (inspection.status === 'completed' && todo.title.includes('Property Inspection')) {
          shouldComplete = true;
        }

        if (inspection.status === 'rescheduled' && todo.title.includes('Missed Inspection')) {
          shouldComplete = true;
        }
      }

      const document = businessDocuments.find(d => d.id === todo.related_to_id);
      if (document && document.expiry_date) {
        const expiryDate = new Date(document.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry > 60 && todo.title.includes('Document Expiring')) {
          shouldComplete = true;
        }
      }
    }

    if (shouldComplete) {
      completedTaskIds.push(todo.id);
    }
  });

  return completedTaskIds;
};

export const runTaskAutomation = (
  leases: Lease[],
  payments: Payment[],
  maintenanceRequests: MaintenanceRequest[],
  invoices: Invoice[],
  businessDocuments: BusinessDocument[],
  tenantApplications: TenantApplication[],
  propertyInspections: PropertyInspection[],
  expenses: Expense[],
  properties: Property[],
  units: Unit[],
  existingTodos: Todo[],
  tenantId: string
): TaskGenerationResult => {
  console.log('[TASK AUTOMATION] Running automatic task generation and completion detection...');

  const completedTaskIds = detectCompletedTasks(
    existingTodos,
    leases,
    payments,
    maintenanceRequests,
    invoices,
    businessDocuments,
    tenantApplications,
    propertyInspections,
    expenses
  );

  const result = generateAutomaticTasks(
    leases,
    payments,
    maintenanceRequests,
    invoices,
    businessDocuments,
    tenantApplications,
    propertyInspections,
    expenses,
    properties,
    units,
    existingTodos,
    tenantId
  );

  result.completedTaskIds = completedTaskIds;
  result.summary.completed = completedTaskIds.length;

  console.log(`[TASK AUTOMATION] Generated ${result.summary.generated} new tasks`);
  console.log(`[TASK AUTOMATION] Detected ${result.summary.completed} completed tasks`);
  console.log('[TASK AUTOMATION] Task categories:', result.summary.categories);

  return result;
};
