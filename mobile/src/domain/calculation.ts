import type {
  Bill,
  Item,
  ItemShare,
  Participant,
  ParticipantShareSummary,
} from './types';

export interface BillCalculationInput {
  billMeta: Omit<
    Bill,
    'subtotal' | 'feesAmounts' | 'total' | 'currency'
  > & {
    currency?: Bill['currency'];
  };
  participants: Participant[];
  items: Item[];
  itemShares: ItemShare[];
}

export interface BillCalculationResult {
  bill: Bill;
  participantSummaries: ParticipantShareSummary[];
}

const SERVICE_RATE_DEFAULT = 0.12;
const VAT_RATE_DEFAULT = 0.14;

const CURRENCY: Bill['currency'] = 'EGP';

/**
 * Round a value to 2 decimal places (piaster precision).
 */
function roundToPiaster(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deterministically distribute any leftover rounding difference across participants.
 * The payer (if present) receives the adjustment first, otherwise the last participant.
 */
function distributeRoundingRemainder(
  summaries: ParticipantShareSummary[],
  targetTotal: number,
  participants: Participant[],
): ParticipantShareSummary[] {
  const currentTotal = roundToPiaster(
    summaries.reduce((sum, s) => sum + s.grandTotal, 0),
  );
  const diff = roundToPiaster(targetTotal - currentTotal);

  if (Math.abs(diff) < 0.005) {
    return summaries;
  }

  const payer = participants.find((p) => p.isPayer);
  const targetParticipantId =
    payer?.id ?? (participants[participants.length - 1]?.id ?? summaries[0]?.participantId);

  return summaries.map((s) =>
    s.participantId === targetParticipantId
      ? { ...s, grandTotal: roundToPiaster(s.grandTotal + diff) }
      : s,
  );
}

export function calculateBill(
  input: BillCalculationInput,
): BillCalculationResult {
  const { billMeta, participants, items, itemShares } = input;

  const subtotal = roundToPiaster(
    items.reduce((sum, item) => sum + item.price, 0),
  );

  // Apply fees sequentially to the running total
  let currentRunningTotal = subtotal;
  const feesAmounts: Record<string, number> = {};

  for (const fee of billMeta.fees || []) {
    if (!fee.isEnabled) {
      feesAmounts[fee.id] = 0;
      continue;
    }
    const amount = roundToPiaster(currentRunningTotal * fee.rate);
    feesAmounts[fee.id] = amount;
    currentRunningTotal = roundToPiaster(currentRunningTotal + amount);
  }

  const total = currentRunningTotal;

  // Build lookup for item shares.
  const sharesByItem: Record<string, ItemShare[]> = {};
  for (const share of itemShares) {
    if (!sharesByItem[share.itemId]) {
      sharesByItem[share.itemId] = [];
    }
    sharesByItem[share.itemId].push(share);
  }

  // Compute item subtotal per participant.
  const itemSubtotalByParticipant: Record<string, number> = {};

  for (const item of items) {
    const shares = sharesByItem[item.id] ?? [];
    if (shares.length === 0) {
      continue;
    }

    const totalWeight = shares.reduce((sum, s) => sum + (s.weight || 1), 0);
    if (totalWeight <= 0) {
      continue;
    }

    for (const share of shares) {
      const weight = share.weight || 1;
      const portion = (item.price * weight) / totalWeight;
      const prev = itemSubtotalByParticipant[share.participantId] ?? 0;
      itemSubtotalByParticipant[share.participantId] = prev + portion;
    }
  }

  const totalAssignedItemSubtotal = Object.values(
    itemSubtotalByParticipant,
  ).reduce((sum, v) => sum + v, 0);

  const participantSummaries: ParticipantShareSummary[] = participants.map(
    (participant) => {
      const rawItemSubtotal = itemSubtotalByParticipant[participant.id] ?? 0;
      const itemSubtotal = roundToPiaster(rawItemSubtotal);

      const feesShares: Record<string, number> = {};
      let totalFeesForParticipant = 0;

      if (totalAssignedItemSubtotal > 0) {
        const ratio = rawItemSubtotal / totalAssignedItemSubtotal;

        for (const fee of billMeta.fees || []) {
          if (!fee.isEnabled) {
            feesShares[fee.id] = 0;
            continue;
          }
          const feeTotalAmount = feesAmounts[fee.id] || 0;
          const participantFeeShare = roundToPiaster(feeTotalAmount * ratio);
          feesShares[fee.id] = participantFeeShare;
          totalFeesForParticipant += participantFeeShare;
        }
      }

      const grandTotal = roundToPiaster(itemSubtotal + totalFeesForParticipant);

      return {
        participantId: participant.id,
        itemSubtotal,
        feesShares,
        grandTotal,
      };
    },
  );

  const adjustedSummaries = distributeRoundingRemainder(
    participantSummaries,
    total,
    participants,
  );

  const bill: Bill = {
    id: billMeta.id,
    ownerUserId: billMeta.ownerUserId,
    title: billMeta.title,
    createdAt: billMeta.createdAt,
    currency: billMeta.currency ?? CURRENCY,
    subtotal,
    fees: billMeta.fees || [],
    feesAmounts,
    total,
    notes: billMeta.notes,
  };

  return {
    bill,
    participantSummaries: adjustedSummaries,
  };
}

