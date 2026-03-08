import { Text, TextInput } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBill } from '../context/BillContext';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';
import { CustomEditIcon } from '../components/Icons';
import { Feather } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

export function PersonDetailScreen({ route, navigation }: Props) {
    const { participantId } = route.params;
    const {
        participants,
        getParticipantSummary,
        getItemsForParticipant,
        items: allItems,
        renameParticipant,
        removeParticipant,
        toggleItemAssignment,
        calculation,
    } = useBill();

    const participant = participants.find((p) => p.id === participantId);
    const summary = getParticipantSummary(participantId);
    const myItems = getItemsForParticipant(participantId);
    const { bill } = calculation;

    const [isEditingName, setIsEditingName] = useState(false);

    if (!participant || !summary) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Person not found</Text>
            </View>
        );
    }

    const firstLetter = participant.name.charAt(0).toUpperCase();
    const hue =
        participant.name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 360;

    const handleDelete = () => {
        removeParticipant(participantId);
        navigation.goBack();
    };

    const unassignedItems = allItems.filter(
        (i) => !i.assignedTo.includes(participantId),
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* ── Person Header ── */}
            <View style={styles.header}>
                <View
                    style={[
                        styles.avatar,
                        { backgroundColor: `hsla(${hue}, 60%, 50%, 0.15)` },
                    ]}
                >
                    <Text
                        style={[styles.avatarText, { color: `hsl(${hue}, 70%, 65%)` }]}
                    >
                        {firstLetter}
                    </Text>
                </View>

                {isEditingName ? (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={styles.nameInput}
                            value={participant.name}
                            onChangeText={(t) => renameParticipant(participantId, t)}
                            onBlur={() => setIsEditingName(false)}
                            onSubmitEditing={() => setIsEditingName(false)}
                            autoFocus
                            selectTextOnFocus
                        />
                        <TouchableOpacity
                            style={styles.confirmRenameBtn}
                            onPress={() => setIsEditingName(false)}
                            activeOpacity={0.8}
                        >
                            <Feather name="arrow-right" size={16} color="#022C22" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setIsEditingName(true)} activeOpacity={0.7}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>
                                {participant.name}
                            </Text>
                            <CustomEditIcon size={20} color="#5C5C5E" style={{ marginLeft: 8 }} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Total Card ── */}
            <View style={styles.totalCard}>
                <View style={styles.totalCardGlow} />
                <Text style={styles.totalCardLabel}>TOTAL TO PAY</Text>
                <Text style={styles.totalCardAmount}>
                    {summary.grandTotal.toFixed(2)}{' '}
                    <Text style={styles.totalCardCurrency}>EGP</Text>
                </Text>
            </View>

            {/* ── Breakdown ── */}
            <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Items subtotal</Text>
                    <Text style={styles.breakdownValue}>
                        {summary.itemSubtotal.toFixed(2)}
                    </Text>
                </View>
                {bill.fees.map((fee) => {
                    if (!fee.isEnabled) return null;
                    const amount = (summary.feesShares && summary.feesShares[fee.id]) || 0;
                    return (
                        <View key={fee.id} style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>
                                {fee.name} ({Math.round(fee.rate * 100)}%)
                            </Text>
                            <Text style={styles.breakdownValue}>
                                {amount.toFixed(2)}
                            </Text>
                        </View>
                    );
                })}
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownTotalLabel}>Grand total</Text>
                    <Text style={styles.breakdownTotalValue}>
                        {summary.grandTotal.toFixed(2)} EGP
                    </Text>
                </View>
            </View>

            {/* ── Their items ── */}
            <Text style={styles.sectionTitle}>
                {participant.name}'s items ({myItems.length})
            </Text>

            {myItems.map((item) => {
                const sharedCount = item.assignedTo.length;
                const perPersonPrice = item.price / sharedCount;
                return (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemLabel}>{item.label}</Text>
                            <Text style={styles.itemPrice}>
                                {perPersonPrice.toFixed(2)} EGP
                            </Text>
                        </View>
                        {sharedCount > 1 && (
                            <Text style={styles.itemMeta}>
                                Shared with {sharedCount - 1} other
                                {sharedCount - 1 > 1 ? 's' : ''} · Full price{' '}
                                {item.price.toFixed(2)}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={styles.removeItemBtn}
                            onPress={() => toggleItemAssignment(item.id, participantId)}
                        >
                            <Text style={styles.removeItemText}>Unassign</Text>
                        </TouchableOpacity>
                    </View>
                );
            })}

            {myItems.length === 0 && (
                <Text style={styles.emptyText}>No items assigned yet.</Text>
            )}

            {/* ── Unassigned items ── */}
            {unassignedItems.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                        Not assigned to {participant.name}
                    </Text>
                    {unassignedItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.unassignedCard}
                            onPress={() => toggleItemAssignment(item.id, participantId)}
                        >
                            <Text style={styles.unassignedLabel}>{item.label}</Text>
                            <Text style={styles.unassignedPrice}>
                                {item.price.toFixed(2)} EGP
                            </Text>
                            <Text style={styles.assignText}>+ Assign</Text>
                        </TouchableOpacity>
                    ))}
                </>
            )}

            {/* ── Delete Person ── */}
            {participantId !== 'p-1' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Text style={styles.deleteText}>Remove {participant.name}</Text>
                </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
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
        paddingTop: 20,
        paddingBottom: 40,
    },
    errorText: {
        color: '#FF8787',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
        color: '#E5E5E8',
        letterSpacing: -0.3,
    },
    editIcon: {
        fontSize: 18,
        color: '#5C5C5E',
        marginLeft: 10,
    },
    nameInput: {
        flex: 1,
        fontSize: 26,
        fontWeight: '800',
        color: '#E5E5E8',
        borderBottomWidth: 2,
        borderBottomColor: '#2CC75C',
        paddingVertical: 4,
        letterSpacing: -0.3,
    },
    confirmRenameBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2CC75C',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    // Total card
    totalCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2CC75C30',
        marginBottom: 16,
        overflow: 'hidden',
    },
    totalCardGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2CC75C10',
    },
    totalCardLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7CFFA4',
        letterSpacing: 2,
        marginBottom: 8,
    },
    totalCardAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#F5F5F7',
    },
    totalCardCurrency: {
        fontSize: 18,
        color: '#7D7D80',
        fontWeight: '600',
    },

    // Breakdown
    breakdownCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#292929',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#A0A0A2',
    },
    breakdownValue: {
        fontSize: 14,
        color: '#C2C2C6',
        fontWeight: '500',
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: '#292929',
        marginVertical: 8,
    },
    breakdownTotalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E5E5E8',
    },
    breakdownTotalValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2CC75C',
    },

    // Section
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E5E5E8',
        marginBottom: 12,
    },

    // Item card
    itemCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#292929',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#E5E5E8',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F5F5F7',
    },
    itemMeta: {
        fontSize: 12,
        color: '#7D7D80',
        marginTop: 4,
    },
    removeItemBtn: {
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        backgroundColor: '#DD4E4E10',
        borderWidth: 1,
        borderColor: '#DD4E4E40',
    },
    removeItemText: {
        fontSize: 11,
        color: '#FF8787',
        fontWeight: '600',
    },

    emptyText: {
        color: '#5C5C5E',
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 16,
    },

    // Unassigned
    unassignedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#292929',
    },
    unassignedLabel: {
        flex: 1,
        fontSize: 14,
        color: '#A0A0A2',
    },
    unassignedPrice: {
        fontSize: 14,
        color: '#7D7D80',
        marginRight: 12,
    },
    assignText: {
        fontSize: 12,
        color: '#2CC75C',
        fontWeight: '700',
    },

    // Delete
    deleteBtn: {
        marginTop: 32,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DD4E4E40',
        backgroundColor: '#DD4E4E10',
    },
    deleteText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF8787',
    },
});
