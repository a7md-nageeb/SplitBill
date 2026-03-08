import { Text, TextInput } from '../components/Typography';
import {
  NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';;
import type { Participant } from '../domain/types';
import type { BillMetaInput, RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateBill'>;

interface LocalParticipant {
  id: string;
  name: string;
  isPayer: boolean;
}

export function CreateBillScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceRateInput, setServiceRateInput] = useState('12');
  const [vatRateInput, setVatRateInput] = useState('14');
  const [participants, setParticipants] = useState<LocalParticipant[]>([
    { id: 'p-you', name: 'You', isPayer: true },
  ]);

  const addParticipant = () => {
    const index = participants.length + 1;
    setParticipants((prev) => [
      ...prev,
      { id: `p-${index}`, name: `Friend ${index}`, isPayer: false },
    ]);
  };

  const updateParticipantName = (id: string, name: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  };

  const selectPayer = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => ({ ...p, isPayer: p.id === id })),
    );
  };

  const handleNext = () => {
    if (!title.trim()) {
      return;
    }

    const serviceRate =
      parseFloat(serviceRateInput.replace(',', '.')) / 100 || 0.12;
    const vatRate = parseFloat(vatRateInput.replace(',', '.')) / 100 || 0.14;

    const billId = `bill-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const billMeta: BillMetaInput = {
      id: billId,
      title: title.trim(),
      createdAt,
      serviceRate,
      vatRate,
      notes: notes.trim() || undefined,
    };

    const domainParticipants: Participant[] = participants.map((p) => ({
      id: p.id,
      billId,
      displayName: p.name.trim() || 'Guest',
      isPayer: p.isPayer,
    }));

    navigation.navigate('BillItems', {
      billMeta,
      participants: domainParticipants,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New bill</Text>
      <Text style={styles.caption}>
        Name your bill, confirm service and VAT, and add who is at the table.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Bill title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Zamalek dinner"
          placeholderTextColor="#7D7D80"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, styles.spacingTopSmall]}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Optional note (table, occasion, etc.)"
          placeholderTextColor="#7D7D80"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.rowGroup}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Service %</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={serviceRateInput}
              onChangeText={setServiceRateInput}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.rowItem}>
            <Text style={styles.label}>VAT %</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={vatRateInput}
              onChangeText={setVatRateInput}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Participants</Text>
        </View>
        {participants.map((p) => (
          <View key={p.id} style={styles.participantRow}>
            <TouchableOpacity
              style={[
                styles.payerBadge,
                p.isPayer && styles.payerBadgeSelected,
              ]}
              onPress={() => selectPayer(p.id)}
            >
              <Text
                style={[
                  styles.payerBadgeText,
                  p.isPayer && styles.payerBadgeTextSelected,
                ]}
              >
                {p.isPayer ? 'Payer' : 'Guest'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.participantInput}
              value={p.name}
              onChangeText={(text) => updateParticipantName(p.id, text)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.secondaryButton} onPress={addParticipant}>
          <Text style={styles.secondaryButtonText}>+ Add person</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Next: Add items</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#A0A0A2',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#A0A0A2',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#141414',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F5F5F7',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  spacingTopSmall: {
    marginTop: 12,
  },
  rowGroup: {
    flexDirection: 'row',
    marginTop: 12,
  },
  rowItem: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E5E8',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantInput: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F5F5F7',
    fontSize: 14,
  },
  payerBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginRight: 8,
  },
  payerBadgeSelected: {
    backgroundColor: '#2CC75C33',
    borderColor: '#2CC75C',
  },
  payerBadgeText: {
    fontSize: 11,
    color: '#A0A0A2',
  },
  payerBadgeTextSelected: {
    color: '#BBF7D0',
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#E5E5E8',
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#2CC75C',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#022C22',
  },
});

