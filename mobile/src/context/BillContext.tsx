import React, { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { calculateBill, type BillCalculationResult } from '../domain/calculation';
import type { Item, ItemShare, Participant, ParticipantShareSummary, BillFee } from '../domain/types';
import { addBillToHistory } from '../storage/history';

// ─── Local types ───────────────────────────────────────────
export interface LocalItem {
    id: string;
    label: string;
    price: number;
    /** participant IDs this item is assigned to */
    assignedTo: string[];
    /** Whether this item was explicitly created as a shared item */
    isShared: boolean;
}

export interface LocalParticipant {
    id: string;
    name: string;
    isPayer: boolean;
}

interface BillState {
    billTitle: string;
    setBillTitle: (t: string) => void;

    fees: BillFee[];
    setFees: React.Dispatch<React.SetStateAction<BillFee[]>>;
    addFee: (name: string, rate: number) => void;
    updateFee: (id: string, updates: Partial<BillFee>) => void;
    removeFee: (id: string) => void;
    toggleFee: (id: string) => void;

    items: LocalItem[];
    addItem: (label: string, price: number) => void;
    addItemForParticipant: (participantId: string, label: string, price: number) => void;
    addItemForParticipants: (participantIds: string[], label: string, price: number) => void;
    addSharedItem: (label: string, price: number) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<Pick<LocalItem, 'label' | 'price' | 'assignedTo'>>) => void;
    toggleItemAssignment: (itemId: string, participantId: string) => void;

    participants: LocalParticipant[];
    addParticipant: (name: string) => void;
    removeParticipant: (id: string) => void;
    renameParticipant: (id: string, name: string) => void;

    /** Reset state and start a new bill (auto-named with date/time) */
    resetBill: () => void;
    /** Save the current bill snapshot to history */
    saveBillToHistory: () => Promise<void>;
    /** Load a saved bill back into context for editing */
    loadBillFromHistory: (record: any) => void;

    /** Computed bill + per-person summaries */
    calculation: BillCalculationResult;
    getParticipantSummary: (participantId: string) => ParticipantShareSummary | undefined;
    getItemsForParticipant: (participantId: string) => LocalItem[];
}

const BillContext = createContext<BillState | null>(null);

export function useBill(): BillState {
    const ctx = useContext(BillContext);
    if (!ctx) throw new Error('useBill must be inside BillProvider');
    return ctx;
}

let _nextItemId = 1;
let _nextParticipantId = 2; // "1" is reserved for "You"
let _nextFeeId = 3;

function formatDateTimeName(): string {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `Bill · ${month} ${day}, ${h}:${minutes} ${ampm}`;
}

