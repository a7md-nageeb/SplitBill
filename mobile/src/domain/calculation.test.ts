import { calculateBill } from './calculation';
import type { BillCalculationInput } from './calculation';
import type { Item, ItemShare, Participant } from './types';

function createTestInput(): BillCalculationInput {
  const participants: Participant[] = [
    {
      id: 'p1',
      billId: 'b1',
      displayName: 'You',
      isPayer: true,
    },
    {
      id: 'p2',
      billId: 'b1',
      displayName: 'Friend',
      isPayer: false,
    },
  ];

  const items: Item[] = [
    {
      id: 'i1',
      billId: 'b1',
      label: 'Koshari',
      price: 100,
      isShared: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'i2',
      billId: 'b1',
      label: 'Shared dessert',
      price: 60,
      isShared: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const itemShares: ItemShare[] = [
    {
      id: 's1',
      itemId: 'i1',
      participantId: 'p1',
      shareType: 'EQUAL',
      weight: 1,
    },
    {
      id: 's2',
      itemId: 'i2',
      participantId: 'p1',
      shareType: 'EQUAL',
      weight: 1,
    },
    {
      id: 's3',
      itemId: 'i2',
      participantId: 'p2',
      shareType: 'EQUAL',
      weight: 1,
    },
  ];

  return {
    billMeta: {
      id: 'b1',
      title: 'Test bill',
      createdAt: new Date().toISOString(),
      ownerUserId: 'u1',
      serviceRate: 0.12,
      vatRate: 0.14,
      notes: undefined,
    },
    participants,
    items,
    itemShares,
  };
}

function almostEqual(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) < epsilon;
}

export function runCalculationTests() {
  const input = createTestInput();
  const { bill, participantSummaries } = calculateBill(input);

  if (!almostEqual(bill.subtotal, 160)) {
    throw new Error(`Expected subtotal 160, got ${bill.subtotal}`);
  }

  const expectedService = 160 * 0.12;
  if (!almostEqual(bill.serviceAmount, expectedService)) {
    throw new Error(
      `Expected service ${expectedService}, got ${bill.serviceAmount}`,
    );
  }

  const expectedVat = (160 + expectedService) * 0.14;
  if (!almostEqual(bill.vatAmount, expectedVat)) {
    throw new Error(`Expected VAT ${expectedVat}, got ${bill.vatAmount}`);
  }

  const expectedTotal = (160 * 1.12) * 1.14;
  if (!almostEqual(bill.total, expectedTotal)) {
    throw new Error(`Expected total ${expectedTotal}, got ${bill.total}`);
  }

  if (participantSummaries.length !== 2) {
    throw new Error(
      `Expected 2 participant summaries, got ${participantSummaries.length}`,
    );
  }

  const p1 = participantSummaries.find((p) => p.participantId === 'p1');
  const p2 = participantSummaries.find((p) => p.participantId === 'p2');

  if (!p1 || !p2) {
    throw new Error('Missing participant summaries');
  }

  if (!almostEqual(p1.itemSubtotal, 130)) {
    throw new Error(`Expected p1 item subtotal 130, got ${p1.itemSubtotal}`);
  }

  if (!almostEqual(p2.itemSubtotal, 30)) {
    throw new Error(`Expected p2 item subtotal 30, got ${p2.itemSubtotal}`);
  }

  const sumParticipantTotals = participantSummaries.reduce(
    (sum, s) => sum + s.grandTotal,
    0,
  );

  if (!almostEqual(sumParticipantTotals, bill.total)) {
    throw new Error(
      `Expected participant totals to sum to bill total ${bill.total}, got ${sumParticipantTotals}`,
    );
  }
}

