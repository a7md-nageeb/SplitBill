import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bill, Participant, ParticipantShareSummary } from '../domain/types';
import type { LocalItem } from '../context/BillContext';

const STORAGE_KEY = 'splitbill:bills:v2'; // Bumped version for new schema

export interface StoredBillRecord {
  id: string;
  createdAt: string;
  bill: Bill;
  participants: Participant[];
  participantSummaries: ParticipantShareSummary[];
  localItems?: LocalItem[];
}

async function readAll(): Promise<StoredBillRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredBillRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

async function writeAll(records: StoredBillRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function addBillToHistory(record: StoredBillRecord): Promise<void> {
  const all = await readAll();
  const withoutDuplicate = all.filter((r) => r.id !== record.id);
  const next = [record, ...withoutDuplicate];
  await writeAll(next);
}

export async function getBillHistory(): Promise<StoredBillRecord[]> {
  const all = await readAll();
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getBillFromHistory(
  id: string,
): Promise<StoredBillRecord | undefined> {
  const all = await readAll();
  return all.find((r) => r.id === id);
}

export async function removeBillFromHistory(id: string): Promise<void> {
  const all = await readAll();
  const next = all.filter((r) => r.id !== id);
  await writeAll(next);
}

