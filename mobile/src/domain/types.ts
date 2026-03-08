export type CurrencyCode = 'EGP';

export interface User {
  id: string;
  name: string;
  phoneOrEmail?: string;
  createdAt: string;
}

export interface BillFee {
  id: string;
  name: string;        // e.g. "Service", "VAT", "Custom Delivery"
  rate: number;        // e.g. 0.12 (12%)
  isEnabled: boolean;
}

export interface Bill {
  id: string;
  ownerUserId?: string;
  title: string;
  createdAt: string;
  currency: CurrencyCode;
  subtotal: number;

  // Dynamic fees array applied sequentially
  fees: BillFee[];

  // Calculated amounts for each fee (key = fee.id, value = amount)
  feesAmounts: Record<string, number>;

  total: number;
  notes?: string;
}

export interface Participant {
  id: string;
  billId: string;
  displayName: string;
  contact?: string;
  isPayer: boolean;
}

export type ItemShareType = 'EQUAL';

export interface Item {
  id: string;
  billId: string;
  label: string;
  price: number;
  isShared: boolean;
  createdAt: string;
}

export interface ItemShare {
  id: string;
  itemId: string;
  participantId: string;
  shareType: ItemShareType;
  /**
   * Weight is reserved for future non-equal splits.
   * For now, it should be 1 for all participants on an item.
   */
  weight: number;
}

export interface ParticipantShareSummary {
  participantId: string;
  itemSubtotal: number;

  // Calculated fee shares for this participant (key = fee.id, value = amount)
  feesShares: Record<string, number>;

  grandTotal: number;
}

