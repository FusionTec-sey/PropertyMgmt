import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { CheckSquare, Square, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react-native';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { MoveInChecklistItem } from '@/types';
import { PhotoPicker } from '@/components/PhotoPicker';

type RoomSection = {
  id: string;
  name: string;
  items: ChecklistItemTemplate[];
};

type ChecklistItemTemplate = {
  name: string;
  category: 'living_room' | 'kitchen' | 'dining_room' | 'bathroom' | 'bedroom' | 'balcony' | 'keys';
};

const CHECKLIST_TEMPLATE: RoomSection[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    items: [
      { name: 'Floor & Floor Covering', category: 'living_room' },
      { name: 'Walls & Ceiling', category: 'living_room' },
      { name: 'Door(s)', category: 'living_room' },
      { name: 'Door Locks & Hardware', category: 'living_room' },
      { name: 'Lighting Fixtures', category: 'living_room' },
      { name: 'Sliding Door & Lock Mechanism', category: 'living_room' },
      { name: 'Sliding Door Coverings', category: 'living_room' },
      { name: 'Smoke Alarm', category: 'living_room' },
      { name: 'Air Conditioning + Remote', category: 'living_room' },
      { name: 'TV Unit', category: 'living_room' },
      { name: 'Desk Unit', category: 'living_room' },
      { name: 'Fan + Remote', category: 'living_room' },
      { name: 'Light Switches / Sockets', category: 'living_room' },
      { name: 'Sofa Set', category: 'living_room' },
      { name: 'TV + Remote', category: 'living_room' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    items: [
      { name: 'Floor & Floor Covering', category: 'kitchen' },
      { name: 'Walls & Ceiling', category: 'kitchen' },
      { name: 'Floor-Mounted Cabinets', category: 'kitchen' },
      { name: 'Wall-Mounted Cabinets', category: 'kitchen' },
      { name: 'Marble Countertop', category: 'kitchen' },
      { name: 'Window & Screen', category: 'kitchen' },
      { name: 'Window Coverings', category: 'kitchen' },
      { name: 'Light Fixtures / Switches / Sockets', category: 'kitchen' },
      { name: 'Stove/Burners & Controls', category: 'kitchen' },
      { name: 'Oven / Range Hood (Inside & Outside)', category: 'kitchen' },
      { name: 'Refrigerator', category: 'kitchen' },
      { name: 'Washing Machine', category: 'kitchen' },
      { name: 'Sink, Mixer Tap & Plumbing', category: 'kitchen' },
      { name: 'Backsplash Tiles', category: 'kitchen' },
      { name: 'Cutlery Set', category: 'kitchen' },
      { name: 'Microwave', category: 'kitchen' },
      { name: 'Dishwasher', category: 'kitchen' },
    ],
  },
  {
    id: 'dining_room',
    name: 'Dining Room',
    items: [
      { name: 'Floor & Floor Covering', category: 'dining_room' },
      { name: 'Walls & Ceiling', category: 'dining_room' },
      { name: 'Lighting Fixtures', category: 'dining_room' },
      { name: 'Air Conditioning + Remote', category: 'dining_room' },
      { name: 'Dining Table & Chairs', category: 'dining_room' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    items: [
      { name: 'Floor & Floor Covering', category: 'bathroom' },
      { name: 'Walls & Ceiling', category: 'bathroom' },
      { name: 'Counters & Surfaces', category: 'bathroom' },
      { name: 'Window(s) & Screen(s)', category: 'bathroom' },
      { name: 'Window Covering(s)', category: 'bathroom' },
      { name: 'Sink & Plumbing', category: 'bathroom' },
      { name: 'Vanity Cabinet + Mirror', category: 'bathroom' },
      { name: 'Shower Glass Cubicle & Accessories', category: 'bathroom' },
      { name: 'Shower Set + Drainage', category: 'bathroom' },
      { name: 'Toilet', category: 'bathroom' },
      { name: 'Light Fixtures', category: 'bathroom' },
      { name: 'Door(s)', category: 'bathroom' },
      { name: 'Door Locks & Hardware', category: 'bathroom' },
      { name: 'Soap Dish, Towel Racks, Toilet Paper Holder, Toilet Brush & Mount', category: 'bathroom' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    items: [
      { name: 'Floor & Floor Covering', category: 'bedroom' },
      { name: 'Walls & Ceiling', category: 'bedroom' },
      { name: 'Window(s) & Screen(s)', category: 'bedroom' },
      { name: 'Window Coverings', category: 'bedroom' },
      { name: 'Sliding Door & Lock Mechanism', category: 'bedroom' },
      { name: 'Sliding Door Coverings', category: 'bedroom' },
      { name: 'Closet(s), Doors & Tracks', category: 'bedroom' },
      { name: 'Lighting Fixtures', category: 'bedroom' },
      { name: 'Smoke Alarm', category: 'bedroom' },
      { name: 'Door(s)', category: 'bedroom' },
      { name: 'Door Locks & Hardware', category: 'bedroom' },
      { name: 'Bed Frame + Headboard', category: 'bedroom' },
      { name: 'Bedside Cabinets', category: 'bedroom' },
      { name: 'Dressing Unit + Mirror', category: 'bedroom' },
      { name: 'Shelves', category: 'bedroom' },
      { name: 'Mattress', category: 'bedroom' },
      { name: 'Air Conditioning + Remote', category: 'bedroom' },
      { name: 'Fan + Remote', category: 'bedroom' },
      { name: 'Light Switches & Sockets', category: 'bedroom' },
    ],
  },
  {
    id: 'balcony',
    name: 'Balcony',
    items: [
      { name: 'Floor & Floor Covering', category: 'balcony' },
      { name: 'Walls & Ceiling', category: 'balcony' },
      { name: 'Aluminium Railings', category: 'balcony' },
      { name: 'Lighting Fixtures', category: 'balcony' },
      { name: 'Sofa Set / Furniture', category: 'balcony' },
    ],
  },
  {
    id: 'keys',
    name: 'Keys & Accessories',
    items: [
      { name: 'Main Door Keys', category: 'keys' },
      { name: 'Bedroom Keys', category: 'keys' },
      { name: 'Bathroom Keys', category: 'keys' },
      { name: 'Gate Remote', category: 'keys' },
      { name: 'Mailbox Keys', category: 'keys' },
    ],
  },
];

export default function ChecklistScreen() {
  const { unitId } = useLocalSearchParams();
  const router = useRouter();
  const { units, properties, tenantRenters, leases, addMoveInChecklist } = useApp();

  const unit = units.find(u => u.id === unitId);
  const property = properties.find(p => p.id === unit?.property_id);
  const activeLease = leases.find(l => l.unit_id === unitId && l.status === 'active');
  const tenant = activeLease ? tenantRenters.find(t => t.id === activeLease.tenant_renter_id) : undefined;

  const [checklistItems, setChecklistItems] = useState<MoveInChecklistItem[]>(
    CHECKLIST_TEMPLATE.flatMap(section =>
      section.items.map((item, index) => ({
        id: `${section.id}_${index}`,
        name: item.name,
        category: item.category as any,
        checked: false,
        condition: 'excellent' as const,
        notes: '',
        images: [],
      }))
    )
  );

  const [expandedSections, setExpandedSections] = useState<string[]>(CHECKLIST_TEMPLATE.map(s => s.id));
  const [overallNotes, setOverallNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const toggleSection = (sectionId: string) => {
    if (expandedSections.includes(sectionId)) {
      setExpandedSections(expandedSections.filter(id => id !== sectionId));
    } else {
      setExpandedSections([...expandedSections, sectionId]);
    }
  };

  const toggleItemCheck = (itemId: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const updateItemCondition = (itemId: string, condition: MoveInChecklistItem['condition']) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, condition } : item
      )
    );
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const updateItemImages = (itemId: string, images: string[]) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, images } : item
      )
    );
  };

  const getSectionProgress = (sectionId: string) => {
    const sectionItems = checklistItems.filter(item =>
      CHECKLIST_TEMPLATE.find(s => s.id === sectionId)?.items.some(template =>
        item.name === template.name
      )
    );
    const checked = sectionItems.filter(item => item.checked).length;
    return { checked, total: sectionItems.length };
  };

  const handleSave = async () => {
    if (!unit || !activeLease || !tenant) {
      Alert.alert('Error', 'Missing unit, lease, or tenant information');
      return;
    }

    setIsSaving(true);
    try {
      await addMoveInChecklist({
        tenant_renter_id: tenant.id,
        unit_id: unit.id,
        lease_id: activeLease.id,
        items: checklistItems,
        overall_condition: 'excellent',
        completed: false,
        notes: overallNotes,
      });

      console.log('[CHECKLIST] Saved draft checklist for unit:', unit.id);
      Alert.alert('Success', 'Checklist saved successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving checklist:', error);
      Alert.alert('Error', 'Failed to save checklist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    const unchecked = checklistItems.filter(item => !item.checked);
    
    if (unchecked.length > 0) {
      Alert.alert(
        'Incomplete Checklist',
        `You have ${unchecked.length} unchecked items. Complete anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              if (!unit || !activeLease || !tenant) return;

              setIsSaving(true);
              try {
                await addMoveInChecklist({
                  tenant_renter_id: tenant.id,
                  unit_id: unit.id,
                  lease_id: activeLease.id,
                  items: checklistItems,
                  overall_condition: 'excellent',
                  completed: true,
                  completed_date: new Date().toISOString(),
                  notes: overallNotes,
                });

                console.log('[CHECKLIST] Completed move-in checklist for unit:', unit.id);
                Alert.alert('Success', 'Move-in checklist completed!', [
                  {
                    text: 'View Inventory',
                    onPress: () => {
                      router.back();
                      router.push(`/inventory/${property?.id}?unitId=${unit.id}` as any);
                    }
                  },
                  {
                    text: 'Done',
                    onPress: () => router.back()
                  }
                ]);
              } catch (error) {
                console.error('Error completing checklist:', error);
                Alert.alert('Error', 'Failed to complete checklist');
              } finally {
                setIsSaving(false);
              }
            },
          },
        ]
      );
    } else {
      if (!unit || !activeLease || !tenant) return;

      setIsSaving(true);
      try {
        await addMoveInChecklist({
          tenant_renter_id: tenant.id,
          unit_id: unit.id,
          lease_id: activeLease.id,
          items: checklistItems,
          overall_condition: 'excellent',
          completed: true,
          completed_date: new Date().toISOString(),
          notes: overallNotes,
        });

        console.log('[CHECKLIST] Completed move-in checklist for unit:', unit.id);
        Alert.alert('Success', 'Move-in checklist completed!', [
          {
            text: 'View Inventory',
            onPress: () => {
              router.back();
              router.push(`/inventory/${property?.id}?unitId=${unit.id}` as any);
            }
          },
          {
            text: 'Done',
            onPress: () => router.back()
          }
        ]);
      } catch (error) {
        console.error('Error completing checklist:', error);
        Alert.alert('Error', 'Failed to complete checklist');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'excellent':
        return '#34C759';
      case 'good':
        return '#007AFF';
      case 'fair':
        return '#FF9500';
      case 'poor':
        return '#FF3B30';
      case 'damaged':
        return '#8E8E93';
      default:
        return '#666';
    }
  };

  if (!unit) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Checklist Not Found' }} />
        <Text style={styles.errorText}>Unit not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Inspection Checklist - Unit ${unit.unit_number}`,
        }}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <Text style={styles.headerTitle}>Property Condition Checklist</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>Property:</Text>
            <Text style={styles.headerValue}>{property?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>Unit:</Text>
            <Text style={styles.headerValue}>{unit.unit_number}</Text>
          </View>
          {tenant && (
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>Tenant:</Text>
              <Text style={styles.headerValue}>
                {tenant.type === 'business'
                  ? tenant.business_name
                  : `${tenant.first_name} ${tenant.last_name}`}
              </Text>
            </View>
          )}
        </Card>

        {CHECKLIST_TEMPLATE.map(section => {
          const progress = getSectionProgress(section.id);
          const isExpanded = expandedSections.includes(section.id);

          return (
            <Card key={section.id} style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionTitle}>{section.name}</Text>
                  <Text style={styles.sectionProgress}>
                    {progress.checked}/{progress.total} completed
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionContent}>
                  {section.items.map((template, index) => {
                    const itemId = `${section.id}_${index}`;
                    const item = checklistItems.find(i => i.id === itemId);
                    if (!item) return null;

                    return (
                      <View key={itemId} style={styles.checklistItem}>
                        <TouchableOpacity
                          style={styles.itemHeader}
                          onPress={() => toggleItemCheck(itemId)}
                        >
                          {item.checked ? (
                            <CheckSquare size={24} color="#007AFF" />
                          ) : (
                            <Square size={24} color="#999" />
                          )}
                          <Text style={styles.itemName}>{item.name}</Text>
                        </TouchableOpacity>

                        <View style={styles.itemDetails}>
                          <Text style={styles.conditionLabel}>Condition:</Text>
                          <View style={styles.conditionButtons}>
                            {(['excellent', 'good', 'fair', 'poor', 'damaged'] as const).map(cond => (
                              <TouchableOpacity
                                key={cond}
                                style={[
                                  styles.conditionButton,
                                  item.condition === cond && {
                                    backgroundColor: getConditionColor(cond),
                                    borderColor: getConditionColor(cond),
                                  },
                                ]}
                                onPress={() => updateItemCondition(itemId, cond)}
                              >
                                <Text
                                  style={[
                                    styles.conditionButtonText,
                                    item.condition === cond && styles.conditionButtonTextActive,
                                  ]}
                                >
                                  {cond.charAt(0).toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {section.id === 'keys' ? (
                          <View style={styles.quantityRow}>
                            <Text style={styles.quantityLabel}>Quantity:</Text>
                            <TextInput
                              style={styles.quantityInput}
                              placeholder="0"
                              placeholderTextColor="#999"
                              value={item.notes}
                              onChangeText={(text: string) => updateItemNotes(itemId, text)}
                              keyboardType="number-pad"
                            />
                          </View>
                        ) : (
                          <TextInput
                            style={styles.notesInput}
                            placeholder="Add notes (optional)"
                            placeholderTextColor="#999"
                            value={item.notes}
                            onChangeText={(text: string) => updateItemNotes(itemId, text)}
                            multiline
                            numberOfLines={2}
                          />
                        )}

                        <PhotoPicker
                          photos={item.images || []}
                          onPhotosChange={(photos: string[]) => updateItemImages(itemId, photos)}
                          maxPhotos={5}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          );
        })}

        <Card style={styles.notesCard}>
          <Text style={styles.notesTitle}>Overall Notes / Comments</Text>
          <TextInput
            style={styles.overallNotesInput}
            placeholder="Add any general observations, damages, or special notes..."
            placeholderTextColor="#999"
            value={overallNotes}
            onChangeText={setOverallNotes}
            multiline
            numberOfLines={5}
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title="Save Draft"
            onPress={handleSave}
            loading={isSaving}
            variant="outline"
            icon={<Save size={20} color="#007AFF" />}
            fullWidth
          />
          <Button
            title="Complete Checklist"
            onPress={handleComplete}
            loading={isSaving}
            icon={<FileText size={20} color="#FFFFFF" />}
            fullWidth
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center' as const,
    marginTop: 40,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  headerInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  headerValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 4,
  },
  sectionProgress: {
    fontSize: 12,
    color: '#666',
  },
  sectionContent: {
    marginTop: 16,
    gap: 16,
  },
  checklistItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  itemDetails: {
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  conditionButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  conditionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  conditionButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#666',
  },
  conditionButtonTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 60,
    textAlignVertical: 'top' as const,
    marginBottom: 12,
  },
  notesCard: {
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  overallNotesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 120,
    textAlignVertical: 'top' as const,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  quantityRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  quantityInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
