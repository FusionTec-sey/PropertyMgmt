import { Lease, Payment, PaymentCurrency, Todo } from '@/types';

export const generateMonthlyPayments = (
  lease: Lease,
  tenantId: string
): Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>[] => {
  const payments: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>[] = [];
  const startDate = new Date(lease.start_date);
  const endDate = new Date(lease.end_date);
  
  let currentDate = new Date(startDate);
  currentDate.setDate(lease.payment_due_day);
  
  if (currentDate < startDate) {
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  while (currentDate <= endDate) {
    payments.push({
      lease_id: lease.id,
      tenant_renter_id: lease.tenant_renter_id,
      amount: lease.rent_amount,
      currency: 'SCR' as PaymentCurrency,
      payment_date: '',
      due_date: currentDate.toISOString().split('T')[0],
      status: 'pending',
      notes: 'Auto-generated from lease',
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return payments;
};

export const generateLeaseRenewalReminder = (
  lease: Lease,
  tenantId: string,
  daysBeforeExpiry: number = 60
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  const endDate = new Date(lease.end_date);
  const reminderDate = new Date(endDate);
  reminderDate.setDate(reminderDate.getDate() - daysBeforeExpiry);
  
  return {
    title: `Lease Renewal - Unit ${lease.unit_id}`,
    description: `Lease for tenant ${lease.tenant_renter_id} expires on ${endDate.toLocaleDateString()}. Contact tenant for renewal discussion.`,
    priority: 'high',
    status: 'pending',
    due_date: reminderDate.toISOString().split('T')[0],
    category: 'lease',
    related_to_type: 'lease',
    related_to_id: lease.id,
  };
};

export const generateMoveOutChecklistReminder = (
  lease: Lease,
  tenantId: string
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  const endDate = new Date(lease.end_date);
  const reminderDate = new Date(endDate);
  reminderDate.setDate(reminderDate.getDate() - 7);
  
  return {
    title: `Schedule Move-Out Inspection - Unit ${lease.unit_id}`,
    description: `Lease ends on ${endDate.toLocaleDateString()}. Schedule move-out inspection with tenant ${lease.tenant_renter_id}.`,
    priority: 'urgent',
    status: 'pending',
    due_date: reminderDate.toISOString().split('T')[0],
    category: 'inspection',
    related_to_type: 'lease',
    related_to_id: lease.id,
  };
};

export const generateMaintenanceScheduleTodos = (
  scheduleId: string,
  nextServiceDate: string,
  assetName: string,
  tenantId: string
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  return {
    title: `Maintenance Due: ${assetName}`,
    description: `Schedule maintenance service for ${assetName}`,
    priority: 'medium',
    status: 'pending',
    due_date: nextServiceDate,
    category: 'maintenance',
    related_to_type: 'maintenance',
    related_to_id: scheduleId,
  };
};

export const generateDocumentExpiryReminder = (
  documentId: string,
  documentName: string,
  expiryDate: string,
  tenantId: string,
  daysBeforeExpiry: number = 30
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  const expiry = new Date(expiryDate);
  const reminderDate = new Date(expiry);
  reminderDate.setDate(reminderDate.getDate() - daysBeforeExpiry);
  
  return {
    title: `Document Expiring: ${documentName}`,
    description: `${documentName} expires on ${expiry.toLocaleDateString()}. Renew or update document.`,
    priority: 'high',
    status: 'pending',
    due_date: reminderDate.toISOString().split('T')[0],
    category: 'other',
    related_to_type: 'property',
    related_to_id: documentId,
  };
};

export const generateOverduePaymentTodo = (
  payment: any,
  tenantId: string,
  daysOverdue: number
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  return {
    title: `Follow Up: Overdue Payment`,
    description: `Payment of ${payment.amount} ${payment.currency} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Contact tenant and arrange payment.`,
    priority: daysOverdue > 7 ? 'urgent' : 'high',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    category: 'payment',
    related_to_type: 'payment',
    related_to_id: payment.id,
  };
};

export const generateMaintenanceCompletionInspectionTodo = (
  maintenanceRequest: any,
  tenantId: string
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  const inspectionDate = new Date();
  inspectionDate.setDate(inspectionDate.getDate() + 2);
  
  return {
    title: `Post-Maintenance Inspection Required`,
    description: `Schedule inspection for completed maintenance: ${maintenanceRequest.title}. Verify work quality and tenant satisfaction.`,
    priority: maintenanceRequest.priority === 'urgent' || maintenanceRequest.priority === 'high' ? 'high' : 'medium',
    status: 'pending',
    due_date: inspectionDate.toISOString().split('T')[0],
    category: 'inspection',
    related_to_type: 'maintenance',
    related_to_id: maintenanceRequest.id,
  };
};

export const generatePreventiveMaintenanceTodo = (
  schedule: any,
  tenantId: string
): Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  const nextServiceDate = new Date(schedule.next_service_date);
  const reminderDate = new Date(nextServiceDate);
  reminderDate.setDate(reminderDate.getDate() - (schedule.reminder_days_before || 7));
  
  return {
    title: `Schedule Preventive Maintenance: ${schedule.asset_name}`,
    description: `${schedule.task_description}. Contact ${schedule.service_provider || 'service provider'} to schedule.`,
    priority: schedule.priority,
    status: 'pending',
    due_date: reminderDate.toISOString().split('T')[0],
    category: 'maintenance',
    related_to_type: 'maintenance',
    related_to_id: schedule.id,
  };
};

export const shouldTriggerAutomation = (
  automationType: 'payment_schedule' | 'lease_renewal_reminder' | 'move_out_reminder' | 'unit_availability' | 'overdue_payment_followup' | 'maintenance_inspection' | 'preventive_maintenance',
  data: any
): boolean => {
  switch (automationType) {
    case 'payment_schedule':
      return data.lease?.status === 'active' || data.lease?.status === 'draft';
    
    case 'lease_renewal_reminder':
      const daysUntilExpiry = Math.ceil(
        (new Date(data.lease?.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 60 && daysUntilExpiry > 0 && data.lease?.status === 'active';
    
    case 'move_out_reminder':
      const daysUntilMoveOut = Math.ceil(
        (new Date(data.lease?.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilMoveOut <= 7 && daysUntilMoveOut > 0 && data.lease?.status === 'active';
    
    case 'unit_availability':
      return data.lease?.status === 'terminated' || data.lease?.status === 'expired';
    
    case 'overdue_payment_followup':
      if (!data.payment || data.payment.status !== 'overdue') return false;
      const dueDate = new Date(data.payment.due_date);
      const daysOverdue = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue >= 3;
    
    case 'maintenance_inspection':
      return data.maintenance?.status === 'resolved' && 
             (data.maintenance?.priority === 'urgent' || data.maintenance?.priority === 'high');
    
    case 'preventive_maintenance':
      if (!data.schedule || !data.schedule.is_active) return false;
      const nextService = new Date(data.schedule.next_service_date);
      const daysUntilService = Math.ceil(
        (nextService.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const reminderDays = data.schedule.reminder_days_before || 7;
      return daysUntilService <= reminderDays && daysUntilService > 0;
    
    default:
      return false;
  }
};

export const linkPaymentToInvoice = (
  payment: any,
  invoices: any[]
): string | null => {
  const matchingInvoice = invoices.find(inv => 
    inv.lease_id === payment.lease_id &&
    inv.due_date === payment.due_date &&
    Math.abs(inv.total_amount - payment.amount) < 0.01 &&
    inv.status !== 'paid' &&
    inv.status !== 'cancelled'
  );
  return matchingInvoice?.id || null;
};

export const updateUnitStatusBasedOnLease = (
  lease: any
): 'available' | 'occupied' | 'maintenance' | 'reserved' | null => {
  switch (lease.status) {
    case 'active':
      return 'occupied';
    case 'terminated':
    case 'expired':
      return 'available';
    case 'draft':
      return 'reserved';
    default:
      return null;
  }
};

export const generateInvoiceFromPayment = (
  payment: any,
  lease: any,
  property: any,
  unit: any,
  tenantId: string
): Omit<any, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> => {
  const invoiceNumber = `INV-${Date.now()}`;
  const lineItems = [{
    id: `${Date.now()}-1`,
    description: `Rent for ${new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    quantity: 1,
    unit_price: payment.amount,
    amount: payment.amount,
  }];
  
  let totalAmount = payment.amount;
  if (payment.late_fee) {
    lineItems.push({
      id: `${Date.now()}-2`,
      description: 'Late Fee',
      quantity: 1,
      unit_price: payment.late_fee,
      amount: payment.late_fee,
    });
    totalAmount += payment.late_fee;
  }
  
  return {
    tenant_renter_id: payment.tenant_renter_id,
    lease_id: payment.lease_id,
    property_id: lease.property_id,
    unit_id: lease.unit_id,
    invoice_number: invoiceNumber,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: payment.due_date,
    status: payment.status === 'paid' ? 'paid' : payment.status === 'overdue' ? 'overdue' : 'sent',
    currency: payment.currency,
    line_items: lineItems,
    subtotal: payment.amount,
    late_fee_amount: payment.late_fee || 0,
    total_amount: totalAmount,
    amount_paid: payment.status === 'paid' ? totalAmount : 0,
    balance_due: payment.status === 'paid' ? 0 : totalAmount,
    payment_id: payment.id,
    auto_generated: true,
    recurring_period: 'monthly',
  };
};

export const shouldGenerateInvoiceFromPayment = (
  payment: any,
  invoices: any[]
): boolean => {
  const hasExistingInvoice = invoices.some(
    inv => inv.payment_id === payment.id || 
    (inv.lease_id === payment.lease_id && inv.due_date === payment.due_date)
  );
  return !hasExistingInvoice && payment.status !== 'draft';
};

export const generateMoveOutDepositDeductions = (
  moveOutChecklist: any,
  moveInChecklist: any,
  lease: any
): { totalDeductions: number; deductionItems: any[] } => {
  const deductionItems: any[] = [];
  let totalDeductions = 0;

  if (!moveOutChecklist.items || !moveInChecklist.items) {
    return { totalDeductions: 0, deductionItems: [] };
  }

  moveOutChecklist.items.forEach((moveOutItem: any) => {
    const moveInItem = moveInChecklist.items.find((item: any) => item.id === moveOutItem.id);
    if (!moveInItem) return;

    const conditionDowngrade = getConditionValue(moveInItem.condition) - getConditionValue(moveOutItem.condition);
    if (conditionDowngrade > 0 && moveOutItem.damage_cost) {
      deductionItems.push({
        item: moveOutItem.item,
        reason: `Condition changed from ${moveInItem.condition} to ${moveOutItem.condition}`,
        amount: moveOutItem.damage_cost,
        notes: moveOutItem.notes || '',
      });
      totalDeductions += moveOutItem.damage_cost;
    }
  });

  return { totalDeductions, deductionItems };
};

const getConditionValue = (condition: string): number => {
  const values: { [key: string]: number } = {
    excellent: 5,
    good: 4,
    fair: 3,
    poor: 2,
    damaged: 1,
  };
  return values[condition] || 0;
};

export const checkExpiringDocuments = (
  documents: any[],
  daysBeforeExpiry: number = 30
): any[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (daysBeforeExpiry * 24 * 60 * 60 * 1000));
  
  return documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const expiryDate = new Date(doc.expiry_date);
    return expiryDate >= today && expiryDate <= futureDate;
  });
};

export const getAutomationSuggestions = (leases: any[], existingPayments: any[], existingTodos: Todo[], maintenanceRequests?: any[], maintenanceSchedules?: any[], invoices?: any[]) => {
  const suggestions: {
    type: string;
    title: string;
    description: string;
    action: () => void;
    priority: 'high' | 'medium' | 'low';
  }[] = [];

  leases.forEach(lease => {
    const leasePayments = existingPayments.filter(p => p.lease_id === lease.id);
    if (leasePayments.length === 0 && (lease.status === 'active' || lease.status === 'draft')) {
      suggestions.push({
        type: 'payment_schedule',
        title: 'Generate Payment Schedule',
        description: `Create monthly payment schedule for lease ${lease.id}`,
        action: () => {},
        priority: 'high',
      });
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(lease.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 60 && lease.status === 'active') {
      const hasRenewalTodo = existingTodos.some(
        t => t.related_to_id === lease.id && t.category === 'lease' && t.title.includes('Renewal')
      );
      
      if (!hasRenewalTodo) {
        suggestions.push({
          type: 'lease_renewal',
          title: 'Create Lease Renewal Reminder',
          description: `Lease expires in ${daysUntilExpiry} days`,
          action: () => {},
          priority: 'high',
        });
      }
    }

    if (daysUntilExpiry > 0 && daysUntilExpiry <= 7 && lease.status === 'active') {
      const hasMoveOutTodo = existingTodos.some(
        t => t.related_to_id === lease.id && t.category === 'inspection' && t.title.includes('Move-Out')
      );
      
      if (!hasMoveOutTodo) {
        suggestions.push({
          type: 'move_out_checklist',
          title: 'Schedule Move-Out Inspection',
          description: `Lease ends in ${daysUntilExpiry} days`,
          action: () => {},
          priority: 'high',
        });
      }
    }
  });
  
  if (existingPayments && existingPayments.length > 0) {
    const overduePayments = existingPayments.filter(p => p.status === 'overdue');
    overduePayments.forEach(payment => {
      const dueDate = new Date(payment.due_date);
      const daysOverdue = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue >= 3) {
        const hasFollowupTodo = existingTodos.some(
          t => t.related_to_id === payment.id && t.category === 'payment' && t.title.includes('Overdue')
        );
        
        if (!hasFollowupTodo) {
          suggestions.push({
            type: 'overdue_payment_followup',
            title: 'Create Payment Follow-up Task',
            description: `Payment ${daysOverdue} days overdue - create follow-up task`,
            action: () => {},
            priority: daysOverdue > 7 ? 'high' : 'medium',
          });
        }
      }
    });
    
    if (invoices && invoices.length > 0) {
      const unmatchedPayments = existingPayments.filter(p => !p.invoice_id);
      const linkablePayments = unmatchedPayments.filter(p => {
        return invoices.some(inv => 
          inv.lease_id === p.lease_id &&
          inv.due_date === p.due_date &&
          !inv.payment_id
        );
      });
      
      if (linkablePayments.length > 0) {
        suggestions.push({
          type: 'link_payment_invoice',
          title: 'Link Payments to Invoices',
          description: `${linkablePayments.length} payment${linkablePayments.length > 1 ? 's' : ''} can be linked to invoice${linkablePayments.length > 1 ? 's' : ''}`,
          action: () => {},
          priority: 'medium',
        });
      }
    }
  }
  
  if (maintenanceRequests && maintenanceRequests.length > 0) {
    const recentlyCompleted = maintenanceRequests.filter(m => {
      if (m.status !== 'resolved' || !m.completed_date) return false;
      const completedDate = new Date(m.completed_date);
      const daysSinceCompleted = Math.ceil((new Date().getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCompleted <= 3 && (m.priority === 'urgent' || m.priority === 'high');
    });
    
    recentlyCompleted.forEach(maintenance => {
      const hasInspectionTodo = existingTodos.some(
        t => t.related_to_id === maintenance.id && t.category === 'inspection'
      );
      
      if (!hasInspectionTodo) {
        suggestions.push({
          type: 'maintenance_inspection',
          title: 'Schedule Post-Maintenance Inspection',
          description: `Completed ${maintenance.title} - schedule follow-up inspection`,
          action: () => {},
          priority: 'medium',
        });
      }
    });
  }
  
  if (maintenanceSchedules && maintenanceSchedules.length > 0) {
    const upcomingSchedules = maintenanceSchedules.filter(schedule => {
      if (!schedule.is_active) return false;
      const nextService = new Date(schedule.next_service_date);
      const daysUntilService = Math.ceil(
        (nextService.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const reminderDays = schedule.reminder_days_before || 7;
      return daysUntilService <= reminderDays && daysUntilService > 0;
    });
    
    upcomingSchedules.forEach(schedule => {
      const hasScheduleTodo = existingTodos.some(
        t => t.related_to_id === schedule.id && t.title.includes(schedule.asset_name)
      );
      
      if (!hasScheduleTodo) {
        suggestions.push({
          type: 'preventive_maintenance',
          title: 'Schedule Preventive Maintenance',
          description: `Upcoming: ${schedule.asset_name} - ${schedule.task_description}`,
          action: () => {},
          priority: schedule.priority === 'high' ? 'high' : 'medium',
        });
      }
    });
  }

  if (invoices && invoices.length > 0) {
    const paymentsWithoutInvoices = existingPayments.filter(p => 
      p.status !== 'draft' && !invoices.some(inv => inv.payment_id === p.id)
    );
    
    if (paymentsWithoutInvoices.length > 0) {
      suggestions.push({
        type: 'generate_invoices',
        title: 'Generate Missing Invoices',
        description: `${paymentsWithoutInvoices.length} payment${paymentsWithoutInvoices.length > 1 ? 's' : ''} without invoice${paymentsWithoutInvoices.length > 1 ? 's' : ''}`,
        action: () => {},
        priority: 'medium',
      });
    }
  }

  return suggestions;
};
