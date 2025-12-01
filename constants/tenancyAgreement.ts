export const TENANCY_AGREEMENT_TEMPLATE = `
# TENANCY AGREEMENT

This Tenancy Agreement is made in duplicate on: **{{agreement_date}}**

---

## BETWEEN:

**Landlord/Property Manager:** {{landlord_name}}, having its registered office at {{landlord_address}}, represented by {{landlord_representative}} (hereinafter referred to as the "Landlord"), of the one part;

---

## AND:

**Tenant:** {{tenant_name}} {{passport_details}}, residing at {{tenant_address}} (hereinafter referred to as the "Tenant"), of the other part.

---

## 1. DEFINITIONS & INTERPRETATION

Unless the context requires otherwise, the following terms shall have the meanings assigned to them:

- **"Landlord"** – The grantor of the tenancy including any person deriving legal title under it.
- **"Tenant"** – The party renting the premises, including lawful successors.
- **"Property"** – {{property_description}}
- **"Demised Premises"** – The property together with all fixtures, fittings, and the land on which it is built.

**WHEREAS** the Landlord is the absolute owner of the property and desires to rent it;

**WHEREAS** the Tenant agrees to occupy the demised premises for residential purposes on the terms below;

**NOW THEREFORE**, both parties hereby agree as follows:

---

## 2. TERM OF TENANCY

The Landlord rents and the Tenant accepts the demised premises, including all fixtures and fittings (as per the **Rental Condition Checklist – Schedule 1** and **Property Inventory – Schedule 2**), for a period of {{lease_period}}, commencing on **{{start_date}}** and ending on **{{end_date}}**.

---

## 3. RENT

**3.1 Monthly Rent:** The monthly rent is **{{rent_amount}} {{currency}}**, payable in advance on the **{{payment_due_day}}** day of each calendar month.

**3.2 Handover:** Handover of possession shall occur only after both parties complete and sign the Rental Unit Condition Report.

---

## 4. SECURITY DEPOSIT

**4.1 Deposit Amount:** The Landlord acknowledges receipt of a security deposit of **{{deposit_amount}} {{currency}}** on: {{deposit_received_date}}.

**4.2 Deposit Conditions:**

{{deposit_conditions}}

**4.3 Keys and Access:**

- All keys/remotes/key cards must be returned at lease termination.
- Missing Key: {{key_replacement_cost}} per key
- Missing Remote: {{remote_replacement_cost}} per remote
- Missing Key Card: {{keycard_replacement_cost}} per card

**4.4 Additional Conditions:**

- Tenant must notify Landlord in writing for absences exceeding 3 weeks.
- Annual inspection will be conducted jointly using the Rental Unit Condition Report.
- No pets allowed (unless specified): {{pets_allowed}}
- Maximum occupancy: {{max_occupancy}} persons.
- Tenant shall not alter the structure of the property or erect any temporary/permanent structures.

---

## 5. SERVICES & UTILITIES

The Tenant shall pay all utility bills including electricity and water for the duration of the tenancy and must settle any outstanding bills upon vacating.

---

## 6. USE OF PROPERTY

The property shall be used exclusively for residential purposes. Commercial activities are prohibited without prior written consent from the Landlord.

---

## 7. DISPUTE RESOLUTION

Any dispute between the parties may be referred to the Rent Board for mediation and resolution.

---

## 8. TENANT CARE OBLIGATIONS

**8.1 Maintenance:** The Tenant must maintain ordinary cleanliness, replace burnt bulbs, remove waste, and repair any damage caused by negligence of themselves or visitors (excluding normal wear and tear).

**8.2 Safety:** The Tenant must not store flammable materials or use petrol/kerosene/oil-based appliances.

---

## 9. TENANT BEHAVIOUR

**9.1 General Conduct:**

- The Tenant and guests shall not cause nuisance or disturbance to neighbours or staff.

**9.2 Parking:**

- Vehicles must be parked in the designated common car park. Blocking other tenants' spaces is prohibited.
{{parking_details}}

---

## 10. SUBLETTING

The Tenant is strictly prohibited from subletting, assigning, or transferring possession of the property to any other party.

---

## 11. PRIVACY & LANDLORD ACCESS

The Landlord may access the premises:
- To show the property to prospective tenants/buyers (with notice)
- In emergencies
- With 24-hour prior written notice, during daylight hours
- On the day of vacating, for the final inspection
- If the Landlord believes the premises have been abandoned

Entry is permitted anytime with the Tenant's consent.

---

## 12. LATE PAYMENT PENALTIES

**12.1** Rent not paid by the {{payment_due_day}} of the month incurs a late fee of {{late_fee_first_day}} for the first day.

**12.2** A further penalty of {{late_fee_additional}} per additional day the rent remains unpaid.

**12.3** Dishonoured cheque or failed automatic transfer: {{dishonour_fee}} per occurrence.

---

## 13. LIABILITY & INSURANCE

**13.1** The Landlord is not liable for damage to tenant property (including vehicles) from water, electrical faults, leaks, weather, or actions of other occupants.

**13.2** The Landlord shall repair electrical/mechanical breakdowns with reasonable diligence but is not responsible for discomfort during repair time.

**13.3** Tenant must report defects immediately.

**13.4** Tenant is liable for damage caused by water taps left running or gas leaks caused by negligence.

---

## 14. LANDLORD OBLIGATIONS

**14.1** The Landlord shall replace fixtures/furniture destroyed due to fire.

**14.2** The Landlord shall repair defects that interfere with the Tenant's peaceful enjoyment of the premises.

---

## 15. RENEWAL OF TENANCY

The tenancy will automatically renew for another one-year term unless either party gives one (1) month written notice before the expiry date.

---

## 16. TERMINATION

**16.1 Notice Period:** Either party may terminate the tenancy by giving one (1) month written notice.

**16.2 Payment During Notice:** The Tenant must pay rent during the notice period. The security deposit may be applied toward final rent if mutually agreed.

**16.3 Immediate Termination:** The Landlord may issue a 3-day termination notice if the Tenant:

- Repeatedly violates behaviour rules (Clause 9), or
- Fails to pay rent (Clause 3.1)

---

## 17. HANDING OVER POSSESSION

The Tenant must vacate the premises upon termination or expiry, leaving the premises clean and in good condition. Damages will be deducted from the security deposit. Any excess cost beyond the deposit shall be paid by the Tenant.

---

## 18. SCHEDULES

This agreement includes the following schedules which form an integral part of this agreement:

- **Schedule 1:** Rental Property Condition Checklist (Move-In Inspection)
- **Schedule 2:** Property Inventory List

---

{{additional_terms}}

---

## SIGNATURES

**Date of Agreement:** {{agreement_date}}

---

### Landlord/Landlord's Representative:

**Name:** {{landlord_signature_name}}  
**For and on behalf of:** {{landlord_entity}}  
**Signature:** _____________________________  
**Date:** _____________

---

### Tenant:

**Name:** {{tenant_signature_name}}  
**Signature:** _____________________________  
**Date:** _____________

---

### Witness:

**Name:** _____________________________  
**Signature:** _____________________________  
**Date:** _____________

---

*Generated on: {{generation_date}}*  
*This document is a legally binding agreement between the parties*
`;

export interface TenancyAgreementData {
  agreement_date: string;
  landlord_name: string;
  landlord_address: string;
  landlord_representative: string;
  landlord_entity: string;
  landlord_signature_name: string;
  tenant_name: string;
  tenant_signature_name: string;
  tenant_address: string;
  passport_details: string;
  property_description: string;
  lease_period: string;
  start_date: string;
  end_date: string;
  rent_amount: string;
  currency: string;
  payment_due_day: string;
  deposit_amount: string;
  deposit_received_date: string;
  deposit_conditions: string;
  key_replacement_cost: string;
  remote_replacement_cost: string;
  keycard_replacement_cost: string;
  pets_allowed: string;
  max_occupancy: string;
  parking_details: string;
  late_fee_first_day: string;
  late_fee_additional: string;
  dishonour_fee: string;
  additional_terms: string;
  generation_date: string;
}

export function fillTenancyAgreementTemplate(
  template: string,
  data: TenancyAgreementData
): string {
  let filled = template;
  
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    filled = filled.split(placeholder).join(value || 'N/A');
  });
  
  return filled;
}
