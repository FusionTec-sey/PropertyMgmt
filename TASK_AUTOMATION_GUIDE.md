# Automatic Task Generation System

## Overview

The rental management app now includes a **comprehensive automatic task generation and completion detection system** that monitors app events in real-time and creates/completes tasks based on business logic.

## How It Works

### 1. Background Automation (Every 6 Hours)
The system automatically runs every 6 hours via `AppInitializer.runAutomatedTaskGeneration()` to:
- Scan all leases, payments, maintenance requests, invoices, documents, and applications
- Generate new tasks for upcoming deadlines, overdue items, and pending actions
- Detect and auto-complete tasks when their conditions are met

### 2. Event-Based Task Generation
Tasks are also generated immediately when certain events occur using `generateTasksFromEvent()`:
- **Lease Created**: Creates renewal reminders and move-in inspection tasks
- **Payment Status Changed**: Creates follow-up tasks for overdue payments
- **Maintenance Created**: Creates urgent assignment tasks for high-priority requests
- **Maintenance Status Changed**: Creates inspection tasks when maintenance is resolved
- **Invoice Created**: Creates payment monitoring tasks
- **Document Added**: Creates expiry reminder tasks
- **Application Received**: Creates review and approval tasks

### 3. Automatic Task Completion Detection
The system automatically marks tasks as completed when:
- Overdue payments are paid
- Maintenance requests are resolved
- Draft leases are signed
- Applications are reviewed
- Inspections are completed
- Documents are renewed

## Task Categories

### Lease Management
- **Lease Renewal Reminders**: Generated 60 days before expiration
- **Lease Renewal Offer Preparation**: Generated 30 days before expiration
- **Move-Out Checklist**: Generated 7 days before expiration
- **Complete Draft Lease**: Generated after 7 days in draft status
- **Move-In Inspection**: Generated when new lease is activated

### Payment Management
- **Payment Reminders**: Generated 3 days before due date
- **Overdue Payment Follow-Up**: Generated 3+ days after due date
- **Escalation Tasks**: Generated 30+ days after due date
- **Invoice Payment Monitoring**: Generated for sent invoices

### Maintenance Management
- **Urgent Maintenance Assignment**: Generated immediately for urgent requests
- **Pending Maintenance Follow-Up**: Generated after 7 days open
- **Maintenance Progress Check**: Generated for overdue scheduled work
- **Post-Maintenance Inspection**: Generated for completed high-priority work
- **Expense Recording**: Generated when maintenance has cost but no expense record

### Document Management
- **Document Expiry Reminders**: Generated 60 days before expiration
- **Document Renewal (Expired)**: Generated immediately after expiration
- **Compliance Checks**: Generated for business licenses, permits, certificates

### Tenant Management
- **Application Review**: Generated 3 days after submission
- **Tenant Profile Creation**: Generated when application is approved
- **Onboarding Tasks**: Generated during tenant onboarding process

### Property Management
- **Inspection Reminders**: Generated 1 day before scheduled inspection
- **Missed Inspection Follow-Up**: Generated for overdue inspections
- **Issue Resolution**: Generated when inspection finds problems
- **Marketing Tasks**: Generated when multiple units are available

### Financial Management
- **Expense Approval**: Generated after 7 days pending
- **Payment Processing**: Generated for pending transactions

## Manual Task Generation

Users can also manually trigger task automation from the Todos screen:
1. Navigate to the **Todos** tab
2. Tap the **"Auto-Generate Tasks"** button (with sparkles icon)
3. System will scan all data and create relevant tasks
4. Summary shows: tasks generated, tasks completed, categories

## Task Priorities

Tasks are automatically assigned priorities based on urgency:

- **Urgent** (Red): Expired documents, 30+ day overdue payments, urgent maintenance
- **High** (Orange): Near expiration (7-14 days), overdue items, pending reviews
- **Medium** (Yellow): Moderate deadlines (15-30 days), routine follow-ups
- **Low** (Green): Long-term planning (30+ days)

## Automatic Completion Triggers

Tasks are auto-completed when:

| Task Type | Completion Trigger |
|-----------|-------------------|
| Overdue Payment Follow-Up | Payment status changes to "paid" |
| Payment Reminder | Payment is received |
| Address Maintenance | Maintenance status changes to "resolved" |
| Follow-Up Pending Maintenance | Maintenance status changes to "in_progress" |
| Record Expense | Expense record is created and linked |
| Complete Draft Lease | Lease is signed |
| Prepare Lease Renewal Offer | Renewal offer is created |
| Review Application | Application status changes to approved/rejected |
| Create Tenant Profile | Tenant profile is created from application |
| Property Inspection | Inspection status changes to "completed" |
| Document Expiry Reminder | Document is renewed (new expiry > 60 days) |
| Approve/Pay Expense | Expense status changes to paid/approved |

