import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { inMemoryDB } from '../../../../db/schema';
import { postgresStore } from '../../../../db/postgres';

const syncRoute = {
  getAllData: publicProcedure
    .input(z.object({ 
      tenantId: z.string(),
      lastSyncTime: z.string().optional()
    }))
    .query(async ({ input }) => {
      console.log(`[SYNC] Getting all data for tenant ${input.tenantId}`);
      
      if (postgresStore.isAvailable()) {
        try {
          const [properties, units, tenant_renters, leases, payments, maintenance_requests,
                 notifications, move_in_checklists, property_items, maintenance_schedules,
                 todos, inventory_history, invoices, business_documents, tenant_applications,
                 tenant_onboardings, property_inspections, expenses, staff_users] = await Promise.all([
            postgresStore.query`SELECT * FROM properties WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM units WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM tenant_renters WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM leases WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM payments WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM maintenance_requests WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM notifications WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM move_in_checklists WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM property_items WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM maintenance_schedules WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM todos WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM inventory_history WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM invoices WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM business_documents WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM tenant_applications WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM tenant_onboardings WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM property_inspections WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM expenses WHERE tenant_id = ${input.tenantId}`,
            postgresStore.query`SELECT * FROM staff_users WHERE tenant_id = ${input.tenantId}`,
          ]);

          return {
            properties, units, tenant_renters, leases, payments, maintenance_requests,
            notifications, move_in_checklists, property_items, maintenance_schedules,
            todos, inventory_history, invoices, business_documents, tenant_applications,
            tenant_onboardings, property_inspections, expenses, staff_users,
            syncTime: new Date().toISOString(),
          };
        } catch (error) {
          console.error('[SYNC] PostgreSQL error, falling back to in-memory:', error);
        }
      }

      const filterByTenant = <T extends { tenant_id: string }>(items: T[]) => 
        items.filter(item => item.tenant_id === input.tenantId);

      return {
        properties: filterByTenant(inMemoryDB.properties),
        units: filterByTenant(inMemoryDB.units),
        tenant_renters: filterByTenant(inMemoryDB.tenant_renters),
        leases: filterByTenant(inMemoryDB.leases),
        payments: filterByTenant(inMemoryDB.payments),
        maintenance_requests: filterByTenant(inMemoryDB.maintenance_requests),
        notifications: filterByTenant(inMemoryDB.notifications),
        move_in_checklists: filterByTenant(inMemoryDB.move_in_checklists),
        property_items: filterByTenant(inMemoryDB.property_items),
        maintenance_schedules: filterByTenant(inMemoryDB.maintenance_schedules),
        todos: filterByTenant(inMemoryDB.todos),
        inventory_history: filterByTenant(inMemoryDB.inventory_history),
        invoices: filterByTenant(inMemoryDB.invoices),
        business_documents: filterByTenant(inMemoryDB.business_documents),
        tenant_applications: filterByTenant(inMemoryDB.tenant_applications),
        tenant_onboardings: filterByTenant(inMemoryDB.tenant_onboardings),
        property_inspections: filterByTenant(inMemoryDB.property_inspections),
        expenses: filterByTenant(inMemoryDB.expenses),
        staff_users: filterByTenant(inMemoryDB.staff_users),
        syncTime: new Date().toISOString(),
      };
    }),

  pushChanges: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      changes: z.object({
        properties: z.array(z.any()).optional(),
        units: z.array(z.any()).optional(),
        tenant_renters: z.array(z.any()).optional(),
        leases: z.array(z.any()).optional(),
        payments: z.array(z.any()).optional(),
        maintenance_requests: z.array(z.any()).optional(),
        notifications: z.array(z.any()).optional(),
        move_in_checklists: z.array(z.any()).optional(),
        property_items: z.array(z.any()).optional(),
        maintenance_schedules: z.array(z.any()).optional(),
        todos: z.array(z.any()).optional(),
        inventory_history: z.array(z.any()).optional(),
        invoices: z.array(z.any()).optional(),
        business_documents: z.array(z.any()).optional(),
        tenant_applications: z.array(z.any()).optional(),
        tenant_onboardings: z.array(z.any()).optional(),
        property_inspections: z.array(z.any()).optional(),
        expenses: z.array(z.any()).optional(),
        staff_users: z.array(z.any()).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      console.log(`[SYNC] Pushing changes for tenant ${input.tenantId}`);

      if (postgresStore.isAvailable()) {
        try {
          const upsertToPostgres = async (table: string, items: any[] | undefined) => {
            if (!items || items.length === 0) return;

            console.log(`[SYNC_POSTGRES] Upserting ${items.length} items to ${table}`);

            for (const item of items) {
              try {
                if (table === 'properties') {
                  await postgresStore.query`
                    INSERT INTO properties (id, tenant_id, name, address, city, island, postal_code, country, property_type, total_units, description, images, parking_spots, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.name}, ${item.address}, ${item.city}, ${item.island}, ${item.postal_code}, ${item.country}, ${item.property_type}, ${item.total_units}, ${item.description || null}, ${JSON.stringify(item.images || [])}::jsonb, ${JSON.stringify(item.parking_spots || [])}::jsonb, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      tenant_id = EXCLUDED.tenant_id,
                      name = EXCLUDED.name,
                      address = EXCLUDED.address,
                      city = EXCLUDED.city,
                      island = EXCLUDED.island,
                      postal_code = EXCLUDED.postal_code,
                      country = EXCLUDED.country,
                      property_type = EXCLUDED.property_type,
                      total_units = EXCLUDED.total_units,
                      description = EXCLUDED.description,
                      images = EXCLUDED.images,
                      parking_spots = EXCLUDED.parking_spots,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'units') {
                  await postgresStore.query`
                    INSERT INTO units (id, tenant_id, property_id, unit_number, floor, bedrooms, bathrooms, square_feet, rent_amount, deposit_amount, status, description, amenities, assigned_parking, images, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_number}, ${item.floor || null}, ${item.bedrooms || null}, ${item.bathrooms || null}, ${item.square_feet || null}, ${item.rent_amount}, ${item.deposit_amount || null}, ${item.status}, ${item.description || null}, ${JSON.stringify(item.amenities || [])}::jsonb, ${JSON.stringify(item.assigned_parking || [])}::jsonb, ${JSON.stringify(item.images || [])}::jsonb, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      tenant_id = EXCLUDED.tenant_id,
                      property_id = EXCLUDED.property_id,
                      unit_number = EXCLUDED.unit_number,
                      floor = EXCLUDED.floor,
                      bedrooms = EXCLUDED.bedrooms,
                      bathrooms = EXCLUDED.bathrooms,
                      square_feet = EXCLUDED.square_feet,
                      rent_amount = EXCLUDED.rent_amount,
                      deposit_amount = EXCLUDED.deposit_amount,
                      status = EXCLUDED.status,
                      description = EXCLUDED.description,
                      amenities = EXCLUDED.amenities,
                      assigned_parking = EXCLUDED.assigned_parking,
                      images = EXCLUDED.images,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'tenant_renters') {
                  await postgresStore.query`
                    INSERT INTO tenant_renters (id, tenant_id, type, first_name, last_name, business_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, id_number, id_type, address, island, postal_code, country, notes, avatar, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.type}, ${item.first_name || null}, ${item.last_name || null}, ${item.business_name || null}, ${item.email}, ${item.phone}, ${item.date_of_birth || null}, ${item.emergency_contact_name || null}, ${item.emergency_contact_phone || null}, ${item.id_number || null}, ${item.id_type || null}, ${item.address || null}, ${item.island || null}, ${item.postal_code || null}, ${item.country || null}, ${item.notes || null}, ${item.avatar || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      type = EXCLUDED.type,
                      first_name = EXCLUDED.first_name,
                      last_name = EXCLUDED.last_name,
                      business_name = EXCLUDED.business_name,
                      email = EXCLUDED.email,
                      phone = EXCLUDED.phone,
                      date_of_birth = EXCLUDED.date_of_birth,
                      emergency_contact_name = EXCLUDED.emergency_contact_name,
                      emergency_contact_phone = EXCLUDED.emergency_contact_phone,
                      id_number = EXCLUDED.id_number,
                      id_type = EXCLUDED.id_type,
                      address = EXCLUDED.address,
                      island = EXCLUDED.island,
                      postal_code = EXCLUDED.postal_code,
                      country = EXCLUDED.country,
                      notes = EXCLUDED.notes,
                      avatar = EXCLUDED.avatar,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'leases') {
                  await postgresStore.query`
                    INSERT INTO leases (id, tenant_id, property_id, unit_id, tenant_renter_id, start_date, end_date, rent_amount, deposit_amount, payment_due_day, status, terms, signed_date, pdf_generated_uri, pdf_generated_at, signed_agreement, move_in_checklist_id, complete_agreement_uri, complete_agreement_generated_at, renewed_from_lease_id, renewal_offer, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id}, ${item.tenant_renter_id}, ${item.start_date}, ${item.end_date}, ${item.rent_amount}, ${item.deposit_amount}, ${item.payment_due_day}, ${item.status}, ${item.terms || null}, ${item.signed_date || null}, ${item.pdf_generated_uri || null}, ${item.pdf_generated_at || null}, ${JSON.stringify(item.signed_agreement || null)}::jsonb, ${item.move_in_checklist_id || null}, ${item.complete_agreement_uri || null}, ${item.complete_agreement_generated_at || null}, ${item.renewed_from_lease_id || null}, ${JSON.stringify(item.renewal_offer || null)}::jsonb, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      start_date = EXCLUDED.start_date,
                      end_date = EXCLUDED.end_date,
                      rent_amount = EXCLUDED.rent_amount,
                      deposit_amount = EXCLUDED.deposit_amount,
                      payment_due_day = EXCLUDED.payment_due_day,
                      status = EXCLUDED.status,
                      terms = EXCLUDED.terms,
                      signed_date = EXCLUDED.signed_date,
                      pdf_generated_uri = EXCLUDED.pdf_generated_uri,
                      pdf_generated_at = EXCLUDED.pdf_generated_at,
                      signed_agreement = EXCLUDED.signed_agreement,
                      move_in_checklist_id = EXCLUDED.move_in_checklist_id,
                      complete_agreement_uri = EXCLUDED.complete_agreement_uri,
                      complete_agreement_generated_at = EXCLUDED.complete_agreement_generated_at,
                      renewed_from_lease_id = EXCLUDED.renewed_from_lease_id,
                      renewal_offer = EXCLUDED.renewal_offer,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'payments') {
                  await postgresStore.query`
                    INSERT INTO payments (id, tenant_id, lease_id, tenant_renter_id, amount, currency, payment_date, due_date, status, payment_method, reference_number, notes, late_fee, payment_proof, receipt_id, receipt_number, receipt_generated_at, receipt_pdf_uri, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.lease_id}, ${item.tenant_renter_id}, ${item.amount}, ${item.currency}, ${item.payment_date}, ${item.due_date}, ${item.status}, ${item.payment_method || null}, ${item.reference_number || null}, ${item.notes || null}, ${item.late_fee || null}, ${JSON.stringify(item.payment_proof || null)}::jsonb, ${item.receipt_id || null}, ${item.receipt_number || null}, ${item.receipt_generated_at || null}, ${item.receipt_pdf_uri || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      lease_id = EXCLUDED.lease_id,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      amount = EXCLUDED.amount,
                      currency = EXCLUDED.currency,
                      payment_date = EXCLUDED.payment_date,
                      due_date = EXCLUDED.due_date,
                      status = EXCLUDED.status,
                      payment_method = EXCLUDED.payment_method,
                      reference_number = EXCLUDED.reference_number,
                      notes = EXCLUDED.notes,
                      late_fee = EXCLUDED.late_fee,
                      payment_proof = EXCLUDED.payment_proof,
                      receipt_id = EXCLUDED.receipt_id,
                      receipt_number = EXCLUDED.receipt_number,
                      receipt_generated_at = EXCLUDED.receipt_generated_at,
                      receipt_pdf_uri = EXCLUDED.receipt_pdf_uri,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'maintenance_requests') {
                  await postgresStore.query`
                    INSERT INTO maintenance_requests (id, tenant_id, property_id, unit_id, tenant_renter_id, assigned_to, title, description, priority, status, category, reported_date, scheduled_date, completed_date, cost, images, notes, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id || null}, ${item.tenant_renter_id || null}, ${item.assigned_to || null}, ${item.title}, ${item.description}, ${item.priority}, ${item.status}, ${item.category || null}, ${item.reported_date}, ${item.scheduled_date || null}, ${item.completed_date || null}, ${item.cost || null}, ${JSON.stringify(item.images || [])}::jsonb, ${item.notes || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      assigned_to = EXCLUDED.assigned_to,
                      title = EXCLUDED.title,
                      description = EXCLUDED.description,
                      priority = EXCLUDED.priority,
                      status = EXCLUDED.status,
                      category = EXCLUDED.category,
                      reported_date = EXCLUDED.reported_date,
                      scheduled_date = EXCLUDED.scheduled_date,
                      completed_date = EXCLUDED.completed_date,
                      cost = EXCLUDED.cost,
                      images = EXCLUDED.images,
                      notes = EXCLUDED.notes,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'todos') {
                  await postgresStore.query`
                    INSERT INTO todos (id, tenant_id, user_id, title, description, priority, status, due_date, completed_date, category, related_to_type, related_to_id, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.user_id || null}, ${item.title}, ${item.description || null}, ${item.priority}, ${item.status}, ${item.due_date || null}, ${item.completed_date || null}, ${item.category || null}, ${item.related_to_type || null}, ${item.related_to_id || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      user_id = EXCLUDED.user_id,
                      title = EXCLUDED.title,
                      description = EXCLUDED.description,
                      priority = EXCLUDED.priority,
                      status = EXCLUDED.status,
                      due_date = EXCLUDED.due_date,
                      completed_date = EXCLUDED.completed_date,
                      category = EXCLUDED.category,
                      related_to_type = EXCLUDED.related_to_type,
                      related_to_id = EXCLUDED.related_to_id,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'invoices') {
                  await postgresStore.query`
                    INSERT INTO invoices (id, tenant_id, tenant_renter_id, lease_id, property_id, unit_id, invoice_number, invoice_date, due_date, status, currency, line_items, subtotal, tax_amount, discount_amount, late_fee_amount, total_amount, amount_paid, balance_due, notes, payment_id, sent_at, paid_at, pdf_uri, auto_generated, recurring_period, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.tenant_renter_id}, ${item.lease_id}, ${item.property_id}, ${item.unit_id}, ${item.invoice_number}, ${item.invoice_date}, ${item.due_date}, ${item.status}, ${item.currency}, ${JSON.stringify(item.line_items || [])}::jsonb, ${item.subtotal}, ${item.tax_amount || null}, ${item.discount_amount || null}, ${item.late_fee_amount || null}, ${item.total_amount}, ${item.amount_paid || null}, ${item.balance_due || null}, ${item.notes || null}, ${item.payment_id || null}, ${item.sent_at || null}, ${item.paid_at || null}, ${item.pdf_uri || null}, ${item.auto_generated}, ${item.recurring_period || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      lease_id = EXCLUDED.lease_id,
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      invoice_number = EXCLUDED.invoice_number,
                      invoice_date = EXCLUDED.invoice_date,
                      due_date = EXCLUDED.due_date,
                      status = EXCLUDED.status,
                      currency = EXCLUDED.currency,
                      line_items = EXCLUDED.line_items,
                      subtotal = EXCLUDED.subtotal,
                      tax_amount = EXCLUDED.tax_amount,
                      discount_amount = EXCLUDED.discount_amount,
                      late_fee_amount = EXCLUDED.late_fee_amount,
                      total_amount = EXCLUDED.total_amount,
                      amount_paid = EXCLUDED.amount_paid,
                      balance_due = EXCLUDED.balance_due,
                      notes = EXCLUDED.notes,
                      payment_id = EXCLUDED.payment_id,
                      sent_at = EXCLUDED.sent_at,
                      paid_at = EXCLUDED.paid_at,
                      pdf_uri = EXCLUDED.pdf_uri,
                      auto_generated = EXCLUDED.auto_generated,
                      recurring_period = EXCLUDED.recurring_period,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'expenses') {
                  await postgresStore.query`
                    INSERT INTO expenses (id, tenant_id, property_id, unit_id, tenant_renter_id, lease_id, category, description, amount, currency, expense_date, paid_by, status, payment_method, reference_number, vendor_name, vendor_contact, notes, is_recurring, recurring_frequency, next_occurrence, receipts, reimbursement_status, reimbursement_date, created_by, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id || null}, ${item.tenant_renter_id || null}, ${item.lease_id || null}, ${item.category}, ${item.description}, ${item.amount}, ${item.currency}, ${item.expense_date}, ${item.paid_by}, ${item.status}, ${item.payment_method || null}, ${item.reference_number || null}, ${item.vendor_name || null}, ${item.vendor_contact || null}, ${item.notes || null}, ${item.is_recurring || false}, ${item.recurring_frequency || null}, ${item.next_occurrence || null}, ${JSON.stringify(item.receipts || [])}::jsonb, ${item.reimbursement_status || null}, ${item.reimbursement_date || null}, ${item.created_by}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      lease_id = EXCLUDED.lease_id,
                      category = EXCLUDED.category,
                      description = EXCLUDED.description,
                      amount = EXCLUDED.amount,
                      currency = EXCLUDED.currency,
                      expense_date = EXCLUDED.expense_date,
                      paid_by = EXCLUDED.paid_by,
                      status = EXCLUDED.status,
                      payment_method = EXCLUDED.payment_method,
                      reference_number = EXCLUDED.reference_number,
                      vendor_name = EXCLUDED.vendor_name,
                      vendor_contact = EXCLUDED.vendor_contact,
                      notes = EXCLUDED.notes,
                      is_recurring = EXCLUDED.is_recurring,
                      recurring_frequency = EXCLUDED.recurring_frequency,
                      next_occurrence = EXCLUDED.next_occurrence,
                      receipts = EXCLUDED.receipts,
                      reimbursement_status = EXCLUDED.reimbursement_status,
                      reimbursement_date = EXCLUDED.reimbursement_date,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'notifications') {
                  await postgresStore.query`
                    INSERT INTO notifications (id, tenant_id, title, message, type, priority, recipient_ids, is_announcement, created_by, created_at, read_by, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.title}, ${item.message}, ${item.type}, ${item.priority}, ${JSON.stringify(item.recipient_ids || [])}::jsonb, ${item.is_announcement}, ${item.created_by}, ${item.created_at}::timestamp, ${JSON.stringify(item.read_by || [])}::jsonb, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      title = EXCLUDED.title,
                      message = EXCLUDED.message,
                      type = EXCLUDED.type,
                      priority = EXCLUDED.priority,
                      recipient_ids = EXCLUDED.recipient_ids,
                      is_announcement = EXCLUDED.is_announcement,
                      read_by = EXCLUDED.read_by,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'move_in_checklists') {
                  await postgresStore.query`
                    INSERT INTO move_in_checklists (id, tenant_id, tenant_renter_id, unit_id, lease_id, items, overall_condition, damage_images, completed, completed_date, tenant_renter_signature, owner_signature, notes, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.tenant_renter_id}, ${item.unit_id}, ${item.lease_id || null}, ${JSON.stringify(item.items || [])}::jsonb, ${item.overall_condition}, ${JSON.stringify(item.damage_images || [])}::jsonb, ${item.completed}, ${item.completed_date || null}, ${item.tenant_renter_signature || null}, ${item.owner_signature || null}, ${item.notes || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      unit_id = EXCLUDED.unit_id,
                      lease_id = EXCLUDED.lease_id,
                      items = EXCLUDED.items,
                      overall_condition = EXCLUDED.overall_condition,
                      damage_images = EXCLUDED.damage_images,
                      completed = EXCLUDED.completed,
                      completed_date = EXCLUDED.completed_date,
                      tenant_renter_signature = EXCLUDED.tenant_renter_signature,
                      owner_signature = EXCLUDED.owner_signature,
                      notes = EXCLUDED.notes,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'property_items') {
                  await postgresStore.query`
                    INSERT INTO property_items (id, tenant_id, property_id, unit_id, name, category, quantity, condition, purchase_date, warranty_expiry, value, replacement_cost, serial_number, model_number, images, notes, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id || null}, ${item.name}, ${item.category}, ${item.quantity}, ${item.condition}, ${item.purchase_date || null}, ${item.warranty_expiry || null}, ${item.value || null}, ${item.replacement_cost || null}, ${item.serial_number || null}, ${item.model_number || null}, ${JSON.stringify(item.images || [])}::jsonb, ${item.notes || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      name = EXCLUDED.name,
                      category = EXCLUDED.category,
                      quantity = EXCLUDED.quantity,
                      condition = EXCLUDED.condition,
                      purchase_date = EXCLUDED.purchase_date,
                      warranty_expiry = EXCLUDED.warranty_expiry,
                      value = EXCLUDED.value,
                      replacement_cost = EXCLUDED.replacement_cost,
                      serial_number = EXCLUDED.serial_number,
                      model_number = EXCLUDED.model_number,
                      images = EXCLUDED.images,
                      notes = EXCLUDED.notes,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'maintenance_schedules') {
                  await postgresStore.query`
                    INSERT INTO maintenance_schedules (id, tenant_id, property_id, unit_id, asset_name, asset_type, task_description, frequency, last_service_date, next_service_date, assigned_to, service_provider, estimated_cost, priority, is_active, reminder_days_before, notes, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id || null}, ${item.asset_name}, ${item.asset_type}, ${item.task_description}, ${item.frequency}, ${item.last_service_date || null}, ${item.next_service_date}, ${item.assigned_to || null}, ${item.service_provider || null}, ${item.estimated_cost || null}, ${item.priority}, ${item.is_active}, ${item.reminder_days_before || null}, ${item.notes || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      asset_name = EXCLUDED.asset_name,
                      asset_type = EXCLUDED.asset_type,
                      task_description = EXCLUDED.task_description,
                      frequency = EXCLUDED.frequency,
                      last_service_date = EXCLUDED.last_service_date,
                      next_service_date = EXCLUDED.next_service_date,
                      assigned_to = EXCLUDED.assigned_to,
                      service_provider = EXCLUDED.service_provider,
                      estimated_cost = EXCLUDED.estimated_cost,
                      priority = EXCLUDED.priority,
                      is_active = EXCLUDED.is_active,
                      reminder_days_before = EXCLUDED.reminder_days_before,
                      notes = EXCLUDED.notes,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'inventory_history') {
                  await postgresStore.query`
                    INSERT INTO inventory_history (id, tenant_id, property_item_id, property_id, unit_id, tenant_renter_id, lease_id, action, reason, previous_condition, new_condition, cost, paid_by, deducted_from_deposit, quantity_before, quantity_after, notes, images, performed_by, performed_at, created_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_item_id}, ${item.property_id}, ${item.unit_id || null}, ${item.tenant_renter_id || null}, ${item.lease_id || null}, ${item.action}, ${item.reason}, ${item.previous_condition || null}, ${item.new_condition || null}, ${item.cost || null}, ${item.paid_by || null}, ${item.deducted_from_deposit || false}, ${item.quantity_before || null}, ${item.quantity_after || null}, ${item.notes || null}, ${JSON.stringify(item.images || [])}::jsonb, ${item.performed_by || null}, ${item.performed_at}, ${item.created_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_item_id = EXCLUDED.property_item_id,
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      lease_id = EXCLUDED.lease_id,
                      action = EXCLUDED.action,
                      reason = EXCLUDED.reason,
                      previous_condition = EXCLUDED.previous_condition,
                      new_condition = EXCLUDED.new_condition,
                      cost = EXCLUDED.cost,
                      paid_by = EXCLUDED.paid_by,
                      deducted_from_deposit = EXCLUDED.deducted_from_deposit,
                      quantity_before = EXCLUDED.quantity_before,
                      quantity_after = EXCLUDED.quantity_after,
                      notes = EXCLUDED.notes,
                      images = EXCLUDED.images,
                      performed_by = EXCLUDED.performed_by,
                      performed_at = EXCLUDED.performed_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'business_documents') {
                  await postgresStore.query`
                    INSERT INTO business_documents (id, tenant_id, property_id, name, category, document_number, issuing_authority, issue_date, expiry_date, reminder_days_before, file_uri, file_type, file_size, notes, uploaded_by, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id || null}, ${item.name}, ${item.category}, ${item.document_number || null}, ${item.issuing_authority || null}, ${item.issue_date || null}, ${item.expiry_date || null}, ${item.reminder_days_before || null}, ${item.file_uri || null}, ${item.file_type || null}, ${item.file_size || null}, ${item.notes || null}, ${item.uploaded_by}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      name = EXCLUDED.name,
                      category = EXCLUDED.category,
                      document_number = EXCLUDED.document_number,
                      issuing_authority = EXCLUDED.issuing_authority,
                      issue_date = EXCLUDED.issue_date,
                      expiry_date = EXCLUDED.expiry_date,
                      reminder_days_before = EXCLUDED.reminder_days_before,
                      file_uri = EXCLUDED.file_uri,
                      file_type = EXCLUDED.file_type,
                      file_size = EXCLUDED.file_size,
                      notes = EXCLUDED.notes,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'tenant_applications') {
                  await postgresStore.query`
                    INSERT INTO tenant_applications (id, tenant_id, property_id, unit_id, applicant_type, applicant_first_name, applicant_last_name, business_name, applicant_email, applicant_phone, date_of_birth, id_type, id_number, current_address, island, postal_code, country, employment_status, employer_name, job_title, employment_duration, monthly_income, previous_address, previous_landlord_name, previous_landlord_phone, previous_landlord_email, reason_for_moving, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, number_of_occupants, occupant_names, has_pets, pet_type, pet_count, pet_details, desired_move_in_date, lease_duration_preference, additional_notes, tenant_renter_id, status, reviewed_by, reviewed_at, review_notes, rejection_reason, documents, credit_check_result, background_check_result, reference_check_result, credit_score, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id || null}, ${item.applicant_type}, ${item.applicant_first_name || null}, ${item.applicant_last_name || null}, ${item.business_name || null}, ${item.applicant_email}, ${item.applicant_phone}, ${item.date_of_birth || null}, ${item.id_type || null}, ${item.id_number || null}, ${item.current_address || null}, ${item.island || null}, ${item.postal_code || null}, ${item.country || null}, ${item.employment_status || null}, ${item.employer_name || null}, ${item.job_title || null}, ${item.employment_duration || null}, ${item.monthly_income || null}, ${item.previous_address || null}, ${item.previous_landlord_name || null}, ${item.previous_landlord_phone || null}, ${item.previous_landlord_email || null}, ${item.reason_for_moving || null}, ${item.emergency_contact_name || null}, ${item.emergency_contact_phone || null}, ${item.emergency_contact_relationship || null}, ${item.number_of_occupants || null}, ${JSON.stringify(item.occupant_names || [])}::jsonb, ${item.has_pets || false}, ${item.pet_type || null}, ${item.pet_count || null}, ${item.pet_details || null}, ${item.desired_move_in_date || null}, ${item.lease_duration_preference || null}, ${item.additional_notes || null}, ${item.tenant_renter_id || null}, ${item.status}, ${item.reviewed_by || null}, ${item.reviewed_at || null}, ${item.review_notes || null}, ${item.rejection_reason || null}, ${JSON.stringify(item.documents || [])}::jsonb, ${item.credit_check_result || null}, ${item.background_check_result || null}, ${item.reference_check_result || null}, ${item.credit_score || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      status = EXCLUDED.status,
                      reviewed_by = EXCLUDED.reviewed_by,
                      reviewed_at = EXCLUDED.reviewed_at,
                      review_notes = EXCLUDED.review_notes,
                      rejection_reason = EXCLUDED.rejection_reason,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      credit_check_result = EXCLUDED.credit_check_result,
                      background_check_result = EXCLUDED.background_check_result,
                      reference_check_result = EXCLUDED.reference_check_result,
                      credit_score = EXCLUDED.credit_score,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'tenant_onboardings') {
                  await postgresStore.query`
                    INSERT INTO tenant_onboardings (id, tenant_id, application_id, tenant_renter_id, lease_id, status, tasks, documents_signed, deposit_paid, keys_handed_over, orientation_completed, utilities_setup, insurance_verified, welcome_kit_provided, started_at, completed_at, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.application_id}, ${item.tenant_renter_id || null}, ${item.lease_id || null}, ${item.status}, ${JSON.stringify(item.tasks || [])}::jsonb, ${item.documents_signed}, ${item.deposit_paid}, ${item.keys_handed_over}, ${item.orientation_completed}, ${item.utilities_setup}, ${item.insurance_verified}, ${item.welcome_kit_provided}, ${item.started_at}, ${item.completed_at || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      lease_id = EXCLUDED.lease_id,
                      status = EXCLUDED.status,
                      tasks = EXCLUDED.tasks,
                      documents_signed = EXCLUDED.documents_signed,
                      deposit_paid = EXCLUDED.deposit_paid,
                      keys_handed_over = EXCLUDED.keys_handed_over,
                      orientation_completed = EXCLUDED.orientation_completed,
                      utilities_setup = EXCLUDED.utilities_setup,
                      insurance_verified = EXCLUDED.insurance_verified,
                      welcome_kit_provided = EXCLUDED.welcome_kit_provided,
                      completed_at = EXCLUDED.completed_at,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'property_inspections') {
                  await postgresStore.query`
                    INSERT INTO property_inspections (id, tenant_id, property_id, unit_id, tenant_renter_id, lease_id, inspection_type, scheduled_date, scheduled_time, completed_date, inspector_id, status, findings, issues_found, recommendations, images, report_pdf_uri, next_inspection_date, created_at, updated_at, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.property_id}, ${item.unit_id || null}, ${item.tenant_renter_id || null}, ${item.lease_id || null}, ${item.inspection_type}, ${item.scheduled_date}, ${item.scheduled_time || null}, ${item.completed_date || null}, ${item.inspector_id || null}, ${item.status}, ${item.findings || null}, ${JSON.stringify(item.issues_found || [])}::jsonb, ${item.recommendations || null}, ${JSON.stringify(item.images || [])}::jsonb, ${item.report_pdf_uri || null}, ${item.next_inspection_date || null}, ${item.created_at}::timestamp, ${item.updated_at}::timestamp, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      property_id = EXCLUDED.property_id,
                      unit_id = EXCLUDED.unit_id,
                      tenant_renter_id = EXCLUDED.tenant_renter_id,
                      lease_id = EXCLUDED.lease_id,
                      inspection_type = EXCLUDED.inspection_type,
                      scheduled_date = EXCLUDED.scheduled_date,
                      scheduled_time = EXCLUDED.scheduled_time,
                      completed_date = EXCLUDED.completed_date,
                      inspector_id = EXCLUDED.inspector_id,
                      status = EXCLUDED.status,
                      findings = EXCLUDED.findings,
                      issues_found = EXCLUDED.issues_found,
                      recommendations = EXCLUDED.recommendations,
                      images = EXCLUDED.images,
                      report_pdf_uri = EXCLUDED.report_pdf_uri,
                      next_inspection_date = EXCLUDED.next_inspection_date,
                      updated_at = EXCLUDED.updated_at,
                      version = EXCLUDED.version
                  `;
                } else if (table === 'staff_users') {
                  await postgresStore.query`
                    INSERT INTO staff_users (id, tenant_id, email, first_name, last_name, phone, avatar, role, is_active, permissions, created_by, created_at, last_login, version)
                    VALUES (${item.id}, ${item.tenant_id}, ${item.email}, ${item.first_name}, ${item.last_name}, ${item.phone || null}, ${item.avatar || null}, ${item.role}, ${item.is_active}, ${JSON.stringify(item.permissions || null)}::jsonb, ${item.created_by || null}, ${item.created_at}::timestamp, ${item.last_login || null}, ${item.version || 0})
                    ON CONFLICT (id) DO UPDATE SET 
                      email = EXCLUDED.email,
                      first_name = EXCLUDED.first_name,
                      last_name = EXCLUDED.last_name,
                      phone = EXCLUDED.phone,
                      avatar = EXCLUDED.avatar,
                      role = EXCLUDED.role,
                      is_active = EXCLUDED.is_active,
                      permissions = EXCLUDED.permissions,
                      last_login = EXCLUDED.last_login,
                      version = EXCLUDED.version
                  `;
                }
              } catch (itemError) {
                console.error(`[SYNC_POSTGRES] Error upserting item to ${table}:`, itemError, item);
                throw itemError;
              }
            }
          };

          await Promise.all([
            upsertToPostgres('properties', input.changes.properties),
            upsertToPostgres('units', input.changes.units),
            upsertToPostgres('tenant_renters', input.changes.tenant_renters),
            upsertToPostgres('leases', input.changes.leases),
            upsertToPostgres('payments', input.changes.payments),
            upsertToPostgres('maintenance_requests', input.changes.maintenance_requests),
            upsertToPostgres('notifications', input.changes.notifications),
            upsertToPostgres('move_in_checklists', input.changes.move_in_checklists),
            upsertToPostgres('property_items', input.changes.property_items),
            upsertToPostgres('maintenance_schedules', input.changes.maintenance_schedules),
            upsertToPostgres('todos', input.changes.todos),
            upsertToPostgres('inventory_history', input.changes.inventory_history),
            upsertToPostgres('invoices', input.changes.invoices),
            upsertToPostgres('business_documents', input.changes.business_documents),
            upsertToPostgres('tenant_applications', input.changes.tenant_applications),
            upsertToPostgres('tenant_onboardings', input.changes.tenant_onboardings),
            upsertToPostgres('property_inspections', input.changes.property_inspections),
            upsertToPostgres('expenses', input.changes.expenses),
            upsertToPostgres('staff_users', input.changes.staff_users),
          ]);

          console.log(`[SYNC_POSTGRES] Successfully synced all changes for tenant ${input.tenantId}`);
          return {
            success: true,
            syncTime: new Date().toISOString(),
          };
        } catch (error) {
          console.error('[SYNC] PostgreSQL push error, falling back to in-memory:', error);
        }
      }
      
      const mergeData = <T extends { id: string; version: number; tenant_id: string }>(
        dbArray: T[],
        changes: T[] | undefined
      ): T[] => {
        if (!changes || changes.length === 0) return dbArray;

        const merged = [...dbArray];
        
        for (const change of changes) {
          const existingIndex = merged.findIndex(item => item.id === change.id);
          
          if (existingIndex === -1) {
            merged.push({ ...change, version: 1 });
          } else {
            const existing = merged[existingIndex];
            if (change.version >= existing.version) {
              merged[existingIndex] = { ...change, version: change.version + 1 };
            }
          }
        }
        
        return merged;
      };

      inMemoryDB.properties = mergeData(inMemoryDB.properties, input.changes.properties as any);
      inMemoryDB.units = mergeData(inMemoryDB.units, input.changes.units as any);
      inMemoryDB.tenant_renters = mergeData(inMemoryDB.tenant_renters, input.changes.tenant_renters as any);
      inMemoryDB.leases = mergeData(inMemoryDB.leases, input.changes.leases as any);
      inMemoryDB.payments = mergeData(inMemoryDB.payments, input.changes.payments as any);
      inMemoryDB.maintenance_requests = mergeData(inMemoryDB.maintenance_requests, input.changes.maintenance_requests as any);
      inMemoryDB.notifications = mergeData(inMemoryDB.notifications, input.changes.notifications as any);
      inMemoryDB.move_in_checklists = mergeData(inMemoryDB.move_in_checklists, input.changes.move_in_checklists as any);
      inMemoryDB.property_items = mergeData(inMemoryDB.property_items, input.changes.property_items as any);
      inMemoryDB.maintenance_schedules = mergeData(inMemoryDB.maintenance_schedules, input.changes.maintenance_schedules as any);
      inMemoryDB.todos = mergeData(inMemoryDB.todos, input.changes.todos as any);
      inMemoryDB.inventory_history = mergeData(inMemoryDB.inventory_history, input.changes.inventory_history as any);
      inMemoryDB.invoices = mergeData(inMemoryDB.invoices, input.changes.invoices as any);
      inMemoryDB.business_documents = mergeData(inMemoryDB.business_documents, input.changes.business_documents as any);
      inMemoryDB.tenant_applications = mergeData(inMemoryDB.tenant_applications, input.changes.tenant_applications as any);
      inMemoryDB.tenant_onboardings = mergeData(inMemoryDB.tenant_onboardings, input.changes.tenant_onboardings as any);
      inMemoryDB.property_inspections = mergeData(inMemoryDB.property_inspections, input.changes.property_inspections as any);
      inMemoryDB.expenses = mergeData(inMemoryDB.expenses, input.changes.expenses as any);
      inMemoryDB.staff_users = mergeData(inMemoryDB.staff_users, input.changes.staff_users as any);

      return {
        success: true,
        syncTime: new Date().toISOString(),
      };
    }),
};

export default syncRoute;
