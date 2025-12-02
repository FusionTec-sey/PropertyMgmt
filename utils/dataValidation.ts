import type {
  Property, Unit, TenantRenter, Lease, Payment,
  MaintenanceRequest,
  Todo, Invoice,
  Expense, User, Tenant
} from '@/types';

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  return phone.length >= 7 && /^[0-9+\-\s()]+$/.test(phone);
};

const isValidDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount >= 0;
};

export const validateProperty = (property: Property): ValidationResult => {
  const errors: string[] = [];

  if (!property.id) errors.push('Property ID is required');
  if (!property.tenant_id) errors.push('Tenant ID is required');
  if (!property.name || property.name.trim().length === 0) errors.push('Property name is required');
  if (!property.address || property.address.trim().length === 0) errors.push('Address is required');
  if (!property.city || property.city.trim().length === 0) errors.push('City is required');
  if (!property.island || property.island.trim().length === 0) errors.push('Island is required');
  if (!property.country || property.country.trim().length === 0) errors.push('Country is required');
  if (!['unit', 'building', 'house', 'office'].includes(property.property_type)) {
    errors.push('Invalid property type');
  }
  if (typeof property.total_units !== 'number' || property.total_units < 0) {
    errors.push('Total units must be a non-negative number');
  }
  if (property.created_at && !isValidDate(property.created_at)) {
    errors.push('Invalid created_at date');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUnit = (unit: Unit): ValidationResult => {
  const errors: string[] = [];

  if (!unit.id) errors.push('Unit ID is required');
  if (!unit.tenant_id) errors.push('Tenant ID is required');
  if (!unit.property_id) errors.push('Property ID is required');
  if (!unit.unit_number || unit.unit_number.trim().length === 0) {
    errors.push('Unit number is required');
  }
  if (!isValidAmount(unit.rent_amount)) {
    errors.push('Rent amount must be a valid positive number');
  }
  if (!['available', 'occupied', 'maintenance', 'reserved'].includes(unit.status)) {
    errors.push('Invalid unit status');
  }
  if (unit.created_at && !isValidDate(unit.created_at)) {
    errors.push('Invalid created_at date');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateTenantRenter = (tenantRenter: TenantRenter): ValidationResult => {
  const errors: string[] = [];

  if (!tenantRenter.id) errors.push('TenantRenter ID is required');
  if (!tenantRenter.tenant_id) errors.push('Tenant ID is required');
  if (!['individual', 'business'].includes(tenantRenter.type)) {
    errors.push('Invalid tenant renter type');
  }
  
  if (tenantRenter.type === 'individual') {
    if (!tenantRenter.first_name || tenantRenter.first_name.trim().length === 0) {
      errors.push('First name is required for individual');
    }
    if (!tenantRenter.last_name || tenantRenter.last_name.trim().length === 0) {
      errors.push('Last name is required for individual');
    }
  } else if (tenantRenter.type === 'business') {
    if (!tenantRenter.business_name || tenantRenter.business_name.trim().length === 0) {
      errors.push('Business name is required for business');
    }
  }

  if (!tenantRenter.email || !isValidEmail(tenantRenter.email)) {
    errors.push('Valid email is required');
  }
  if (!tenantRenter.phone || !isValidPhone(tenantRenter.phone)) {
    errors.push('Valid phone number is required');
  }
  if (tenantRenter.created_at && !isValidDate(tenantRenter.created_at)) {
    errors.push('Invalid created_at date');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateLease = (lease: Lease): ValidationResult => {
  const errors: string[] = [];

  if (!lease.id) errors.push('Lease ID is required');
  if (!lease.tenant_id) errors.push('Tenant ID is required');
  if (!lease.property_id) errors.push('Property ID is required');
  if (!lease.unit_id) errors.push('Unit ID is required');
  if (!lease.tenant_renter_id) errors.push('Tenant Renter ID is required');
  if (!lease.start_date || !isValidDate(lease.start_date)) {
    errors.push('Valid start date is required');
  }
  if (!lease.end_date || !isValidDate(lease.end_date)) {
    errors.push('Valid end date is required');
  }
  if (lease.start_date && lease.end_date && new Date(lease.start_date) >= new Date(lease.end_date)) {
    errors.push('End date must be after start date');
  }
  if (!isValidAmount(lease.rent_amount)) {
    errors.push('Rent amount must be a valid positive number');
  }
  if (!isValidAmount(lease.deposit_amount)) {
    errors.push('Deposit amount must be a valid positive number');
  }
  if (!['draft', 'active', 'expired', 'terminated', 'renewed'].includes(lease.status)) {
    errors.push('Invalid lease status');
  }
  if (typeof lease.payment_due_day !== 'number' || lease.payment_due_day < 1 || lease.payment_due_day > 31) {
    errors.push('Payment due day must be between 1 and 31');
  }

  return { isValid: errors.length === 0, errors };
};

export const validatePayment = (payment: Payment): ValidationResult => {
  const errors: string[] = [];

  if (!payment.id) errors.push('Payment ID is required');
  if (!payment.tenant_id) errors.push('Tenant ID is required');
  if (!payment.lease_id) errors.push('Lease ID is required');
  if (!payment.tenant_renter_id) errors.push('Tenant Renter ID is required');
  if (!isValidAmount(payment.amount)) {
    errors.push('Amount must be a valid positive number');
  }
  if (!['SCR', 'EUR', 'USD'].includes(payment.currency)) {
    errors.push('Invalid currency');
  }
  if (!payment.payment_date || !isValidDate(payment.payment_date)) {
    errors.push('Valid payment date is required');
  }
  if (!payment.due_date || !isValidDate(payment.due_date)) {
    errors.push('Valid due date is required');
  }
  if (!['pending', 'paid', 'overdue', 'partial', 'cancelled'].includes(payment.status)) {
    errors.push('Invalid payment status');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateMaintenanceRequest = (request: MaintenanceRequest): ValidationResult => {
  const errors: string[] = [];

  if (!request.id) errors.push('Maintenance Request ID is required');
  if (!request.tenant_id) errors.push('Tenant ID is required');
  if (!request.property_id) errors.push('Property ID is required');
  if (!request.title || request.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!request.description || request.description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (!['low', 'medium', 'high', 'urgent'].includes(request.priority)) {
    errors.push('Invalid priority');
  }
  if (!['open', 'in_progress', 'resolved', 'cancelled'].includes(request.status)) {
    errors.push('Invalid status');
  }
  if (!request.reported_date || !isValidDate(request.reported_date)) {
    errors.push('Valid reported date is required');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateInvoice = (invoice: Invoice): ValidationResult => {
  const errors: string[] = [];

  if (!invoice.id) errors.push('Invoice ID is required');
  if (!invoice.tenant_id) errors.push('Tenant ID is required');
  if (!invoice.tenant_renter_id) errors.push('Tenant Renter ID is required');
  if (!invoice.lease_id) errors.push('Lease ID is required');
  if (!invoice.invoice_number || invoice.invoice_number.trim().length === 0) {
    errors.push('Invoice number is required');
  }
  if (!invoice.invoice_date || !isValidDate(invoice.invoice_date)) {
    errors.push('Valid invoice date is required');
  }
  if (!invoice.due_date || !isValidDate(invoice.due_date)) {
    errors.push('Valid due date is required');
  }
  if (!['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(invoice.status)) {
    errors.push('Invalid invoice status');
  }
  if (!isValidAmount(invoice.total_amount)) {
    errors.push('Total amount must be a valid positive number');
  }
  if (!Array.isArray(invoice.line_items) || invoice.line_items.length === 0) {
    errors.push('At least one line item is required');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateExpense = (expense: Expense): ValidationResult => {
  const errors: string[] = [];

  if (!expense.id) errors.push('Expense ID is required');
  if (!expense.tenant_id) errors.push('Tenant ID is required');
  if (!expense.property_id) errors.push('Property ID is required');
  if (!expense.description || expense.description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (!isValidAmount(expense.amount)) {
    errors.push('Amount must be a valid positive number');
  }
  if (!['SCR', 'EUR', 'USD'].includes(expense.currency)) {
    errors.push('Invalid currency');
  }
  if (!expense.expense_date || !isValidDate(expense.expense_date)) {
    errors.push('Valid expense date is required');
  }
  if (!['landlord', 'tenant', 'deducted_from_deposit'].includes(expense.paid_by)) {
    errors.push('Invalid paid_by value');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateTodo = (todo: Todo): ValidationResult => {
  const errors: string[] = [];

  if (!todo.id) errors.push('Todo ID is required');
  if (!todo.tenant_id) errors.push('Tenant ID is required');
  if (!todo.title || todo.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!['low', 'medium', 'high', 'urgent'].includes(todo.priority)) {
    errors.push('Invalid priority');
  }
  if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(todo.status)) {
    errors.push('Invalid status');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUser = (user: User): ValidationResult => {
  const errors: string[] = [];

  if (!user.id) errors.push('User ID is required');
  if (!user.tenant_id) errors.push('Tenant ID is required');
  if (!user.email || !isValidEmail(user.email)) {
    errors.push('Valid email is required');
  }
  if (!user.first_name || user.first_name.trim().length === 0) {
    errors.push('First name is required');
  }
  if (!user.last_name || user.last_name.trim().length === 0) {
    errors.push('Last name is required');
  }
  if (!['owner', 'manager', 'accountant', 'maintenance', 'viewer'].includes(user.role)) {
    errors.push('Invalid role');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateTenant = (tenant: Tenant): ValidationResult => {
  const errors: string[] = [];

  if (!tenant.id) errors.push('Tenant ID is required');
  if (!tenant.name || tenant.name.trim().length === 0) {
    errors.push('Name is required');
  }
  if (!tenant.email || !isValidEmail(tenant.email)) {
    errors.push('Valid email is required');
  }
  if (!['starter', 'professional', 'enterprise'].includes(tenant.subscription_plan)) {
    errors.push('Invalid subscription plan');
  }
  if (!['active', 'cancelled', 'past_due', 'trialing'].includes(tenant.subscription_status)) {
    errors.push('Invalid subscription status');
  }

  return { isValid: errors.length === 0, errors };
};

type ValidatableEntity =
  | Property
  | Unit
  | TenantRenter
  | Lease
  | Payment
  | MaintenanceRequest
  | Invoice
  | Expense
  | Todo
  | User
  | Tenant;

export const validateData = (key: string, data: ValidatableEntity | ValidatableEntity[]): ValidationResult => {
  const errors: string[] = [];

  try {
    if (data === null || data === undefined) {
      return { isValid: false, errors: ['Data cannot be null or undefined'] };
    }

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const result = validateSingleItem(key, item);
        if (!result.isValid) {
          errors.push(`Item ${index}: ${result.errors.join(', ')}`);
        }
      });
    } else {
      const result = validateSingleItem(key, data);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error(`[VALIDATION] Error validating ${key}:`, error);
    return { isValid: false, errors: [`Validation error: ${error}`] };
  }
};

const validateSingleItem = (key: string, item: ValidatableEntity): ValidationResult => {
  switch (key) {
    case '@app/properties':
      return validateProperty(item as Property);
    case '@app/units':
      return validateUnit(item as Unit);
    case '@app/tenant_renters':
      return validateTenantRenter(item as TenantRenter);
    case '@app/leases':
      return validateLease(item as Lease);
    case '@app/payments':
      return validatePayment(item as Payment);
    case '@app/maintenance':
      return validateMaintenanceRequest(item as MaintenanceRequest);
    case '@app/invoices':
      return validateInvoice(item as Invoice);
    case '@app/expenses':
      return validateExpense(item as Expense);
    case '@app/todos':
      return validateTodo(item as Todo);
    case '@app/staff_users':
      return validateUser(item as User);
    case '@app/tenants':
      return validateTenant(item as Tenant);
    case '@app/current_tenant':
      return validateTenant(item as Tenant);
    case '@app/current_user':
      return validateUser(item as User);
    default:
      return { isValid: true, errors: [] };
  }
};
