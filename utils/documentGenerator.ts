import { MoveInChecklist, Lease, Property, Unit, TenantRenter, PropertyItem } from '@/types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { fillTenancyAgreementTemplate, TENANCY_AGREEMENT_TEMPLATE, TenancyAgreementData } from '@/constants/tenancyAgreement';

export function generateChecklistHTML(checklist: MoveInChecklist): string {
  const itemsByCategory: Record<string, typeof checklist.items> = {};
  
  checklist.items.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  const categoryNames: Record<string, string> = {
    living_room: 'Living Room',
    kitchen: 'Kitchen',
    dining_room: 'Dining Room',
    bathroom: 'Bathroom',
    bedroom: 'Bedroom',
    balcony: 'Balcony',
    keys: 'Keys & Accessories',
    general: 'General',
    living: 'Living Areas',
    other: 'Other Items',
  };

  let html = `
    <div class="checklist-section">
      <h2 class="schedule-title">Schedule 1: Rental Property Condition Checklist</h2>
      <p class="checklist-subtitle">Move-In Inspection Report</p>
      
      <div class="checklist-info">
        <p><strong>Inspection Date:</strong> ${checklist.completed_date ? new Date(checklist.completed_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</p>
        <p><strong>Overall Condition:</strong> ${checklist.overall_condition.charAt(0).toUpperCase() + checklist.overall_condition.slice(1)}</p>
      </div>
  `;

  Object.entries(itemsByCategory).forEach(([category, items]) => {
    html += `
      <div class="checklist-category">
        <h3 class="category-title">${categoryNames[category] || category}</h3>
        <table class="checklist-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Condition on Arrival</th>
              <th>Condition on Departure</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach(item => {
      const conditionText = item.condition 
        ? item.condition === 'excellent' || item.condition === 'good' 
          ? `${item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}`
          : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)
        : 'N/A';
      
      const notesText = item.notes || (category === 'keys' && item.notes ? `Qty: ${item.notes}` : '');
      
      html += `
        <tr>
          <td>${item.name}</td>
          <td>${conditionText}</td>
          <td></td>
          <td>${notesText}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  if (checklist.notes) {
    html += `
      <div class="checklist-notes">
        <h4>Overall Notes / Comments:</h4>
        <p>${checklist.notes}</p>
      </div>
    `;
  }

  html += `
    </div>
  `;

  return html;
}

export async function generateChecklistPDF(
  checklist: MoveInChecklist,
  property: Property,
  unit: Unit,
  tenant: TenantRenter
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Property Condition Checklist</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; font-size: 11pt; }
          .header { text-align: center; border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #003366; margin: 0 0 10px 0; font-size: 24pt; }
          .checklist-section { margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
          th { background: #003366; color: white; padding: 10px 8px; text-align: left; border: 1px solid #003366; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .category-title { font-size: 13pt; font-weight: bold; color: #003366; margin: 20px 0 10px 0; padding: 8px 12px; background: #E8F0F7; border-left: 4px solid #003366; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RENTAL PROPERTY CONDITION CHECKLIST</h1>
          <p><strong>Property:</strong> ${property.name} - Unit ${unit.unit_number}</p>
          <p><strong>Tenant:</strong> ${tenant.type === 'business' ? tenant.business_name : `${tenant.first_name} ${tenant.last_name}`}</p>
        </div>
        ${generateChecklistHTML(checklist)}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareChecklistPDF(
  checklist: MoveInChecklist,
  property: Property,
  unit: Unit,
  tenant: TenantRenter
): Promise<void> {
  const pdfUri = await generateChecklistPDF(checklist, property, unit, tenant);
  
  if (Platform.OS !== 'web') {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Checklist',
        UTI: 'com.adobe.pdf',
      });
    }
  }
}

export function generateInventoryHTML(items: PropertyItem[]): string {
  if (items.length === 0) {
    return `
      <div class="inventory-section">
        <h2 class="schedule-title">Schedule 2: Property Inventory List</h2>
        <p class="empty-message">No inventory items recorded.</p>
      </div>
    `;
  }

  const itemsByCategory: Record<string, PropertyItem[]> = {};
  
  items.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  const categoryNames: Record<string, string> = {
    appliance: 'Appliances',
    furniture: 'Furniture',
    fixture: 'Fixtures',
    accessory: 'Accessories',
    other: 'Other Items',
  };

  let html = `
    <div class="inventory-section">
      <h2 class="schedule-title">Schedule 2: Property Inventory List</h2>
      <p class="inventory-subtitle">Complete list of property items and fixtures</p>
  `;

  Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
    html += `
      <div class="inventory-category">
        <h3 class="category-title">${categoryNames[category] || category}</h3>
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Condition</th>
              <th>Serial/Model Number</th>
              <th>Replacement Cost</th>
            </tr>
          </thead>
          <tbody>
    `;

    categoryItems.forEach(item => {
      const serialModel = [item.serial_number, item.model_number].filter(Boolean).join(' / ') || 'N/A';
      const replacementCost = item.replacement_cost 
        ? `₨${item.replacement_cost.toLocaleString('en-GB', { minimumFractionDigits: 2 })} SCR`
        : 'N/A';
      
      html += `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}</td>
          <td>${serialModel}</td>
          <td>${replacementCost}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  html += `
    </div>
  `;

  return html;
}

export async function generateInventoryPDF(
  items: PropertyItem[],
  property: Property,
  unit: Unit
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Property Inventory</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; font-size: 11pt; }
          .header { text-align: center; border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #003366; margin: 0 0 10px 0; font-size: 24pt; }
          .inventory-section { margin-top: 20px; }
          .category-title { font-size: 13pt; font-weight: bold; color: #003366; margin: 20px 0 10px 0; padding: 8px 12px; background: #E8F0F7; border-left: 4px solid #003366; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
          th { background: #003366; color: white; padding: 10px 8px; text-align: left; border: 1px solid #003366; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PROPERTY INVENTORY LIST</h1>
          <p><strong>Property:</strong> ${property.name} - Unit ${unit.unit_number}</p>
        </div>
        ${generateInventoryHTML(items)}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareInventoryPDF(
  items: PropertyItem[],
  property: Property,
  unit: Unit
): Promise<void> {
  const pdfUri = await generateInventoryPDF(items, property, unit);
  
  if (Platform.OS !== 'web') {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Inventory',
        UTI: 'com.adobe.pdf',
      });
    }
  }
}

export async function generateCompleteTenancyPDF(
  lease: Lease,
  property: Property,
  unit: Unit,
  tenant: TenantRenter,
  checklist?: MoveInChecklist,
  inventoryItems?: PropertyItem[]
): Promise<string> {
  const html = generateCompleteTenancyDocument(lease, property, unit, tenant, checklist, inventoryItems);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareCompleteTenancyPDF(
  lease: Lease,
  property: Property,
  unit: Unit,
  tenant: TenantRenter,
  checklist?: MoveInChecklist,
  inventoryItems?: PropertyItem[]
): Promise<void> {
  const pdfUri = await generateCompleteTenancyPDF(lease, property, unit, tenant, checklist, inventoryItems);
  
  if (Platform.OS !== 'web') {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Complete Tenancy Agreement',
        UTI: 'com.adobe.pdf',
      });
    }
  }
}

export function generateCompleteTenancyDocument(
  lease: Lease,
  property: Property,
  unit: Unit,
  tenant: TenantRenter,
  checklist?: MoveInChecklist,
  inventoryItems?: PropertyItem[]
): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const tenantName = tenant.type === 'business' 
    ? tenant.business_name || 'Unnamed Business'
    : `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();

  const passportInfo = tenant.id_type && tenant.id_number 
    ? `(${tenant.id_type} No: ${tenant.id_number})`
    : '';

  const tenantAddress = [tenant.address, tenant.island, tenant.country]
    .filter(Boolean)
    .join(', ') || 'Address not provided';



  const leasePeriodMonths = Math.round(
    (new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) / 
    (1000 * 60 * 60 * 24 * 30)
  );

  const agreementData: TenancyAgreementData = {
    agreement_date: lease.signed_date ? formatDate(lease.signed_date) : formatDate(new Date().toISOString()),
    landlord_name: 'Sahaj Holdings (Pty) Ltd',
    landlord_address: 'Providence, Mahé, Seychelles',
    landlord_representative: property.name,
    landlord_entity: 'Sahaj Holdings (Pty) Ltd',
    landlord_signature_name: 'Property Manager',
    tenant_name: tenantName,
    tenant_signature_name: tenantName,
    tenant_address: tenantAddress,
    passport_details: passportInfo,
    property_description: `${unit.bedrooms || 'N/A'}-bedroom ${property.property_type} at ${property.name}, Unit ${unit.unit_number}`,
    lease_period: `${leasePeriodMonths} month${leasePeriodMonths !== 1 ? 's' : ''}`,
    start_date: formatDate(lease.start_date),
    end_date: formatDate(lease.end_date),
    rent_amount: formatCurrency(lease.rent_amount),
    currency: 'SCR',
    payment_due_day: lease.payment_due_day.toString(),
    deposit_amount: formatCurrency(lease.deposit_amount),
    deposit_received_date: lease.signed_date ? formatDate(lease.signed_date) : '_________________',
    deposit_conditions: unit.assigned_parking && unit.assigned_parking.length > 0
      ? `• Assigned Parking: ${unit.assigned_parking.join(', ')}\n• Smoking permitted only on balconies.`
      : '• Smoking permitted only on balconies.',
    key_replacement_cost: '₨250 SCR',
    remote_replacement_cost: '₨1,000 SCR',
    keycard_replacement_cost: '₨50 SCR',
    pets_allowed: 'No pets allowed unless approved by landlord',
    max_occupancy: '4',
    parking_details: unit.assigned_parking && unit.assigned_parking.length > 0
      ? `\n\n**Assigned Parking Spaces:** ${unit.assigned_parking.join(', ')}`
      : '',
    late_fee_first_day: '₨100 SCR',
    late_fee_additional: '₨525 SCR',
    dishonour_fee: '₨500 SCR',
    additional_terms: lease.terms || '',
    generation_date: new Date().toLocaleDateString('en-GB', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    }),
  };

  let agreementText = fillTenancyAgreementTemplate(TENANCY_AGREEMENT_TEMPLATE, agreementData);
  
  agreementText = agreementText
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) {
        return `<h1 class="main-title">${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2 class="section-title">${line.substring(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3 class="subsection-title">${line.substring(4)}</h3>`;
      } else if (line.startsWith('- ')) {
        return `<li>${line.substring(2)}</li>`;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return `<p class="bold-text">${line.substring(2, line.length - 2)}</p>`;
      } else if (line.trim() === '---') {
        return '<hr class="separator" />';
      } else if (line.trim() === '') {
        return '<br />';
      } else {
        return `<p>${line}</p>`;
      }
    })
    .join('\n');

  const checklistHTML = checklist ? generateChecklistHTML(checklist) : '';
  const inventoryHTML = inventoryItems && inventoryItems.length > 0 
    ? generateInventoryHTML(inventoryItems) 
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Tenancy Agreement - ${property.name} Unit ${unit.unit_number}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          
          body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #1A1A1A;
            font-size: 11pt;
            margin: 0;
            padding: 0;
          }
          
          .main-title {
            text-align: center;
            font-size: 24pt;
            font-weight: bold;
            color: #003366;
            margin: 20px 0 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 3px solid #003366;
            padding-bottom: 15px;
          }
          
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #003366;
            margin: 25px 0 15px 0;
            page-break-after: avoid;
          }
          
          .subsection-title {
            font-size: 12pt;
            font-weight: bold;
            color: #333;
            margin: 15px 0 10px 0;
          }
          
          p {
            margin: 8px 0;
            text-align: justify;
          }
          
          .bold-text {
            font-weight: bold;
            margin: 10px 0;
          }
          
          li {
            margin: 5px 0 5px 20px;
          }
          
          hr.separator {
            border: none;
            border-top: 1px solid #ccc;
            margin: 20px 0;
          }
          
          .schedule-title {
            font-size: 16pt;
            font-weight: bold;
            color: #003366;
            margin: 40px 0 20px 0;
            padding-top: 20px;
            border-top: 3px solid #003366;
            page-break-before: always;
          }
          
          .checklist-section, .inventory-section {
            margin-top: 30px;
          }
          
          .checklist-subtitle, .inventory-subtitle {
            font-size: 11pt;
            color: #666;
            margin-bottom: 20px;
            font-style: italic;
          }
          
          .checklist-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          
          .checklist-category, .inventory-category {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .category-title {
            font-size: 13pt;
            font-weight: bold;
            color: #003366;
            margin: 20px 0 10px 0;
            padding: 8px 12px;
            background: #E8F0F7;
            border-left: 4px solid #003366;
          }
          
          .checklist-table, .inventory-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 10pt;
          }
          
          .checklist-table th, .inventory-table th {
            background: #003366;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #003366;
          }
          
          .checklist-table td, .inventory-table td {
            padding: 8px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          
          .checklist-table tr:nth-child(even), .inventory-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          .checklist-notes {
            background: #fff9e6;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          
          .checklist-notes h4 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 11pt;
          }
          
          .empty-message {
            text-align: center;
            color: #999;
            padding: 30px;
            font-style: italic;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .section-title, .category-title {
              page-break-after: avoid;
            }
            
            .checklist-category, .inventory-category {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${agreementText}
        ${checklistHTML}
        ${inventoryHTML}
      </body>
    </html>
  `;
}
