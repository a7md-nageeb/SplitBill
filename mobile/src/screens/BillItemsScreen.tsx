import { Text, TextInput } from '../components/Typography';
import {
  NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo,
  useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';;
import { calculateBill } from '../domain/calculation';
import type { Item, ItemShare } from '../domain/types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BillItems'>;

type AssignmentType = 'SINGLE' | 'ALL' | 'SOME';

interface LocalItem {
  id: string;
  label: string;
  priceInput: string;
  assignmentType: AssignmentType;
  participantIds: string[];
}

export function BillItemsScreen({ route, navigation }: Props) {
  const { billMeta, participants } = route.params;

  const [items, setItems] = useState<LocalItem[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [assignmentType, setAssignmentType] =
    useState<AssignmentType>('ALL');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >(participants.map((p) => p.id));

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = parseFloat(item.priceInput.replace(',', '.')) || 0;
        return sum + price;
      }, 0),
    [items],
  );

  const addItem = () => {
    const parsedPrice = parseFloat(priceInput.replace(',', '.'));
    if (!labelInput.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    const id = `item-${Date.now()}-${items.length + 1}`;

    let participantIds: string[];
    if (assignmentType === 'ALL') {
      participantIds = participants.map((p) => p.id);
    } else if (assignmentType === 'SINGLE') {
      participantIds = [selectedParticipantIds[0] ?? participants[0].id];
    } else {
      participantIds =
        selectedParticipantIds.length > 0
          ? selectedParticipantIds
          : [participants[0].id];
    }

    const newItem: LocalItem = {
      id,
      label: labelInput.trim(),
      priceInput: parsedPrice.toFixed(2),
      assignmentType,
      participantIds,
    };

    setItems((prev) => [...prev, newItem]);
    setLabelInput('');
    setPriceInput('');
  };

  const toggleParticipantForNewItem = (participantId: string) => {
    setSelectedParticipantIds((prev) => {
      if (assignmentType === 'SINGLE') {
        return [participantId];
      }

      if (prev.includes(participantId)) {
        return prev.filter((id) => id !== participantId);
      }
      return [...prev, participantId];
    });
  };

  const buildDomainData = () => {
    const now = new Date().toISOString();
    const domainItems: Item[] = [];
    const itemShares: ItemShare[] = [];

    items.forEach((localItem, index) => {
      const price =
        parseFloat(localItem.priceInput.replace(',', '.')) || 0;
      const item: Item = {
        id: localItem.id,
        billId: billMeta.id,
        label: localItem.label,
        price,
        isShared: localItem.assignmentType !== 'SINGLE',
        createdAt: now,
      };
      domainItems.push(item);

      const participantIds =
        localItem.assignmentType === 'ALL'
          ? participants.map((p) => p.id)
          : localItem.participantIds;

      participantIds.forEach((pid, piIndex) => {
        itemShares.push({
          id: `share-${index}-${piIndex}-${pid}`,
          itemId: item.id,
          participantId: pid,
          shareType: 'EQUAL',
          weight: 1,
        });
      });
    });

    const { bill, participantSummaries } = calculateBill({
      billMeta,
      participants,
      items: domainItems,
      itemShares,
    });

    return { bill, participantSummaries, domainItems, itemShares };
  };

  const goToSummary = () => {
    if (items.length === 0) {
      return;
    }

    const { bill, participantSummaries } = buildDomainData();
    navigation.navigate('BillSummary', {
      bill,
      participantSummaries,
      participants,
    });
  };

  const renderItemRow = ({ item }: { item: LocalItem }) => {
    const price = parseFloat(item.priceInput.replace(',', '.')) || 0;
    let assignmentLabel = 'Shared by all';
    if (item.assignmentType === 'SINGLE') {
      const p = participants.find((pt) => pt.id === item.participantIds[0]);
      assignmentLabel = p ? `For ${p.displayName}` : 'Single person';
    } else if (item.assignmentType === 'SOME') {
      assignmentLabel = `Shared by ${item.participantIds.length}`;
    }

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemMain}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemMeta}>{assignmentLabel}</Text>
        </View>
        <Text style={styles.itemPrice}>{price.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Items</Text>
        <Text style={styles.caption}>
          Add everything on the bill and choose who is sharing each item.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItemRow}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No items yet. Start by adding the first item below.
          </Text>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.sectionTitle}>Add item</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputLabel]}
            placeholder="Item name"
            placeholderTextColor="#7D7D80"
            value={labelInput}
            onChangeText={setLabelInput}
          />
          <TextInput
            style={[styles.input, styles.inputPrice]}
            placeholder="0.00"
            placeholderTextColor="#7D7D80"
            keyboardType="decimal-pad"
            value={priceInput}
            onChangeText={setPriceInput}
          />
        </View>

        <View style={styles.assignmentRow}>
          <TouchableOpacity
            style={[
              styles.assignmentChip,
              assignmentType === 'ALL' && styles.assignmentChipSelected,
            ]}
            onPress={() => setAssignmentType('ALL')}
          >
            <Text
              style={[
                styles.assignmentChipText,
                assignmentType === 'ALL' && styles.assignmentChipTextSelected,
              ]}
            >
              Everyone
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.assignmentChip,
              assignmentType === 'SINGLE' && styles.assignmentChipSelected,
            ]}
            onPress={() => setAssignmentType('SINGLE')}
          >
            <Text
              style={[
                styles.assignmentChipText,
                assignmentType === 'SINGLE' &&
                  styles.assignmentChipTextSelected,
              ]}
            >
              One person
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.assignmentChip,
              assignmentType === 'SOME' && styles.assignmentChipSelected,
            ]}
            onPress={() => setAssignmentType('SOME')}
          >
            <Text
              style={[
                styles.assignmentChipText,
                assignmentType === 'SOME' && styles.assignmentChipTextSelected,
              ]}
            >
              Some people
            </Text>
          </TouchableOpacity>
        </View>

        {(assignmentType === 'SINGLE' || assignmentType === 'SOME') && (
          <View style={styles.participantChipsRow}>
            {participants.map((p) => {
              const selected = selectedParticipantIds.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.personChip,
                    selected && styles.personChipSelected,
                  ]}
                  onPress={() => toggleParticipantForNewItem(p.id)}
                >
                  <Text
                    style={[
                      styles.personChipText,
                      selected && styles.personChipTextSelected,
                    ]}
                  >
                    {p.displayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{subtotal.toFixed(2)} EGP</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Text style={styles.addButtonText}>Add item</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            items.length === 0 && styles.primaryButtonDisabled,
          ]}
          onPress={goToSummary}
          disabled={items.length === 0}
        >
          <Text style={styles.primaryButtonText}>Review per-person totals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  top: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  caption: {
    fontSize: 13,
    color: '#A0A0A2',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#7D7D80',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  itemMain: {
    flex: 1,
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 15,
    color: '#E5E5E8',
  },
  itemMeta: {
    fontSize: 12,
    color: '#7D7D80',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#141414',
    backgroundColor: '#141414',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E8',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F5F5F7',
    fontSize: 14,
  },
  inputLabel: {
    flex: 2,
    marginRight: 8,
  },
  inputPrice: {
    flex: 1,
  },
  assignmentRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  assignmentChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  assignmentChipSelected: {
    backgroundColor: '#2CC75C33',
    borderColor: '#2CC75C',
  },
  assignmentChipText: {
    fontSize: 12,
    color: '#A0A0A2',
  },
  assignmentChipTextSelected: {
    color: '#BBF7D0',
    fontWeight: '600',
  },
  participantChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  personChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  personChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#2CC75C',
  },
  personChipText: {
    fontSize: 12,
    color: '#A0A0A2',
  },
  personChipTextSelected: {
    color: '#F5F5F7',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#A0A0A2',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#55B8DB',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#022C22',
  },
  primaryButton: {
    marginTop: 2,
    backgroundColor: '#2CC75C',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#022C22',
  },
});

