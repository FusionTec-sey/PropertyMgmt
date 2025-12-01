export type TenantId = string;
export type UserId = string;
export type PropertyId = string;
export type UnitId = string;
export type TenantRenterId = string;
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
export type InventoryHistoryId = string;

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

export interface UserPermissions {
  properties: boolean;
  tenants: boolean;
  leases: boolean;
  payments: boolean;
  maintenance: boolean;
  todos: boolean;
  settings: boolean;
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
  permissions?: UserPermissions;
  created_by?: UserId;
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

export type PropertyType = 'unit' | 'building' | 'house' | 'office';

export interface ParkingSpot {
  id: string;
  spot_number: string;
  assigned_to_tenant_renter_id?: TenantRenterId;
  notes?: string;
}

export interface Property {
  id: PropertyId;
  tenant_id: TenantId;
  name: string;
  address: string;
  city: string;
  island: string;
  postal_code: string;
  country: string;
  property_type: PropertyType;
  total_units: number;
  description?: string;
  images?: string[];
  parking_spots?: ParkingSpot[];
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
  assigned_parking?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
}

export type TenantRenterType = 'individual' | 'business';

export interface TenantRenter {
  id: TenantRenterId;
  tenant_id: TenantId;
  type: TenantRenterType;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_number?: string;
  id_type?: string;
  address?: string;
  island?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface SignedDocument {
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size?: number;
  uploadedAt: string;
}

export interface LeaseRenewalOffer {
  offered_at: string;
  response_deadline: string;
  new_start_date: string;
  new_end_date: string;
  new_rent_amount: number;
  new_deposit_amount: number;
  new_payment_due_day: number;
  new_terms?: string;
  rent_increase: number;
  rent_increase_percentage: number;
  status: 'pending' | 'accepted' | 'declined';
  tenant_response_at?: string;
  tenant_response_notes?: string;
}

export interface Lease {
  id: LeaseId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id: UnitId;
  tenant_renter_id: TenantRenterId;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  payment_due_day: number;
  status: LeaseStatus;
  terms?: string;
  signed_date?: string;
  pdf_generated_uri?: string;
  pdf_generated_at?: string;
  signed_agreement?: SignedDocument;
  move_in_checklist_id?: MoveInChecklistId;
  complete_agreement_uri?: string;
  complete_agreement_generated_at?: string;
  renewed_from_lease_id?: LeaseId;
  renewal_offer?: LeaseRenewalOffer;
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
  tenant_renter_id: TenantRenterId;
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
  receipt_id?: ReceiptId;
  receipt_number?: string;
  receipt_generated_at?: string;
  receipt_pdf_uri?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: MaintenanceRequestId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  tenant_renter_id?: TenantRenterId;
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
  related_to_type?: 'property' | 'unit' | 'tenant_renter' | 'lease' | 'payment' | 'maintenance';
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
  total_tenant_renters: number;
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
  tenant_renter_id: TenantRenterId;
  unit_id: UnitId;
  lease_id?: LeaseId;
  items: MoveInChecklistItem[];
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor';
  damage_images?: string[];
  completed: boolean;
  completed_date?: string;
  tenant_renter_signature?: string;
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
  replacement_cost?: number;
  serial_number?: string;
  model_number?: string;
  images?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type InventoryChangeReason = 
  | 'initial_provision'
  | 'replacement_damage'
  | 'replacement_wear'
  | 'upgrade'
  | 'repair'
  | 'removal'
  | 'tenant_request'
  | 'maintenance'
  | 'other';

export type InventoryPaidBy = 'landlord' | 'tenant_deposit' | 'tenant_direct';

export interface InventoryHistory {
  id: InventoryHistoryId;
  tenant_id: TenantId;
  property_item_id: PropertyItemId;
  property_id: PropertyId;
  unit_id?: UnitId;
  tenant_renter_id?: TenantRenterId;
  lease_id?: LeaseId;
  action: 'added' | 'replaced' | 'repaired' | 'removed' | 'condition_changed';
  reason: InventoryChangeReason;
  previous_condition?: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  new_condition?: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  cost?: number;
  paid_by?: InventoryPaidBy;
  deducted_from_deposit?: boolean;
  quantity_before?: number;
  quantity_after?: number;
  notes?: string;
  images?: string[];
  performed_by?: UserId;
  performed_at: string;
  created_at: string;
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
  related_to_type?: 'property' | 'unit' | 'tenant_renter' | 'lease' | 'maintenance' | 'payment';
  related_to_id?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceId = string;
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type BusinessDocumentId = string;
export type DocumentCategory = 
  | 'business_license' 
  | 'insurance_policy' 
  | 'registration' 
  | 'tax_certificate' 
  | 'permit' 
  | 'contract' 
  | 'certification'
  | 'other';

export interface BusinessDocument {
  id: BusinessDocumentId;
  tenant_id: TenantId;
  property_id?: PropertyId;
  name: string;
  category: DocumentCategory;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  reminder_days_before?: number;
  file_uri?: string;
  file_type?: 'pdf' | 'image' | 'other';
  file_size?: number;
  notes?: string;
  uploaded_by: UserId;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
}

export interface Invoice {
  id: InvoiceId;
  tenant_id: TenantId;
  tenant_renter_id: TenantRenterId;
  lease_id: LeaseId;
  property_id: PropertyId;
  unit_id: UnitId;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: PaymentCurrency;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  late_fee_amount?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  payment_id?: PaymentId;
  sent_at?: string;
  paid_at?: string;
  pdf_uri?: string;
  auto_generated: boolean;
  recurring_period?: string;
  created_at: string;
  updated_at: string;
}

export type DateReminderType = 
  | 'lease_start'
  | 'lease_end'
  | 'lease_renewal'
  | 'document_expiry'
  | 'invoice_due'
  | 'payment_due'
  | 'maintenance_scheduled'
  | 'todo_due'
  | 'warranty_expiry'
  | 'custom';

export type ReminderId = string;

export interface DateReminder {
  id: ReminderId;
  tenant_id: TenantId;
  type: DateReminderType;
  title: string;
  description?: string;
  target_date: string;
  reminder_days_before: number[];
  related_to_type?: 'lease' | 'document' | 'invoice' | 'payment' | 'maintenance' | 'todo' | 'property_item' | 'business_document';
  related_to_id?: string;
  is_active: boolean;
  notification_ids?: string[];
  created_by: UserId;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  tenant_id: TenantId;
  enabled: boolean;
  lease_start_days: number[];
  lease_end_days: number[];
  lease_renewal_days: number[];
  document_expiry_days: number[];
  invoice_due_days: number[];
  payment_due_days: number[];
  maintenance_scheduled_days: number[];
  todo_due_days: number[];
  warranty_expiry_days: number[];
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpcomingEvent {
  id: string;
  type: DateReminderType;
  title: string;
  description?: string;
  date: string;
  days_until: number;
  related_to_type?: string;
  related_to_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export type TenantApplicationId = string;
export type TenantApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface ApplicationDocument {
  id: string;
  type: 'id_document' | 'proof_of_income' | 'reference_letter' | 'bank_statement' | 'other';
  name: string;
  uri: string;
  uploaded_at: string;
}

export interface TenantApplication {
  id: TenantApplicationId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  applicant_type: 'individual' | 'business';
  applicant_first_name?: string;
  applicant_last_name?: string;
  business_name?: string;
  applicant_email: string;
  applicant_phone: string;
  date_of_birth?: string;
  id_type?: string;
  id_number?: string;
  current_address?: string;
  island?: string;
  postal_code?: string;
  country?: string;
  employment_status?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  employer_name?: string;
  job_title?: string;
  employment_duration?: string;
  monthly_income?: number;
  previous_address?: string;
  previous_landlord_name?: string;
  previous_landlord_phone?: string;
  previous_landlord_email?: string;
  reason_for_moving?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  number_of_occupants?: number;
  occupant_names?: string[];
  has_pets?: boolean;
  pet_type?: string;
  pet_count?: number;
  pet_details?: string;
  desired_move_in_date?: string;
  lease_duration_preference?: string;
  additional_notes?: string;
  tenant_renter_id?: TenantRenterId;
  status: TenantApplicationStatus;
  reviewed_by?: UserId;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  documents: ApplicationDocument[];
  credit_check_result?: 'pass' | 'fail' | 'pending' | 'not_required';
  background_check_result?: 'pass' | 'fail' | 'pending' | 'not_required';
  reference_check_result?: 'pass' | 'fail' | 'pending' | 'not_required';
  credit_score?: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at?: string;
  required: boolean;
}

export interface TenantOnboarding {
  id: string;
  tenant_id: TenantId;
  application_id: TenantApplicationId;
  tenant_renter_id?: TenantRenterId;
  lease_id?: LeaseId;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  documents_signed: boolean;
  deposit_paid: boolean;
  keys_handed_over: boolean;
  orientation_completed: boolean;
  utilities_setup: boolean;
  insurance_verified: boolean;
  welcome_kit_provided: boolean;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type MoveOutChecklistId = string;

export interface MoveOutChecklistItem {
  id: string;
  name: string;
  category: 'general' | 'kitchen' | 'bathroom' | 'bedroom' | 'living' | 'other';
  checked: boolean;
  notes?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  damage_cost?: number;
  images?: string[];
}

export interface MoveOutChecklist {
  id: MoveOutChecklistId;
  tenant_id: TenantId;
  tenant_renter_id: TenantRenterId;
  unit_id: UnitId;
  lease_id: LeaseId;
  move_in_checklist_id?: MoveInChecklistId;
  items: MoveOutChecklistItem[];
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor';
  damage_images?: string[];
  total_damage_cost?: number;
  deposit_deductions?: number;
  deposit_return_amount?: number;
  completed: boolean;
  completed_date?: string;
  move_out_date?: string;
  tenant_renter_signature?: string;
  owner_signature?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type LeaseRenewalId = string;
export type LeaseRenewalStatus = 'pending' | 'offered' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface LeaseRenewal {
  id: LeaseRenewalId;
  tenant_id: TenantId;
  lease_id: LeaseId;
  property_id: PropertyId;
  unit_id: UnitId;
  tenant_renter_id: TenantRenterId;
  current_end_date: string;
  proposed_start_date: string;
  proposed_end_date: string;
  new_rent_amount: number;
  rent_increase?: number;
  rent_increase_percentage?: number;
  new_terms?: string;
  status: LeaseRenewalStatus;
  offered_at?: string;
  response_deadline?: string;
  responded_at?: string;
  tenant_response_notes?: string;
  created_at: string;
  updated_at: string;
}

export type PropertyInspectionId = string;
export type InspectionType = 'move_in' | 'move_out' | 'routine' | 'maintenance' | 'annual' | 'emergency';
export type InspectionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface PropertyInspection {
  id: PropertyInspectionId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  tenant_renter_id?: TenantRenterId;
  lease_id?: LeaseId;
  inspection_type: InspectionType;
  scheduled_date: string;
  scheduled_time?: string;
  completed_date?: string;
  inspector_id?: UserId;
  status: InspectionStatus;
  findings?: string;
  issues_found?: string[];
  recommendations?: string;
  images?: string[];
  report_pdf_uri?: string;
  next_inspection_date?: string;
  created_at: string;
  updated_at: string;
}

export type TenantMessageId = string;
export type ReceiptId = string;
export type ExpenseId = string;

export interface TenantMessage {
  id: TenantMessageId;
  tenant_id: TenantId;
  sender_type: 'landlord' | 'tenant';
  sender_id: UserId | TenantRenterId;
  recipient_type: 'landlord' | 'tenant';
  recipient_id: UserId | TenantRenterId;
  property_id?: PropertyId;
  unit_id?: UnitId;
  subject: string;
  message: string;
  attachments?: string[];
  is_read: boolean;
  read_at?: string;
  parent_message_id?: TenantMessageId;
  created_at: string;
}

export interface Receipt {
  id: ReceiptId;
  tenant_id: TenantId;
  payment_id: PaymentId;
  receipt_number: string;
  receipt_date: string;
  tenant_renter_id: TenantRenterId;
  payment_amount: number;
  currency: PaymentCurrency;
  payment_method?: string;
  reference_number?: string;
  lease_id: LeaseId;
  property_id: PropertyId;
  unit_id: UnitId;
  pdf_uri?: string;
  auto_generated: boolean;
  generated_at: string;
  created_at: string;
}

export type ExpenseCategory = 
  | 'maintenance'
  | 'repairs'
  | 'utilities'
  | 'insurance'
  | 'taxes'
  | 'legal'
  | 'marketing'
  | 'cleaning'
  | 'landscaping'
  | 'supplies'
  | 'tenant_reimbursement'
  | 'other';

export type ExpensePaidBy = 'landlord' | 'tenant' | 'deducted_from_deposit';
export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'reimbursed' | 'rejected';

export interface ExpenseAttachment {
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size?: number;
  uploadedAt: string;
}

export interface Expense {
  id: ExpenseId;
  tenant_id: TenantId;
  property_id: PropertyId;
  unit_id?: UnitId;
  tenant_renter_id?: TenantRenterId;
  lease_id?: LeaseId;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: PaymentCurrency;
  expense_date: string;
  paid_by: ExpensePaidBy;
  status: ExpenseStatus;
  payment_method?: 'cash' | 'cheque' | 'bank_transfer' | 'credit_card';
  reference_number?: string;
  vendor_name?: string;
  vendor_contact?: string;
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'monthly' | 'quarterly' | 'annually';
  next_occurrence?: string;
  receipts?: ExpenseAttachment[];
  reimbursement_status?: 'pending' | 'completed';
  reimbursement_date?: string;
  created_by: UserId;
  created_at: string;
  updated_at: string;
}