export function BillProvider({ children }: { children: ReactNode }) {
    const [billTitle, setBillTitle] = useState(formatDateTimeName());

    // Default initialization of dynamic fees
    const [fees, setFees] = useState<BillFee[]>([
        { id: 'fee-1', name: 'Service', rate: 0.12, isEnabled: true },
        { id: 'fee-2', name: 'VAT', rate: 0.14, isEnabled: true },
    ]);

    const [participants, setParticipants] = useState<LocalParticipant[]>([
        { id: 'p-1', name: 'You', isPayer: true },
    ]);

    const [items, setItems] = useState<LocalItem[]>([]);

    // ── Fee operations ──
    const addFee = useCallback((name: string, rate: number) => {
        setFees(prev => [...prev, { id: `fee-${_nextFeeId++}`, name, rate, isEnabled: true }]);
    }, []);

    const updateFee = useCallback((id: string, updates: Partial<BillFee>) => {
        setFees(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }, []);

    const removeFee = useCallback((id: string) => {
        setFees(prev => prev.filter(f => f.id !== id));
    }, []);

    const toggleFee = useCallback((id: string) => {
        setFees(prev => prev.map(f => f.id === id ? { ...f, isEnabled: !f.isEnabled } : f));
    }, []);

    // ── Item operations ──
    const addItem = useCallback(
        (label: string, price: number) => {
            const id = `item-${_nextItemId++}`;
            setItems((prev) => [
                ...prev,
                {
                    id,
                    label,
                    price,
                    assignedTo: participants.map((p) => p.id), // assign to everyone by default
                    isShared: true,
                },
            ]);
        },
        [participants],
    );

    const addItemForParticipant = useCallback(
        (participantId: string, label: string, price: number) => {
            const id = `item-${_nextItemId++}`;
            setItems((prev) => [
                ...prev,
                { id, label, price, assignedTo: [participantId], isShared: false },
            ]);
        },
        [],
    );

    const addSharedItem = useCallback(
        (label: string, price: number) => {
            const id = `item-${_nextItemId++}`;
            setItems((prev) => [
                ...prev,
                {
                    id,
                    label,
                    price,
                    assignedTo: participants.map((p) => p.id),
                    isShared: true,
                },
            ]);
        },
        [participants],
    );

    const addItemForParticipants = useCallback(
        (participantIds: string[], label: string, price: number) => {
            const id = `item-${_nextItemId++}`;
            setItems((prev) => [
                ...prev,
                { id, label, price, assignedTo: participantIds, isShared: false },
            ]);
        },
        [],
    );

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }, []);

    const updateItem = useCallback(
        (id: string, updates: Partial<Pick<LocalItem, 'label' | 'price' | 'assignedTo'>>) => {
            setItems((prev) =>
                prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
            );
        },
        [],
    );

    const toggleItemAssignment = useCallback(
        (itemId: string, participantId: string) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.id !== itemId) return item;
                    const isAssigned = item.assignedTo.includes(participantId);
                    const next = isAssigned
                        ? item.assignedTo.filter((id) => id !== participantId)
                        : [...item.assignedTo, participantId];
                    // Don't allow empty assignment
                    return next.length > 0 ? { ...item, assignedTo: next } : item;
                }),
            );
        },
        [],
    );

    // ── Participant operations ──
    const addParticipant = useCallback((name: string) => {
        const id = `p-${_nextParticipantId++}`;
        setParticipants((prev) => {
            const currentIds = prev.map((p) => p.id);
            // Only add new participant to explicitly shared items
            setItems((prevItems) =>
                prevItems.map((item) => {
                    if (item.isShared) {
                        return { ...item, assignedTo: [...item.assignedTo, id] };
                    }
                    return item;
                }),
            );
            return [...prev, { id, name, isPayer: false }];
        });
    }, []);

    const removeParticipant = useCallback((id: string) => {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
        // Remove from all item assignments
        setItems((prev) =>
            prev.map((item) => ({
                ...item,
                assignedTo: item.assignedTo.filter((pid) => pid !== id),
            })),
        );
    }, []);

    const renameParticipant = useCallback((id: string, name: string) => {
        setParticipants((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name } : p)),
        );
    }, []);

    // ── Derived calculation ──
    const calculation = useMemo<BillCalculationResult>(() => {
        const now = new Date().toISOString();
        const billId = 'current-bill';

        const domainParticipants: Participant[] = participants.map((p) => ({
            id: p.id,
            billId,
            displayName: p.name,
            isPayer: p.isPayer,
        }));

        const domainItems: Item[] = items
            .filter((i) => i.price > 0)
            .map((i) => ({
                id: i.id,
                billId,
                label: i.label,
                price: i.price,
                isShared: i.assignedTo.length > 1,
                createdAt: now,
            }));

        const itemShares: ItemShare[] = [];
        for (const item of items) {
            if (item.price <= 0) continue;
            for (const pid of item.assignedTo) {
                itemShares.push({
                    id: `share-${item.id}-${pid}`,
                    itemId: item.id,
                    participantId: pid,
                    shareType: 'EQUAL',
                    weight: 1,
                });
            }
        }

        return calculateBill({
            billMeta: {
                id: billId,
                title: billTitle,
                createdAt: now,
                fees,
                ownerUserId: undefined,
                notes: undefined,
            },
            participants: domainParticipants,
            items: domainItems,
            itemShares,
        });
    }, [items, participants, billTitle, fees]);

    const getParticipantSummary = useCallback(
        (participantId: string) =>
            calculation.participantSummaries.find(
                (s) => s.participantId === participantId,
            ),
        [calculation],
    );

    const getItemsForParticipant = useCallback(
        (participantId: string) =>
            items.filter((item) => item.assignedTo.includes(participantId)),
        [items],
    );

    // ── Save current bill to history ──
    const saveBillToHistory = useCallback(async () => {
        const { bill, participantSummaries } = calculation;
        // Only save if there's at least one priced item
        if (bill.subtotal <= 0) return;

        const domainParticipants: Participant[] = participants.map((p) => ({
            id: p.id,
            billId: bill.id,
            displayName: p.name,
            isPayer: p.isPayer,
        }));

        await addBillToHistory({
            id: `bill-${Date.now()}`,
            createdAt: new Date().toISOString(),
            bill,
            participants: domainParticipants,
            participantSummaries,
            localItems: [...items],
        });
    }, [calculation, participants, items]);

    // ── Load a bill from history ──
    const loadBillFromHistory = useCallback((record: any) => {
        setBillTitle(record.bill.title);

        if (record.bill.fees) {
            setFees(record.bill.fees);
        } else {
            // Migration for older records
            setFees([
                { id: 'fee-1', name: 'Service', rate: record.bill.serviceRate || 0.12, isEnabled: record.serviceEnabled ?? true },
                { id: 'fee-2', name: 'VAT', rate: record.bill.vatRate || 0.14, isEnabled: record.taxEnabled ?? true }
            ]);
        }

        // Restore participants
        if (record.participants) {
            setParticipants(record.participants.map((p: any) => ({
                id: p.id,
                name: p.displayName,
                isPayer: p.isPayer || false,
            })));
        }

        // Restore items if available
        if (record.localItems) {
            setItems(record.localItems);

            // Advance IDs to avoid collisions with loaded data
            let maxItemId = 0;
            let maxParticipantId = 0;

            record.localItems.forEach((i: any) => {
                const num = parseInt(i.id.split('-')[1] || '0');
                if (num > maxItemId) maxItemId = num;
            });

            record.participants?.forEach((p: any) => {
                if (p.id.startsWith('p-')) {
                    const num = parseInt(p.id.split('-')[1] || '0');
                    if (num > maxParticipantId) maxParticipantId = num;
                }
            });

            _nextItemId = maxItemId + 1;
            _nextParticipantId = maxParticipantId + 1;
        } else {
            // Older version fallback: we can't easily reconstruct items, so clear them
            setItems([]);
        }

        // Advance Fee ID explicitly so new custom fees don't collide
        _nextFeeId = Math.max(_nextFeeId, ...(record.bill.fees || []).map((f: any) => parseInt(f.id.split('-')[1] || '0'))) + 1;
    }, []);

    // ── Reset to a fresh bill ──
    const resetBill = useCallback(() => {
        // Save the current bill first (fire-and-forget)
        saveBillToHistory().catch(() => { });

        _nextItemId += 100; // avoid ID collisions
        _nextParticipantId += 100;

        setBillTitle(formatDateTimeName());
        setFees([
            { id: 'fee-1', name: 'Service', rate: 0.12, isEnabled: true },
            { id: 'fee-2', name: 'VAT', rate: 0.14, isEnabled: true },
        ]);
        setParticipants([{ id: `p-${_nextParticipantId++}`, name: 'You', isPayer: true }]);
        setItems([]);
    }, [saveBillToHistory]);

    const value: BillState = {
        billTitle,
        setBillTitle,
        fees,
        setFees,
        addFee,
        updateFee,
        removeFee,
        toggleFee,
        items,
        addItem,
        addItemForParticipant,
        addItemForParticipants,
        addSharedItem,
        removeItem,
        updateItem,
        toggleItemAssignment,
        participants,
        addParticipant,
        removeParticipant,
        renameParticipant,
        resetBill,
        saveBillToHistory,
        loadBillFromHistory,
        calculation,
        getParticipantSummary,
        getItemsForParticipant,
    };

    return <BillContext.Provider value={value}>{children}</BillContext.Provider>;
}
