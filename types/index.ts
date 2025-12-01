export type TenantId = string;
export type UserId = string;
export type PropertyId = string;
export type UnitId = string;
export type RenterId = string;
export type LeaseId = string;
export type PaymentId = string;
export type MaintenanceRequestId = string;
export type DocumentId = string;
export type NotificationId = string;
export type RoleId = string;
export type PermissionId = string;
export type SubscriptionId = string;
export type MoveInChecklistId = string;
export type PropertyItemId = string;
export type MaintenanceScheduleId = string;
export type TodoId = string;

export type UserRole = 'owner' | 'manager' | 'accountant' | 'maintenance' | 'viewer';

export type LeaseStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';
export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface Tenant {
  id: TenantId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  created_at: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
}

export interface TenantSettings {
  id: string;
  tenant_id: TenantId;
  currency: string;
  timezone: string;
  date_format: string;
  language: string;
  late_fee_enabled: boolean;
  late_fee_amount?: number;
  late_fee_days?: number;
  auto_reminders: boolean;
  reminder_days_before?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: UserId;
  tenant_id: TenantId;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Role {
  id: RoleId;
  tenant_id: TenantId;
  name: string;
  description?: string;
  permissions: Permission[];
  created_at: string;
}

export interface Permission {
  id: PermissionId;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface Property {
  id: PropertyId;
  tenant_id: TenantId;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  property_type: 'residential' | 'commercial' | 'mixed';
  total_units: number;
  description?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: UnitId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  rent_amount: number;
  deposit_amount?: number;
  status: UnitStatus;
  description?: string;
  amenities?: string[];
  created_at: string;
  updated_at: string;
}

export interface Renter {
  id: RenterId;
  tenant_id: TenantId;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_number?: string;
  id_type?: string;
  notes?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: LeaseId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id: UnitId;
  renter_id: RenterId;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  payment_due_day: number;
  status: LeaseStatus;
  terms?: string;
  signed_date?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentCurrency = 'SCR' | 'EUR' | 'USD';

export interface PaymentProof {
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size?: number;
  uploadedAt: string;
}

export interface Payment {
  id: PaymentId;
  tenant_id: TenantId;
  lease_id: LeaseId;
  renter_id: RenterId;
  amount: number;
  currency: PaymentCurrency;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  payment_method?: 'cash' | 'cheque' | 'bank_transfer';
  reference_number?: string;
  notes?: string;
  late_fee?: number;
  payment_proof?: PaymentProof;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: MaintenanceRequestId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  renter_id?: RenterId;
  assigned_to?: UserId;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: MaintenanceStatus;
  category?: string;
  reported_date: string;
  scheduled_date?: string;
  completed_date?: string;
  cost?: number;
  images?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: DocumentId;
  tenant_id: TenantId;
  name: string;
  type: string;
  category: 'lease' | 'id' | 'insurance' | 'inspection' | 'receipt' | 'other';
  url: string;
  size?: number;
  related_to_type?: 'property' | 'unit' | 'renter' | 'lease' | 'payment' | 'maintenance';
  related_to_id?: string;
  uploaded_by: UserId;
  created_at: string;
}

export interface Notification {
  id: NotificationId;
  tenant_id: TenantId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  recipient_ids?: UserId[];
  is_announcement: boolean;
  created_by: UserId;
  created_at: string;
  read_by?: UserId[];
}

export interface Subscription {
  id: SubscriptionId;
  tenant_id: TenantId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: string;
  tenant_id: TenantId;
  subscription_id: SubscriptionId;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  payment_method?: string;
  invoice_url?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: TenantId;
  user_id: UserId;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  available_units: number;
  total_renters: number;
  active_leases: number;
  pending_payments: number;
  overdue_payments: number;
  total_revenue_month: number;
  open_maintenance: number;
}

export interface MoveInChecklistItem {
  id: string;
  name: string;
  category: 'general' | 'kitchen' | 'bathroom' | 'bedroom' | 'living' | 'other';
  checked: boolean;
  notes?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  images?: string[];
}

export interface MoveInChecklist {
  id: MoveInChecklistId;
  tenant_id: TenantId;
  renter_id: RenterId;
  unit_id: UnitId;
  lease_id?: LeaseId;
  items: MoveInChecklistItem[];
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor';
  damage_images?: string[];
  completed: boolean;
  completed_date?: string;
  renter_signature?: string;
  owner_signature?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyItem {
  id: PropertyItemId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  name: string;
  category: 'appliance' | 'furniture' | 'fixture' | 'accessory' | 'other';
  quantity: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  purchase_date?: string;
  warranty_expiry?: string;
  value?: number;
  serial_number?: string;
  model_number?: string;
  images?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type MaintenanceScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface MaintenanceSchedule {
  id: MaintenanceScheduleId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  asset_name: string;
  asset_type: 'hvac' | 'plumbing' | 'electrical' | 'appliance' | 'structure' | 'other';
  task_description: string;
  frequency: MaintenanceScheduleFrequency;
  last_service_date?: string;
  next_service_date: string;
  assigned_to?: UserId;
  service_provider?: string;
  estimated_cost?: number;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  reminder_days_before?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Todo {
  id: TodoId;
  tenant_id: TenantId;
  user_id?: UserId;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  due_date?: string;
  completed_date?: string;
  category?: 'general' | 'maintenance' | 'lease' | 'payment' | 'inspection' | 'other';
  related_to_type?: 'property' | 'unit' | 'renter' | 'lease' | 'maintenance' | 'payment';
  related_to_id?: string;
  created_at: string;
  updated_at: string;
}
