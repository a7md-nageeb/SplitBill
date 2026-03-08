import { Text, TextInput } from '../components/Typography';
import {
  useNavigation } from '@react-navigation/native';
import { useMemo,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';;
import { calculateBill } from '../domain/calculation';
import type { Item, ItemShare, Participant } from '../domain/types';

const SERVICE_RATE = 0.12;
const VAT_RATE = 0.14;

export function QuickCalculatorScreen() {
  const navigation = useNavigation();
  const [subtotalInput, setSubtotalInput] = useState('');

  const parsedSubtotal = useMemo(() => {
    const value = parseFloat(subtotalInput.replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }, [subtotalInput]);

  const billResult = useMemo(() => {
    const now = new Date().toISOString();
    const billId = 'quick-bill';
    const participant: Participant = {
      id: 'p-you',
      billId,
      displayName: 'You',
      isPayer: true,
    };

    const item: Item = {
      id: 'item-quick',
      billId,
      label: 'Order',
      price: parsedSubtotal,
      isShared: false,
      createdAt: now,
    };

    const share: ItemShare = {
      id: 'share-quick',
      itemId: item.id,
      participantId: participant.id,
      shareType: 'EQUAL',
      weight: 1,
    };

    return calculateBill({
      billMeta: {
        id: billId,
        title: 'Quick calculation',
        createdAt: now,
        ownerUserId: undefined,
        serviceRate: SERVICE_RATE,
        vatRate: VAT_RATE,
        notes: undefined,
      },
      participants: [participant],
      items: [item],
      itemShares: [share],
    });
  }, [parsedSubtotal]);

  const { bill } = billResult;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Quick Tax Calculator</Text>
        <Text style={styles.caption}>
          Enter the subtotal before 12% service and 14% VAT to see the final
          amount.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Subtotal (before service &amp; VAT)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>EGP</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={subtotalInput}
              onChangeText={setSubtotalInput}
              placeholder="0.00"
              placeholderTextColor="#7D7D80"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Service (12%)</Text>
            <Text style={styles.rowValue}>{bill.serviceAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>VAT (14%)</Text>
            <Text style={styles.rowValue}>{bill.vatAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{bill.total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.helper}>
          This uses the official ETA formula: (S × 1.12) × 1.14.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateBill' as never)}
        >
          <Text style={styles.primaryButtonText}>Split a bill with friends</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#A0A0A2',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  currency: {
    fontSize: 16,
    color: '#A0A0A2',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#F5F5F7',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#111827',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#A0A0A2',
  },
  rowValue: {
    fontSize: 14,
    color: '#E5E5E8',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2CC75C',
  },
  helper: {
    marginTop: 12,
    fontSize: 12,
    color: '#7D7D80',
  },
  primaryButton: {
    marginTop: 24,
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

