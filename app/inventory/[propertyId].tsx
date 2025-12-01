import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Package, Plus, History, Trash2, Edit, AlertCircle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { PropertyItem, InventoryHistory, InventoryChangeReason, InventoryPaidBy } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

export default function InventoryScreen() {
  const { propertyId, unitId } = useLocalSearchParams();
  const {
    properties, units, propertyItems, addPropertyItem, updatePropertyItem, deletePropertyItem,
    inventoryHistory, addInventoryHistory, tenantRenters, leases
  } = useApp();

  const property = properties.find(p => p.id === propertyId);
  const unit = unitId ? units.find(u => u.id === unitId) : undefined;
  
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [historyModalVisible, setHistoryModalVisible] = useState<boolean>(false);
  const [changeModalVisible, setChangeModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<PropertyItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'appliance' as 'appliance' | 'furniture' | 'fixture' | 'accessory' | 'other',
    quantity: '1',
    condition: 'new' as 'new' | 'excellent' | 'good' | 'fair' | 'poor',
    value: '',
    replacement_cost: '',
    serial_number: '',
    model_number: '',
    notes: '',
  });

  const [changeFormData, setChangeFormData] = useState({
    action: 'replaced' as 'added' | 'replaced' | 'repaired' | 'removed' | 'condition_changed',
    reason: 'replacement_damage' as InventoryChangeReason,
    tenant_renter_id: '',
    new_condition: 'new' as 'new' | 'excellent' | 'good' | 'fair' | 'poor',
    cost: '',
    paid_by: 'landlord' as InventoryPaidBy,
    deducted_from_deposit: false,
    quantity_after: '1',
    notes: '',
  });

  const items = propertyItems.filter(item =>
    item.property_id === propertyId && (unitId ? item.unit_id === unitId : true)
  );

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenantRenters.find(t => t.id === tenantId);
    if (!tenant) return 'Unknown Tenant';
    if (tenant.type === 'business') return tenant.business_name || 'Unnamed Business';
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed';
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      category: 'appliance',
      quantity: '1',
      condition: 'new',
      value: '',
      replacement_cost: '',
      serial_number: '',
      model_number: '',
      notes: '',
    });
    setAddModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !property) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    console.log('[INVENTORY] Adding new item:', formData.name, 'to property:', property.id);

    const newItem = await addPropertyItem({
      property_id: property.id,
      unit_id: unitId ? String(unitId) : undefined,
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      condition: formData.condition,
      value: formData.value ? parseFloat(formData.value) : undefined,
      replacement_cost: formData.replacement_cost ? parseFloat(formData.replacement_cost) : undefined,
      serial_number: formData.serial_number || undefined,
      model_number: formData.model_number || undefined,
      notes: formData.notes || undefined,
    });

    if (newItem) {
      await addInventoryHistory({
        property_item_id: newItem.id,
        property_id: property.id,
        unit_id: unitId ? String(unitId) : undefined,
        action: 'added',
        reason: 'initial_provision',
        new_condition: formData.condition,
        quantity_after: parseInt(formData.quantity) || 1,
        notes: `Initial provision: ${formData.name}`,
      });
      console.log('[INVENTORY] Item added with initial history record');
      Alert.alert('Success', 'Item added to inventory successfully');
    }

    setAddModalVisible(false);
  };

  const handleViewHistory = (item: PropertyItem) => {
    setSelectedItem(item);
    setHistoryModalVisible(true);
  };

  const handleRecordChange = (item: PropertyItem) => {
    setSelectedItem(item);
    setChangeFormData({
      action: 'replaced',
      reason: 'replacement_damage',
      tenant_renter_id: '',
      new_condition: item.condition,
      cost: '',
      paid_by: 'landlord',
      deducted_from_deposit: false,
      quantity_after: item.quantity.toString(),
      notes: '',
    });
    setChangeModalVisible(true);
  };

  const handleSaveChange = async () => {
    if (!selectedItem) return;

    const activeLease = leases.find(l =>
      l.unit_id === selectedItem.unit_id &&
      l.status === 'active'
    );

    await addInventoryHistory({
      property_item_id: selectedItem.id,
      property_id: selectedItem.property_id,
      unit_id: selectedItem.unit_id,
      tenant_renter_id: changeFormData.tenant_renter_id || activeLease?.tenant_renter_id,
      lease_id: activeLease?.id,
      action: changeFormData.action,
      reason: changeFormData.reason,
      previous_condition: selectedItem.condition,
      new_condition: changeFormData.new_condition,
      cost: changeFormData.cost ? parseFloat(changeFormData.cost) : undefined,
      paid_by: changeFormData.paid_by,
      deducted_from_deposit: changeFormData.deducted_from_deposit,
      quantity_before: selectedItem.quantity,
      quantity_after: parseInt(changeFormData.quantity_after) || selectedItem.quantity,
      notes: changeFormData.notes || undefined,
    });

    await updatePropertyItem(selectedItem.id, {
      condition: changeFormData.new_condition,
      quantity: parseInt(changeFormData.quantity_after) || selectedItem.quantity,
    });

    setChangeModalVisible(false);
    Alert.alert('Success', 'Change recorded successfully');
  };

  const handleDelete = (item: PropertyItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePropertyItem(item.id);
            Alert.alert('Success', 'Item deleted');
          },
        },
      ]
    );
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
      case 'excellent':
        return '#34C759';
      case 'good':
        return '#007AFF';
      case 'fair':
        return '#FF9500';
      case 'poor':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const renderItem = ({ item }: { item: PropertyItem }) => {
    const itemHistory = inventoryHistory.filter(h => h.property_item_id === item.id);
    const lastChange = itemHistory.sort((a, b) =>
      new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
    )[0];

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemIcon}>
            <Package size={20} color="#007AFF" />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemMeta}>
              <Badge label={item.category} variant="info" />
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition</Text>
            <Text style={[styles.detailValue, { color: getConditionColor(item.condition) }]}>
              {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
            </Text>
          </View>
          {item.replacement_cost && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Replacement Cost</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.replacement_cost)}</Text>
            </View>
          )}
          {item.serial_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial Number</Text>
              <Text style={styles.detailValue}>{item.serial_number}</Text>
            </View>
          )}
        </View>

        {lastChange && (
          <View style={styles.lastChange}>
            <AlertCircle size={14} color="#666" />
            <Text style={styles.lastChangeText}>
              Last changed: {formatDate(lastChange.performed_at)} ({lastChange.reason.replace('_', ' ')})
            </Text>
          </View>
        )}

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewHistory(item)}
          >
            <History size={16} color="#007AFF" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRecordChange(item)}
          >
            <Edit size={16} color="#007AFF" />
            <Text style={styles.actionText}>Record Change</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderHistoryItem = ({ item }: { item: InventoryHistory }) => (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Badge
          label={item.action}
          variant={item.action === 'removed' ? 'danger' : 'info'}
        />
        <Text style={styles.historyDate}>{formatDate(item.performed_at)}</Text>
      </View>

      <View style={styles.historyDetails}>
        <Text style={styles.historyReason}>
          {item.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Text>
        {item.tenant_renter_id && (
          <Text style={styles.historyTenant}>
            Tenant: {getTenantName(item.tenant_renter_id)}
          </Text>
        )}
        {item.cost && (
          <View style={styles.historyCost}>
            <Text style={styles.historyCostLabel}>Cost: {formatCurrency(item.cost)}</Text>
            {item.paid_by && (
              <Badge
                label={item.paid_by.replace('_', ' ')}
                variant={item.paid_by === 'tenant_deposit' || item.paid_by === 'tenant_direct' ? 'warning' : 'success'}
              />
            )}
          </View>
        )}
        {item.previous_condition && item.new_condition && (
          <Text style={styles.historyCondition}>
            Condition: {item.previous_condition} → {item.new_condition}
          </Text>
        )}
        {item.notes && (
          <Text style={styles.historyNotes}>{item.notes}</Text>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: unit ? `Inventory - Unit ${unit.unit_number}` : `Inventory - ${property?.name || 'Property'}`,
          headerRight: () => (
            <TouchableOpacity onPress={handleAdd} style={styles.headerButton}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Inventory Items"
          message="Add items to track inventory for this location"
          actionLabel="Add Item"
          onAction={handleAdd}
          testID="inventory-empty"
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        title="Add Inventory Item"
        testID="add-item-modal"
      >
        <Input
          label="Item Name"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
          placeholder="e.g., Refrigerator"
          required
          testID="item-name-input"
        />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categorySelector}>
            {(['appliance', 'furniture', 'fixture', 'accessory', 'other'] as const).map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.selectorItem,
                  formData.category === category && styles.selectorItemActive
                ]}
                onPress={() => setFormData({ ...formData, category })}
              >
                <Text style={[
                  styles.selectorText,
                  formData.category === category && styles.selectorTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <Input
            label="Quantity"
            value={formData.quantity}
            onChangeText={text => setFormData({ ...formData, quantity: text })}
            placeholder="1"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="item-quantity-input"
          />
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Condition</Text>
            <View style={styles.conditionSelector}>
              {(['new', 'excellent', 'good', 'fair', 'poor'] as const).map(condition => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.conditionItem,
                    formData.condition === condition && styles.conditionItemActive
                  ]}
                  onPress={() => setFormData({ ...formData, condition })}
                >
                  <Text style={[
                    styles.conditionText,
                    formData.condition === condition && styles.conditionTextActive
                  ]}>
                    {condition.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <Input
            label="Value (SCR)"
            value={formData.value}
            onChangeText={text => setFormData({ ...formData, value: text })}
            placeholder="0.00"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            testID="item-value-input"
          />
          <Input
            label="Replacement Cost (SCR)"
            value={formData.replacement_cost}
            onChangeText={text => setFormData({ ...formData, replacement_cost: text })}
            placeholder="0.00"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            testID="item-replacement-cost-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Serial Number"
            value={formData.serial_number}
            onChangeText={text => setFormData({ ...formData, serial_number: text })}
            placeholder="Optional"
            containerStyle={styles.halfInput}
            testID="item-serial-input"
          />
          <Input
            label="Model Number"
            value={formData.model_number}
            onChangeText={text => setFormData({ ...formData, model_number: text })}
            placeholder="Optional"
            containerStyle={styles.halfInput}
            testID="item-model-input"
          />
        </View>

        <Input
          label="Notes"
          value={formData.notes}
          onChangeText={text => setFormData({ ...formData, notes: text })}
          placeholder="Additional notes"
          multiline
          numberOfLines={2}
          testID="item-notes-input"
        />

        <Button
          title="Add Item"
          onPress={handleSave}
          fullWidth
          testID="save-item-button"
        />
      </Modal>

      <Modal
        visible={changeModalVisible}
        onClose={() => setChangeModalVisible(false)}
        title="Record Inventory Change"
        testID="change-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.currentItemInfo}>
            <Text style={styles.currentItemName}>{selectedItem?.name}</Text>
            <Text style={styles.currentItemDetails}>
              Current: {selectedItem?.quantity} × {selectedItem?.condition}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Action</Text>
            <View style={styles.actionSelector}>
              {(['replaced', 'repaired', 'removed', 'condition_changed'] as const).map(action => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.selectorItem,
                    changeFormData.action === action && styles.selectorItemActive
                  ]}
                  onPress={() => setChangeFormData({ ...changeFormData, action })}
                >
                  <Text style={[
                    styles.selectorText,
                    changeFormData.action === action && styles.selectorTextActive
                  ]}>
                    {action.replace('_', ' ').charAt(0).toUpperCase() + action.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Reason</Text>
            <View style={styles.reasonSelector}>
              {([
                'replacement_damage', 'replacement_wear', 'upgrade', 'repair',
                'tenant_request', 'maintenance', 'other'
              ] as InventoryChangeReason[]).map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonItem,
                    changeFormData.reason === reason && styles.reasonItemActive
                  ]}
                  onPress={() => setChangeFormData({ ...changeFormData, reason })}
                >
                  <Text style={[
                    styles.reasonText,
                    changeFormData.reason === reason && styles.reasonTextActive
                  ]}>
                    {reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Input
              label="New Quantity"
              value={changeFormData.quantity_after}
              onChangeText={text => setChangeFormData({ ...changeFormData, quantity_after: text })}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
              testID="change-quantity-input"
            />
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>New Condition</Text>
              <View style={styles.conditionSelector}>
                {(['new', 'excellent', 'good', 'fair', 'poor'] as const).map(condition => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionItem,
                      changeFormData.new_condition === condition && styles.conditionItemActive
                    ]}
                    onPress={() => setChangeFormData({ ...changeFormData, new_condition: condition })}
                  >
                    <Text style={[
                      styles.conditionText,
                      changeFormData.new_condition === condition && styles.conditionTextActive
                    ]}>
                      {condition.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Input
            label="Cost (SCR)"
            value={changeFormData.cost}
            onChangeText={text => setChangeFormData({ ...changeFormData, cost: text })}
            placeholder="0.00"
            keyboardType="decimal-pad"
            testID="change-cost-input"
          />

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Paid By</Text>
            <View style={styles.paidBySelector}>
              {(['landlord', 'tenant_deposit', 'tenant_direct'] as InventoryPaidBy[]).map(paidBy => (
                <TouchableOpacity
                  key={paidBy}
                  style={[
                    styles.paidByItem,
                    changeFormData.paid_by === paidBy && styles.paidByItemActive
                  ]}
                  onPress={() => setChangeFormData({ ...changeFormData, paid_by: paidBy })}
                >
                  <Text style={[
                    styles.paidByText,
                    changeFormData.paid_by === paidBy && styles.paidByTextActive
                  ]}>
                    {paidBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {changeFormData.paid_by !== 'landlord' && (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setChangeFormData({
                ...changeFormData,
                deducted_from_deposit: !changeFormData.deducted_from_deposit
              })}
            >
              <View style={[
                styles.checkbox,
                changeFormData.deducted_from_deposit && styles.checkboxActive
              ]}>
                {changeFormData.deducted_from_deposit && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Deducted from security deposit</Text>
            </TouchableOpacity>
          )}

          <Input
            label="Notes"
            value={changeFormData.notes}
            onChangeText={text => setChangeFormData({ ...changeFormData, notes: text })}
            placeholder="Additional notes about this change"
            multiline
            numberOfLines={3}
            testID="change-notes-input"
          />

          <Button
            title="Record Change"
            onPress={handleSaveChange}
            fullWidth
            testID="save-change-button"
          />
        </ScrollView>
      </Modal>

      <Modal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        title={`History - ${selectedItem?.name}`}
        testID="history-modal"
      >
        {selectedItem && (
          <FlatList
            data={inventoryHistory
              .filter(h => h.property_item_id === selectedItem.id)
              .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.historyList}
            ListEmptyComponent={
              <EmptyState
                icon={History}
                title="No History"
                message="No changes recorded for this item"
                testID="history-empty"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row' as const,
    marginBottom: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
  },
  itemDetails: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  lastChange: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  lastChangeText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  selectorItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  selectorItemActive: {
    backgroundColor: '#007AFF',
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  conditionSelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  conditionItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  conditionItemActive: {
    backgroundColor: '#007AFF',
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#666',
  },
  conditionTextActive: {
    color: '#FFFFFF',
  },
  currentItemInfo: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
  },
  currentItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  currentItemDetails: {
    fontSize: 13,
    color: '#666',
  },
  actionSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  reasonSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  reasonItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  reasonItemActive: {
    backgroundColor: '#007AFF',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  reasonTextActive: {
    color: '#FFFFFF',
  },
  paidBySelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  paidByItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    alignItems: 'center' as const,
  },
  paidByItemActive: {
    backgroundColor: '#007AFF',
  },
  paidByText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  paidByTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checkboxActive: {
    backgroundColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  historyList: {
    padding: 16,
  },
  historyCard: {
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyDetails: {
    gap: 6,
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  historyTenant: {
    fontSize: 13,
    color: '#666',
  },
  historyCost: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  historyCostLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  historyCondition: {
    fontSize: 13,
    color: '#666',
  },
  historyNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
});
