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

export const shouldTriggerAutomation = (
  automationType: 'payment_schedule' | 'lease_renewal_reminder' | 'move_out_reminder' | 'unit_availability',
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
    
    default:
      return false;
  }
};

export const getAutomationSuggestions = (leases: Lease[], existingPayments: Payment[], existingTodos: Todo[]) => {
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

  return suggestions;
};
