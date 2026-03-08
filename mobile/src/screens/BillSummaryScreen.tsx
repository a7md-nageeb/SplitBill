import { Text, TextInput } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Participant } from '../domain/types';
import type { RootStackParamList } from '../navigation/types';
import { addBillToHistory } from '../storage/history';

type Props = NativeStackScreenProps<RootStackParamList, 'BillSummary'>;

export function BillSummaryScreen({ route }: Props) {
  const { bill, participantSummaries, participants } = route.params;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const findParticipant = (id: string): Participant | undefined =>
    participants.find((p) => p.id === id);

  const renderRow = ({
    item,
  }: {
    item: (typeof participantSummaries)[number];
  }) => {
    const participant = findParticipant(item.participantId);
    const name = participant?.displayName ?? 'Guest';

    return (
      <View style={styles.participantRow}>
        <View>
          <Text style={styles.participantName}>{name}</Text>
          <Text style={styles.participantMeta}>
            Items {item.itemSubtotal.toFixed(2)} · Service{' '}
            {item.serviceShare.toFixed(2)} · VAT {item.vatShare.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.participantTotal}>
          {item.grandTotal.toFixed(2)} EGP
        </Text>
      </View>
    );
  };

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await addBillToHistory({
        id: bill.id,
        createdAt: bill.createdAt,
        bill,
        participants,
        participantSummaries,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{bill.title}</Text>
        <Text style={styles.subtitle}>
          Total {bill.total.toFixed(2)} EGP · Service {(
            bill.serviceRate * 100
          ).toFixed(0)}
          % · VAT {(bill.vatRate * 100).toFixed(0)}%
        </Text>
      </View>

      <View style={styles.billCard}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Subtotal</Text>
          <Text style={styles.billValue}>{bill.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Service</Text>
          <Text style={styles.billValue}>{bill.serviceAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>VAT</Text>
          <Text style={styles.billValue}>{bill.vatAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.billTotalRow}>
          <Text style={styles.billTotalLabel}>Total</Text>
          <Text style={styles.billTotalValue}>
            {bill.total.toFixed(2)} EGP
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          (saved || saving) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={saved || saving}
      >
        <Text style={styles.saveButtonText}>
          {saved ? 'Saved to history' : saving ? 'Saving…' : 'Save this bill'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Who pays what</Text>

      <FlatList
        data={participantSummaries}
        keyExtractor={(item) => item.participantId}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#A0A0A2',
  },
  billCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 13,
    color: '#A0A0A2',
  },
  billValue: {
    fontSize: 14,
    color: '#F5F5F7',
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  billTotalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2CC75C',
  },
  saveButton: {
    backgroundColor: '#55B8DB',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#404041',
  },
  saveButtonText: {
    color: '#F5F5F7',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 16,
    marginHorizontal: 20,
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E8',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F5F5F7',
  },
  participantMeta: {
    fontSize: 12,
    color: '#7D7D80',
    marginTop: 2,
  },
  participantTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FE9F4D',
  },
});

