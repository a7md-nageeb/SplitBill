import { Text, TextInput } from '../components/Typography';
import {
  useFocusEffect,
  useNavigation } from '@react-navigation/native';
import { useCallback,
  useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';;
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getBillHistory, type StoredBillRecord } from '../storage/history';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HistoryList'>;

export function HistoryListScreen() {
  const navigation = useNavigation<Nav>();
  const [records, setRecords] = useState<StoredBillRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getBillHistory();
    setRecords(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }: { item: StoredBillRecord }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigation.navigate('HistoryDetail', {
            record: item,
          })
        }
      >
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.bill.title}</Text>
          <Text style={styles.rowMeta}>
            {formattedDate} · {item.participants.length} people
          </Text>
        </View>
        <Text style={styles.rowAmount}>
          {item.bill.total.toFixed(2)}
          {' EGP'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2CC75C" />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No saved bills yet</Text>
          <Text style={styles.emptySubtitle}>
            Save a bill from the summary screen to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A0A0A2',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  rowMain: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  rowMeta: {
    fontSize: 12,
    color: '#7D7D80',
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2CC75C',
  },
});