## Task Deduplication

The system prevents duplicate tasks by checking:
- Task title matches existing task
- Related entity ID matches
- Existing task is not completed or cancelled

## Configuration

### Automation Intervals
Defined in `utils/appInitializer.ts`:
- **Task Automation**: Every 6 hours
- **Invoice Generation**: Every 24 hours
- **Document Reminders**: Every 24 hours

### Customization
To adjust automation behavior, modify:
- `utils/taskAutomation.ts` - Task generation logic
- `utils/appInitializer.ts` - Automation intervals
- `utils/automationHelper.ts` - Helper functions for specific task types

## Benefits

1. **Never Miss Deadlines**: Automatic reminders for all critical dates
2. **Reduced Manual Work**: Tasks are created and completed automatically
3. **Better Organization**: All action items are tracked in one place
4. **Improved Compliance**: Automatic reminders for licenses, permits, and certificates
5. **Enhanced Tenant Relations**: Timely follow-ups on payments and maintenance
6. **Data-Driven**: Tasks are generated based on actual app data and events
7. **Complete Audit Trail**: All automated actions are logged

## Viewing Task Automation Logs

Check the console for detailed automation logs:
- `[TASK AUTOMATION]` - Main automation process
- `[EVENT TASK GENERATION]` - Event-based task creation
- `[APP_INITIALIZER]` - Background automation runs

## Troubleshooting

### Tasks Not Being Generated
1. Ensure user is logged in (`currentTenant` exists)
2. Check console for `[TASK AUTOMATION]` logs
3. Verify data exists (leases, payments, etc.)
4. Check last automation timestamp in AsyncStorage

### Tasks Not Being Completed
1. Verify completion triggers match the logic in `detectCompletedTasks()`
2. Check that related entities have correct status updates
3. Ensure task IDs match related entity IDs

### Duplicate Tasks
1. Task deduplication checks title + related_to_id + status
2. If duplicates appear, check task titles for variations
3. Review `isDuplicate` logic in task generation functions

## Future Enhancements

Potential additions to the system:
- Push notifications for urgent tasks
- Email notifications for overdue tasks
- Task assignment to staff members
- Custom task templates
- Recurring task automation
- AI-powered task prioritization
- Integration with calendar apps
- Bulk task operations

## API Reference

### `runTaskAutomation()`
Main function that runs full task automation cycle.

**Parameters:**
- `leases: Lease[]`
- `payments: Payment[]`
- `maintenanceRequests: MaintenanceRequest[]`
- `invoices: Invoice[]`
- `businessDocuments: BusinessDocument[]`
- `tenantApplications: TenantApplication[]`
- `propertyInspections: PropertyInspection[]`
- `expenses: Expense[]`
- `properties: Property[]`
- `units: Unit[]`
- `existingTodos: Todo[]`
- `tenantId: string`

**Returns:** `TaskGenerationResult`
```typescript
{
  tasks: Todo[];
  completedTaskIds: string[];
  summary: {
    generated: number;
    completed: number;
    categories: { [key: string]: number };
  };
}
```

### `generateTasksFromEvent()`
Generates tasks based on specific app events.

**Parameters:**
- `eventType: 'lease_created' | 'payment_status_changed' | 'maintenance_created' | ...`
- `eventData: any` - The entity that triggered the event
- `existingTodos: Todo[]`
- `tenantId: string`

**Returns:** `Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>[]`

### `detectCompletedTasks()`
Detects which tasks should be automatically completed.

**Parameters:**
- `todos: Todo[]`
- `leases: Lease[]`
- `payments: Payment[]`
- `maintenanceRequests: MaintenanceRequest[]`
- `invoices: Invoice[]`
- `businessDocuments: BusinessDocument[]`
- `tenantApplications: TenantApplication[]`
- `propertyInspections: PropertyInspection[]`
- `expenses: Expense[]`

**Returns:** `string[]` - Array of task IDs to be marked as completed

## Summary

The automatic task generation system ensures that property managers never miss important deadlines or follow-ups. It combines scheduled automation (every 6 hours), event-based triggers (instant), and intelligent completion detection to provide a comprehensive task management solution.

All tasks are tracked in the **Todos** tab, organized by status (Pending, In Progress, Completed), and can be filtered, edited, or manually marked as complete as needed.
