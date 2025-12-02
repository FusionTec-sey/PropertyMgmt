import { neon, neonConfig } from '@neondatabase/serverless';
import type { DatabaseSchema } from './schema';

neonConfig.fetchConnectionCache = true;

const getDatabaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    console.warn('DATABASE_URL not set, using in-memory database');
    return '';
  }
  return url;
};

let sql: ReturnType<typeof neon> | null = null;

export const getPostgresClient = () => {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return null;
  }
  
  if (!sql) {
    sql = neon(dbUrl);
  }
  
  return sql;
};

export const initializeDatabase = async () => {
  const client = getPostgresClient();
  if (!client) {
    console.log('Using in-memory database');
    return false;
  }

  try {
    await client`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        island TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        property_type TEXT NOT NULL,
        total_units INTEGER NOT NULL,
        description TEXT,
        images JSONB,
        parking_spots JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_number TEXT NOT NULL,
        floor INTEGER,
        bedrooms INTEGER,
        bathrooms INTEGER,
        square_feet INTEGER,
        rent_amount NUMERIC NOT NULL,
        deposit_amount NUMERIC,
        status TEXT NOT NULL,
        description TEXT,
        amenities JSONB,
        assigned_parking JSONB,
        images JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS tenant_renters (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        type TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        business_name TEXT,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date_of_birth TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        id_number TEXT,
        id_type TEXT,
        address TEXT,
        island TEXT,
        postal_code TEXT,
        country TEXT,
        notes TEXT,
        avatar TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS leases (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        tenant_renter_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        rent_amount NUMERIC NOT NULL,
        deposit_amount NUMERIC NOT NULL,
        payment_due_day INTEGER NOT NULL,
        status TEXT NOT NULL,
        terms TEXT,
        signed_date TEXT,
        pdf_generated_uri TEXT,
        pdf_generated_at TEXT,
        signed_agreement JSONB,
        move_in_checklist_id TEXT,
        complete_agreement_uri TEXT,
        complete_agreement_generated_at TEXT,
        renewed_from_lease_id TEXT,
        renewal_offer JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        lease_id TEXT NOT NULL,
        tenant_renter_id TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT,
        reference_number TEXT,
        notes TEXT,
        late_fee NUMERIC,
        payment_proof JSONB,
        receipt_id TEXT,
        receipt_number TEXT,
        receipt_generated_at TEXT,
        receipt_pdf_uri TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        tenant_renter_id TEXT,
        assigned_to TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT,
        reported_date TEXT NOT NULL,
        scheduled_date TEXT,
        completed_date TEXT,
        cost NUMERIC,
        images JSONB,
        notes TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        recipient_ids JSONB,
        is_announcement BOOLEAN NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        read_by JSONB,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS move_in_checklists (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        tenant_renter_id TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        lease_id TEXT,
        items JSONB NOT NULL,
        overall_condition TEXT NOT NULL,
        damage_images JSONB,
        completed BOOLEAN NOT NULL,
        completed_date TEXT,
        tenant_renter_signature TEXT,
        owner_signature TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS property_items (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        condition TEXT NOT NULL,
        purchase_date TEXT,
        warranty_expiry TEXT,
        value NUMERIC,
        replacement_cost NUMERIC,
        serial_number TEXT,
        model_number TEXT,
        images JSONB,
        notes TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        asset_name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        task_description TEXT NOT NULL,
        frequency TEXT NOT NULL,
        last_service_date TEXT,
        next_service_date TEXT NOT NULL,
        assigned_to TEXT,
        service_provider TEXT,
        estimated_cost NUMERIC,
        priority TEXT NOT NULL,
        is_active BOOLEAN NOT NULL,
        reminder_days_before INTEGER,
        notes TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date TEXT,
        completed_date TEXT,
        category TEXT,
        related_to_type TEXT,
        related_to_id TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS inventory_history (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_item_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        tenant_renter_id TEXT,
        lease_id TEXT,
        action TEXT NOT NULL,
        reason TEXT NOT NULL,
        previous_condition TEXT,
        new_condition TEXT,
        cost NUMERIC,
        paid_by TEXT,
        deducted_from_deposit BOOLEAN,
        quantity_before INTEGER,
        quantity_after INTEGER,
        notes TEXT,
        images JSONB,
        performed_by TEXT,
        performed_at TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        tenant_renter_id TEXT NOT NULL,
        lease_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        currency TEXT NOT NULL,
        line_items JSONB NOT NULL,
        subtotal NUMERIC NOT NULL,
        tax_amount NUMERIC,
        discount_amount NUMERIC,
        late_fee_amount NUMERIC,
        total_amount NUMERIC NOT NULL,
        amount_paid NUMERIC,
        balance_due NUMERIC,
        notes TEXT,
        payment_id TEXT,
        sent_at TEXT,
        paid_at TEXT,
        pdf_uri TEXT,
        auto_generated BOOLEAN NOT NULL,
        recurring_period TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS business_documents (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        document_number TEXT,
        issuing_authority TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        reminder_days_before INTEGER,
        file_uri TEXT,
        file_type TEXT,
        file_size INTEGER,
        notes TEXT,
        uploaded_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS tenant_applications (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        applicant_type TEXT NOT NULL,
        applicant_first_name TEXT,
        applicant_last_name TEXT,
        business_name TEXT,
        applicant_email TEXT NOT NULL,
        applicant_phone TEXT NOT NULL,
        date_of_birth TEXT,
        id_type TEXT,
        id_number TEXT,
        current_address TEXT,
        island TEXT,
        postal_code TEXT,
        country TEXT,
        employment_status TEXT,
        employer_name TEXT,
        job_title TEXT,
        employment_duration TEXT,
        monthly_income NUMERIC,
        previous_address TEXT,
        previous_landlord_name TEXT,
        previous_landlord_phone TEXT,
        previous_landlord_email TEXT,
        reason_for_moving TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relationship TEXT,
        number_of_occupants INTEGER,
        occupant_names JSONB,
        has_pets BOOLEAN,
        pet_type TEXT,
        pet_count INTEGER,
        pet_details TEXT,
        desired_move_in_date TEXT,
        lease_duration_preference TEXT,
        additional_notes TEXT,
        tenant_renter_id TEXT,
        status TEXT NOT NULL,
        reviewed_by TEXT,
        reviewed_at TEXT,
        review_notes TEXT,
        rejection_reason TEXT,
        documents JSONB NOT NULL,
        credit_check_result TEXT,
        background_check_result TEXT,
        reference_check_result TEXT,
        credit_score INTEGER,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS tenant_onboardings (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        tenant_renter_id TEXT,
        lease_id TEXT,
        status TEXT NOT NULL,
        tasks JSONB NOT NULL,
        documents_signed BOOLEAN NOT NULL,
        deposit_paid BOOLEAN NOT NULL,
        keys_handed_over BOOLEAN NOT NULL,
        orientation_completed BOOLEAN NOT NULL,
        utilities_setup BOOLEAN NOT NULL,
        insurance_verified BOOLEAN NOT NULL,
        welcome_kit_provided BOOLEAN NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS property_inspections (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        tenant_renter_id TEXT,
        lease_id TEXT,
        inspection_type TEXT NOT NULL,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT,
        completed_date TEXT,
        inspector_id TEXT,
        status TEXT NOT NULL,
        findings TEXT,
        issues_found JSONB,
        recommendations TEXT,
        images JSONB,
        report_pdf_uri TEXT,
        next_inspection_date TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit_id TEXT,
        tenant_renter_id TEXT,
        lease_id TEXT,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        paid_by TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT,
        reference_number TEXT,
        vendor_name TEXT,
        vendor_contact TEXT,
        notes TEXT,
        is_recurring BOOLEAN,
        recurring_frequency TEXT,
        next_occurrence TEXT,
        receipts JSONB,
        reimbursement_status TEXT,
        reimbursement_date TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS staff_users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        avatar TEXT,
        role TEXT NOT NULL,
        is_active BOOLEAN NOT NULL,
        permissions JSONB,
        created_by TEXT,
        created_at TIMESTAMP NOT NULL,
        last_login TEXT,
        version INTEGER NOT NULL DEFAULT 0
      )
    `;

    await client`CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON leases(unit_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON payments(lease_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON maintenance_requests(property_id)`;

    console.log('✅ PostgreSQL database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize PostgreSQL database:', error);
    return false;
  }
};

export class PostgresStore {
  private sql: ReturnType<typeof neon> | null;

  constructor() {
    this.sql = getPostgresClient();
  }

  async query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
    if (!this.sql) {
      throw new Error('PostgreSQL client not initialized');
    }
    return this.sql(strings, ...values) as Promise<T[]>;
  }

  isAvailable(): boolean {
    return this.sql !== null;
  }
}

export const postgresStore = new PostgresStore();
