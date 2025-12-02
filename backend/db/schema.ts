export interface DatabaseSchema {
  properties: Property[];
  units: Unit[];
  tenant_renters: TenantRenter[];
  leases: Lease[];
  payments: Payment[];
  maintenance_requests: MaintenanceRequest[];
  notifications: Notification[];
  move_in_checklists: MoveInChecklist[];
  property_items: PropertyItem[];
  maintenance_schedules: MaintenanceSchedule[];
  todos: Todo[];
  inventory_history: InventoryHistory[];
  invoices: Invoice[];
  business_documents: BusinessDocument[];
  tenant_applications: TenantApplication[];
  tenant_onboardings: TenantOnboarding[];
  property_inspections: PropertyInspection[];
  expenses: Expense[];
  staff_users: User[];
}

export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  city: string;
  island: string;
  postal_code: string;
  country: string;
  property_type: string;
  total_units: number;
  description?: string;
  images?: string[];
  parking_spots?: any[];
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Unit {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  rent_amount: number;
  deposit_amount?: number;
  status: string;
  description?: string;
  amenities?: string[];
  assigned_parking?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
  version: number;
}

export interface TenantRenter {
  id: string;
  tenant_id: string;
  type: string;
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
  version: number;
}

export interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  tenant_renter_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  payment_due_day: number;
  status: string;
  terms?: string;
  signed_date?: string;
  pdf_generated_uri?: string;
  pdf_generated_at?: string;
  signed_agreement?: any;
  move_in_checklist_id?: string;
  complete_agreement_uri?: string;
  complete_agreement_generated_at?: string;
  renewed_from_lease_id?: string;
  renewal_offer?: any;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Payment {
  id: string;
  tenant_id: string;
  lease_id: string;
  tenant_renter_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  due_date: string;
  status: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  late_fee?: number;
  payment_proof?: any;
  receipt_id?: string;
  receipt_number?: string;
  receipt_generated_at?: string;
  receipt_pdf_uri?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MaintenanceRequest {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  tenant_renter_id?: string;
  assigned_to?: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category?: string;
  reported_date: string;
  scheduled_date?: string;
  completed_date?: string;
  cost?: number;
  images?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Notification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  recipient_ids?: string[];
  is_announcement: boolean;
  created_by: string;
  created_at: string;
  read_by?: string[];
  version: number;
}

export interface MoveInChecklist {
  id: string;
  tenant_id: string;
  tenant_renter_id: string;
  unit_id: string;
  lease_id?: string;
  items: any[];
  overall_condition: string;
  damage_images?: string[];
  completed: boolean;
  completed_date?: string;
  tenant_renter_signature?: string;
  owner_signature?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface PropertyItem {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
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
  version: number;
}

export interface MaintenanceSchedule {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  asset_name: string;
  asset_type: string;
  task_description: string;
  frequency: string;
  last_service_date?: string;
  next_service_date: string;
  assigned_to?: string;
  service_provider?: string;
  estimated_cost?: number;
  priority: string;
  is_active: boolean;
  reminder_days_before?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Todo {
  id: string;
  tenant_id: string;
  user_id?: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_date?: string;
  category?: string;
  related_to_type?: string;
  related_to_id?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface InventoryHistory {
  id: string;
  tenant_id: string;
  property_item_id: string;
  property_id: string;
  unit_id?: string;
  tenant_renter_id?: string;
  lease_id?: string;
  action: string;
  reason: string;
  previous_condition?: string;
  new_condition?: string;
  cost?: number;
  paid_by?: string;
  deducted_from_deposit?: boolean;
  quantity_before?: number;
  quantity_after?: number;
  notes?: string;
  images?: string[];
  performed_by?: string;
  performed_at: string;
  created_at: string;
  version: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  tenant_renter_id: string;
  lease_id: string;
  property_id: string;
  unit_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  currency: string;
  line_items: any[];
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  late_fee_amount?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  payment_id?: string;
  sent_at?: string;
  paid_at?: string;
  pdf_uri?: string;
  auto_generated: boolean;
  recurring_period?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface BusinessDocument {
  id: string;
  tenant_id: string;
  property_id?: string;
  name: string;
  category: string;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  reminder_days_before?: number;
  file_uri?: string;
  file_type?: string;
  file_size?: number;
  notes?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface TenantApplication {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  applicant_type: string;
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
  employment_status?: string;
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
  tenant_renter_id?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  documents: any[];
  credit_check_result?: string;
  background_check_result?: string;
  reference_check_result?: string;
  credit_score?: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface TenantOnboarding {
  id: string;
  tenant_id: string;
  application_id: string;
  tenant_renter_id?: string;
  lease_id?: string;
  status: string;
  tasks: any[];
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
  version: number;
}

export interface PropertyInspection {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  tenant_renter_id?: string;
  lease_id?: string;
  inspection_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  completed_date?: string;
  inspector_id?: string;
  status: string;
  findings?: string;
  issues_found?: string[];
  recommendations?: string;
  images?: string[];
  report_pdf_uri?: string;
  next_inspection_date?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Expense {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  tenant_renter_id?: string;
  lease_id?: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  paid_by: string;
  status: string;
  payment_method?: string;
  reference_number?: string;
  vendor_name?: string;
  vendor_contact?: string;
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  next_occurrence?: string;
  receipts?: any[];
  reimbursement_status?: string;
  reimbursement_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
  role: string;
  is_active: boolean;
  permissions?: any;
  created_by?: string;
  created_at: string;
  last_login?: string;
  version: number;
}

export const inMemoryDB: DatabaseSchema = {
  properties: [],
  units: [],
  tenant_renters: [],
  leases: [],
  payments: [],
  maintenance_requests: [],
  notifications: [],
  move_in_checklists: [],
  property_items: [],
  maintenance_schedules: [],
  todos: [],
  inventory_history: [],
  invoices: [],
  business_documents: [],
  tenant_applications: [],
  tenant_onboardings: [],
  property_inspections: [],
  expenses: [],
  staff_users: [],
};
