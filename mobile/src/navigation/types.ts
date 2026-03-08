import type { Bill, Participant, ParticipantShareSummary } from '../domain/types';
import type { StoredBillRecord } from '../storage/history';

export interface BillMetaInput {
  id: string;
  title: string;
  createdAt: string;
  serviceRate: number;
  vatRate: number;
  notes?: string;
  ownerUserId?: string;
}

export type RootStackParamList = {
  Home: undefined;
  PersonDetail: {
    participantId: string;
  };
  QuickCalculator: undefined;
  CreateBill: undefined;
  BillItems: {
    billMeta: BillMetaInput;
    participants: Participant[];
  };
  BillSummary: {
    bill: Bill;
    participantSummaries: ParticipantShareSummary[];
    participants: Participant[];
  };
  HistoryList: undefined;
  HistoryDetail: {
    record: StoredBillRecord;
  };
};
