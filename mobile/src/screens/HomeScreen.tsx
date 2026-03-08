import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput } from '../components/Typography';
import {
    useNavigation
} from '@react-navigation/native';
import {
    useState,
    useLayoutEffect,
    useCallback,
    useRef
} from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useBill, type LocalItem } from '../context/BillContext';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

export const CustomEditIcon = ({ size = 16, color = '#5C5C5E', style }: any) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
        <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.8787 2.70729C15.0503 1.53572 16.9498 1.53572 18.1213 2.70729L21.2929 5.87887C22.4645 7.05044 22.4645 8.94993 21.2929 10.1215L10.4714 20.943L3.14143 21.9901C2.82984 22.0346 2.51547 21.9299 2.2929 21.7073C2.07034 21.4847 1.96555 21.1704 2.01006 20.8588L3.0572 13.5288L13.8787 2.70729ZM16.7071 4.12151C16.3166 3.73098 15.6834 3.73098 15.2929 4.12151L14.4142 5.00019L19 9.58597L19.8787 8.70729C20.2692 8.31677 20.2692 7.6836 19.8787 7.29308L16.7071 4.12151ZM17.5858 11.0002L13 6.4144L5.41422 14.0002L10 18.586L17.5858 11.0002ZM7.87869 19.2931L4.70712 16.1215L4.17852 19.8217L7.87869 19.2931Z"
            fill={color}
        />
    </Svg>
);

// ─── Add Item Bottom Sheet ────────────────────────────────
function AddItemSheet({
    visible,
    targetLabel,
    isShared,
    participants,
    defaultLabel,
    onAdd,
    onClose,
    onRequestMakeShared,
}: {
    visible: boolean;
    targetLabel: string;
    isShared: boolean;
    participants: { id: string; name: string }[];
    defaultLabel: string;
    onAdd: (label: string, price: number, selectedIds: string[]) => void;
    onClose: () => void;
    onRequestMakeShared: () => void;
}) {
    const [label, setLabel] = useState('');
    const [priceText, setPriceText] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Reset selected IDs whenever sheet opens
    const prevVisible = useRef(false);
    if (visible && !prevVisible.current) {
        setTimeout(() => setSelectedIds(participants.map((p) => p.id)), 0);
    }
    prevVisible.current = visible;

    const toggleParticipant = (id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                // Don't allow deselecting everyone
                if (prev.length <= 1) return prev;
                return prev.filter((pid) => pid !== id);
            }
            return [...prev, id];
        });
    };

    const handleAdd = () => {
        const parsed = parseFloat(priceText.replace(',', '.'));
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        const ids = isShared ? selectedIds : [];
        onAdd(label.trim() || defaultLabel, parsed, ids);
        setLabel('');
        setPriceText('');
        setSelectedIds([]);
        onClose();
    };

    const handleClose = () => {
        setLabel('');
        setPriceText('');
        setSelectedIds([]);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={sheetStyles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%' }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={sheetStyles.sheet}
                        onPress={() => { }}
                    >
                        <View style={sheetStyles.handle} />
                        <View style={sheetStyles.headerRow}>
                            <Text style={[sheetStyles.title, { marginBottom: 0 }]}>
                                Add item {targetLabel ? `for ${targetLabel}` : ''}
                            </Text>
                            {!isShared && participants.length > 1 && (
                                <TouchableOpacity onPress={onRequestMakeShared}>
                                    <Text style={sheetStyles.makeSharedText}>Make shared</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Participant chips for shared items */}
                        {isShared && (
                            <View style={sheetStyles.chipsSection}>
                                <Text style={sheetStyles.inputLabel}>Splitting between</Text>
                                <View style={sheetStyles.chipsRow}>
                                    {participants.map((p) => {
                                        const selected = selectedIds.includes(p.id);
                                        return (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={[
                                                    sheetStyles.chip,
                                                    selected && sheetStyles.chipActive,
                                                ]}
                                                onPress={() => toggleParticipant(p.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        sheetStyles.chipText,
                                                        selected && sheetStyles.chipTextActive,
                                                    ]}
                                                >
                                                    {p.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        <Text style={sheetStyles.inputLabel}>Name (optional)</Text>
                        <TextInput
                            style={sheetStyles.input}
                            placeholder={defaultLabel}
                            placeholderTextColor="#5C5C5E"
                            value={label}
                            onChangeText={setLabel}
                        />

                        <Text style={sheetStyles.inputLabel}>Price *</Text>
                        <View style={sheetStyles.priceRow}>
                            <Text style={sheetStyles.currency}>EGP</Text>
                            <TextInput
                                style={sheetStyles.priceInput}
                                placeholder="0.00"
                                placeholderTextColor="#5C5C5E"
                                keyboardType="decimal-pad"
                                value={priceText}
                                onChangeText={setPriceText}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                sheetStyles.addBtn,
                                (!priceText || parseFloat(priceText) <= 0) && sheetStyles.addBtnDisabled,
                            ]}
                            onPress={handleAdd}
                            activeOpacity={0.8}
                        >
                            <Text style={sheetStyles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
}

// ─── Edit Item Bottom Sheet ───────────────────────────────
function EditItemSheet({
    visible,
    item,
    participants,
    onSave,
    onRemove,
    onClose,
}: {
    visible: boolean;
    item: LocalItem | null;
    participants: { id: string; name: string }[];
    onSave: (id: string, label: string, price: number, selectedIds: string[]) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
}) {
    const [label, setLabel] = useState('');
    const [priceText, setPriceText] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const prevVisible = useRef(false);
    if (visible && !prevVisible.current && item) {
        // Initialize state when sheet opens
        setTimeout(() => {
            setLabel(item.label);
            setPriceText(item.price.toString());
            setSelectedIds(item.assignedTo);
        }, 0);
    }
    prevVisible.current = visible;

    const toggleParticipant = (id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                // Don't allow deselecting everyone
                if (prev.length <= 1) return prev;
                return prev.filter((pid) => pid !== id);
            }
            return [...prev, id];
        });
    };

    const handleSave = () => {
        if (!item) return;
        const parsed = parseFloat(priceText.replace(',', '.'));
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        onSave(item.id, label.trim() || `Item`, parsed, selectedIds);
        handleClose();
    };

    const handleClose = () => {
        setLabel('');
        setPriceText('');
        setSelectedIds([]);
        onClose();
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={sheetStyles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%' }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={sheetStyles.sheet}
                        onPress={() => { }}
                    >
                        <View style={sheetStyles.handle} />
                        <View style={sheetStyles.headerRow}>
                            <Text style={[sheetStyles.title, { marginBottom: 0 }]}>Edit item</Text>
                            <TouchableOpacity onPress={() => { onRemove(item.id); handleClose(); }}>
                                <Text style={sheetStyles.removeText}>Remove</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={sheetStyles.chipsSection}>
                            <Text style={sheetStyles.inputLabel}>Splitting between</Text>
                            <View style={sheetStyles.chipsRow}>
                                {participants.map((p) => {
                                    const selected = selectedIds.includes(p.id);
                                    return (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[
                                                sheetStyles.chip,
                                                selected && sheetStyles.chipActive,
                                            ]}
                                            onPress={() => toggleParticipant(p.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    sheetStyles.chipText,
                                                    selected && sheetStyles.chipTextActive,
                                                ]}
                                            >
                                                {p.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <Text style={sheetStyles.inputLabel}>Name *</Text>
                        <TextInput
                            style={sheetStyles.input}
                            placeholder="Item name"
                            placeholderTextColor="#5C5C5E"
                            value={label}
                            onChangeText={setLabel}
                        />

                        <Text style={sheetStyles.inputLabel}>Price *</Text>
                        <View style={sheetStyles.priceRow}>
                            <Text style={sheetStyles.currency}>EGP</Text>
                            <TextInput
                                style={sheetStyles.priceInput}
                                placeholder="0.00"
                                placeholderTextColor="#5C5C5E"
                                keyboardType="decimal-pad"
                                value={priceText}
                                onChangeText={setPriceText}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                sheetStyles.addBtn,
                                (!priceText || parseFloat(priceText) <= 0) && sheetStyles.addBtnDisabled,
                            ]}
                            onPress={handleSave}
                            activeOpacity={0.8}
                        >
                            <Text style={sheetStyles.addBtnText}>Save changes</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
}

const sheetStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    removeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF8787',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    makeSharedText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#69D3F8',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    sheet: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#404041',
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F5F5F7',
        marginBottom: 20,
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7D7D80',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#141414',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#292929',
        padding: 14,
        fontSize: 16,
        color: '#E5E5E8',
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141414',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#292929',
        paddingHorizontal: 14,
        marginBottom: 24,
    },
    currency: {
        fontSize: 14,
        color: '#7D7D80',
        fontWeight: '600',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: '#E5E5E8',
    },
    addBtn: {
        backgroundColor: '#2CC75C',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    addBtnDisabled: {
        backgroundColor: '#404041',
    },
    addBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#022C22',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    chipsSection: {
        marginBottom: 16,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#404041',
        backgroundColor: '#141414',
    },
    chipActive: {
        backgroundColor: '#2CC75C18',
        borderColor: '#2CC75C',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7D7D80',
    },
    chipTextActive: {
        color: '#86EFAC',
    },
});

// ─── Person Card (with items inside) ─────────────────────
function PersonCard({
    participant,
    onAddItem,
    onEditItem,
    onPress,
}: {
    participant: { id: string; name: string };
    onAddItem: () => void;
    onEditItem: (item: LocalItem) => void;
    onPress: () => void;
}) {
    const { getParticipantSummary, getItemsForParticipant, renameParticipant } = useBill();
    const summary = getParticipantSummary(participant.id);
    const myItems = getItemsForParticipant(participant.id);
    const total = summary?.grandTotal ?? 0;

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(participant.name);

    const hue =
        participant.name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
    const firstLetter = participant.name.charAt(0).toUpperCase();

    const handleNameSubmit = () => {
        const trimmed = editName.trim();
        if (trimmed) {
            renameParticipant(participant.id, trimmed);
        } else {
            setEditName(participant.name);
        }
        setIsEditing(false);
    };

    return (
        <TouchableOpacity
            style={personStyles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header row: avatar + name + add button */}
            <View style={personStyles.headerRow}>
                <View
                    style={[
                        personStyles.avatar,
                        { backgroundColor: `hsla(${hue}, 60%, 50%, 0.2)` },
                    ]}
                >
                    <Text
                        style={[personStyles.avatarText, { color: `hsl(${hue}, 70%, 65%)` }]}
                    >
                        {firstLetter}
                    </Text>
                </View>
                {isEditing ? (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={personStyles.nameInput}
                            value={editName}
                            onChangeText={setEditName}
                            onBlur={handleNameSubmit}
                            onSubmitEditing={handleNameSubmit}
                            autoFocus
                            selectTextOnFocus
                        />
                        <TouchableOpacity
                            style={personStyles.confirmRenameBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleNameSubmit();
                            }}
                            activeOpacity={0.8}
                        >
                            <Feather name="arrow-right" size={16} color="#022C22" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                        onPress={(e) => {
                            e.stopPropagation();
                            setEditName(participant.name);
                            setIsEditing(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={[personStyles.name, { flex: 0, flexShrink: 1 }]} numberOfLines={1}>
                            {participant.name}
                        </Text>
                        <CustomEditIcon size={14} color="#5C5C5E" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={personStyles.addItemPill}
                    onPress={(e) => {
                        e.stopPropagation();
                        onAddItem();
                    }}
                    activeOpacity={0.7}
                >
                    <Feather name="plus" size={12} color="#A0A0A2" />
                    <Text style={personStyles.addItemPillText}>Add item</Text>
                </TouchableOpacity>
            </View>

            {/* Items list */}
            {myItems.length > 0 && (
                <View style={personStyles.itemsList}>
                    {myItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={personStyles.itemRow}
                            onPress={() => onEditItem(item)}
                            activeOpacity={0.7}
                        >
                            <Text style={personStyles.itemLabel} numberOfLines={1}>
                                {item.label}
                            </Text>
                            <Text style={personStyles.itemPrice}>
                                {item.price.toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Footer with thin line */}
            <View style={personStyles.footer}>
                <Text style={personStyles.totalLabel}>Total</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={personStyles.total}>{total.toFixed(2)}</Text>
                    <Text style={personStyles.currency}>EGP</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const personStyles = StyleSheet.create({
    card: {
        display: 'flex',
        padding: 12,
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 16,
        alignSelf: 'stretch',
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#292929',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
    },
    name: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#E5E5E8',
    },
    nameInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#E5E5E8',
        borderBottomWidth: 1,
        borderBottomColor: '#2CC75C',
        paddingVertical: 2,
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
    total: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2CC75C',
        marginRight: 4,
    },
    currency: {
        fontSize: 11,
        color: '#7CFFA4',
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#292929',
    },
    totalLabel: {
        flex: 1,
        fontSize: 13,
        color: '#7D7D80',
        fontWeight: '600',
    },
    itemsList: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#292929',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    itemLabel: {
        flex: 1,
        fontSize: 13,
        color: '#A0A0A2',
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: '#C2C2C6',
        marginRight: 8,
    },
    itemRemove: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#DD4E4E15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRemoveText: {
        color: '#FF8787',
        fontSize: 10,
        fontWeight: '700',
    },
    addItemPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#292929',
        marginLeft: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: '#404041',
    },
    addItemPillText: {
        fontSize: 12,
        color: '#A0A0A2',
        fontWeight: '600',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#292929',
    },
});

// ─── Tax/Service Settings Bottom Sheet ───────────────────
function TaxServiceSettingsSheet({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) {
    const { fees, toggleFee, updateFee, removeFee, addFee } = useBill();

    const [showAddForm, setShowAddForm] = useState(false);
    const [newFeeName, setNewFeeName] = useState('');
    const [newFeeRateText, setNewFeeRateText] = useState('');

    const handleAddFee = () => {
        const parsed = parseFloat(newFeeRateText.replace(',', '.'));
        if (!Number.isFinite(parsed) || parsed <= 0 || !newFeeName.trim()) return;
        addFee(newFeeName.trim(), parsed / 100);
        setNewFeeName('');
        setNewFeeRateText('');
        setShowAddForm(false);
    };

    const handleClose = () => {
        setShowAddForm(false);
        setNewFeeName('');
        setNewFeeRateText('');
        onClose();
    };

    // Built-in fee IDs that cannot be deleted
    const builtInIds = ['fee-1', 'fee-2'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={sheetStyles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%' }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={sheetStyles.sheet}
                        onPress={() => { }}
                    >
                        <View style={sheetStyles.handle} />
                        <View style={sheetStyles.headerRow}>
                            <Text style={[sheetStyles.title, { marginBottom: 0 }]}>Tax & Service</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <Feather name="x" size={20} color="#7D7D80" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                            {fees.map((fee) => (
                                <View key={fee.id} style={taxSheetStyles.feeRow}>
                                    {/* Toggle */}
                                    <TouchableOpacity
                                        style={[taxSheetStyles.miniTrack, fee.isEnabled && taxSheetStyles.miniTrackActive]}
                                        onPress={() => toggleFee(fee.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[taxSheetStyles.miniThumb, fee.isEnabled && taxSheetStyles.miniThumbActive]} />
                                    </TouchableOpacity>

                                    {/* Name */}
                                    <TextInput
                                        style={taxSheetStyles.feeNameInput}
                                        value={fee.name}
                                        onChangeText={(v) => updateFee(fee.id, { name: v })}
                                        placeholderTextColor="#5C5C5E"
                                        editable={!builtInIds.includes(fee.id)}
                                    />

                                    {/* Rate */}
                                    <View style={taxSheetStyles.rateBox}>
                                        <RNTextInput
                                            style={taxSheetStyles.rateInput}
                                            value={String(Math.round(fee.rate * 10000) / 100)}
                                            keyboardType="decimal-pad"
                                            onChangeText={(v) => {
                                                const parsed = parseFloat(v.replace(',', '.'));
                                                if (Number.isFinite(parsed) && parsed >= 0) {
                                                    updateFee(fee.id, { rate: parsed / 100 });
                                                }
                                            }}
                                        />
                                        <Text style={taxSheetStyles.rateSymbol}>%</Text>
                                    </View>

                                    {/* Delete button for custom fees only */}
                                    {!builtInIds.includes(fee.id) ? (
                                        <TouchableOpacity
                                            style={taxSheetStyles.deleteBtn}
                                            onPress={() => removeFee(fee.id)}
                                        >
                                            <Feather name="trash-2" size={16} color="#FF8787" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={taxSheetStyles.deleteBtn} />
                                    )}
                                </View>
                            ))}

                            {showAddForm ? (
                                <View style={taxSheetStyles.addForm}>
                                    <Text style={sheetStyles.inputLabel}>Name *</Text>
                                    <TextInput
                                        style={[sheetStyles.input, { marginBottom: 12 }]}
                                        placeholder="e.g. Delivery"
                                        placeholderTextColor="#5C5C5E"
                                        value={newFeeName}
                                        onChangeText={setNewFeeName}
                                        autoFocus
                                    />
                                    <Text style={sheetStyles.inputLabel}>Rate (%) *</Text>
                                    <View style={[sheetStyles.priceRow, { marginBottom: 16 }]}>
                                        <TextInput
                                            style={sheetStyles.priceInput}
                                            placeholder="0"
                                            placeholderTextColor="#5C5C5E"
                                            keyboardType="decimal-pad"
                                            value={newFeeRateText}
                                            onChangeText={setNewFeeRateText}
                                        />
                                        <Text style={sheetStyles.currency}>%</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity
                                            style={[taxSheetStyles.formBtn, { backgroundColor: '#292929', flex: 1 }]}
                                            onPress={() => { setShowAddForm(false); setNewFeeName(''); setNewFeeRateText(''); }}
                                        >
                                            <Text style={[taxSheetStyles.formBtnText, { color: '#A0A0A2' }]}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[taxSheetStyles.formBtn, { backgroundColor: '#2CC75C', flex: 1 }]}
                                            onPress={handleAddFee}
                                        >
                                            <Text style={[taxSheetStyles.formBtnText, { color: '#022C22' }]}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={taxSheetStyles.addNewBtn}
                                    onPress={() => setShowAddForm(true)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="plus" size={16} color="#2CC75C" />
                                    <Text style={taxSheetStyles.addNewBtnText}>Add custom fee</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
}

const taxSheetStyles = StyleSheet.create({
    feeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    miniTrack: {
        width: 40,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3E3E3E',
        padding: 2,
        justifyContent: 'center',
    },
    miniTrackActive: {
        backgroundColor: '#2CC75C',
    },
    miniThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#A0A0A2',
    },
    miniThumbActive: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-end',
    },
    feeNameInput: {
        flex: 1,
        fontSize: 16,
        color: '#E5E5E8',
        backgroundColor: '#141414',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#292929',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    rateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141414',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#292929',
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: 72,
    },
    rateInput: {
        fontSize: 16,
        color: '#E5E5E8',
        flex: 1,
        textAlign: 'right',
    },
    rateSymbol: {
        fontSize: 14,
        color: '#7D7D80',
        marginLeft: 2,
    },
    deleteBtn: {
        width: 32,
        alignItems: 'center',
    },
    addNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2CC75C40',
        borderStyle: 'dashed',
        backgroundColor: '#2CC75C08',
        marginTop: 4,
    },
    addNewBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2CC75C',
    },
    addForm: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#141414',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#292929',
    },
    formBtn: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    formBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});

// ═══════════════════════════════════════════════════════════
// ─── Home Screen ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

export function HomeScreen() {
    const navigation = useNavigation<any>();
    const {
        billTitle,
        setBillTitle,
        items,
        addItemForParticipant,
        addItemForParticipants,
        addSharedItem,
        updateItem,
        removeItem,
        participants,
        addParticipant,
        calculation,
        resetBill,
        fees,
        toggleFee,
    } = useBill();

    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Tax settings sheet state
    const [taxSettingsVisible, setTaxSettingsVisible] = useState(false);

    // Bottom sheet state
    const [sheetVisible, setSheetVisible] = useState(false);
    const [sheetTargetId, setSheetTargetId] = useState<string | null>(null);
    const [sheetTargetLabel, setSheetTargetLabel] = useState('');
    const [sheetIsShared, setSheetIsShared] = useState(false);

    // Edit item sheet state
    const [editTargetItem, setEditTargetItem] = useState<LocalItem | null>(null);

    const { bill } = calculation;

    const openSheetForParticipant = useCallback((id: string, name: string) => {
        setSheetTargetId(id);
        setSheetTargetLabel(name);
        setSheetIsShared(false);
        setSheetVisible(true);
    }, []);

    const openSheetForShared = useCallback(() => {
        setSheetTargetId(null);
        setSheetTargetLabel('everyone');
        setSheetIsShared(true);
        setSheetVisible(true);
    }, []);

    const handleSheetAdd = useCallback(
        (label: string, price: number, selectedIds: string[]) => {
            if (sheetTargetId) {
                addItemForParticipant(sheetTargetId, label, price);
            } else if (selectedIds.length === participants.length) {
                addSharedItem(label, price);
            } else {
                addItemForParticipants(selectedIds, label, price);
            }
        },
        [sheetTargetId, addItemForParticipant, addSharedItem, addItemForParticipants, participants.length],
    );

    const handleEditItemSave = useCallback(
        (id: string, label: string, price: number, selectedIds: string[]) => {
            updateItem(id, { label, price, assignedTo: selectedIds });
        },
        [updateItem],
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ── Custom App Header ── */}
                <View style={styles.appHeader}>
                    <Text style={styles.appTitle}>SplitBill</Text>
                    <View style={styles.appHeaderActions}>
                        <TouchableOpacity
                            style={styles.historyBtn}
                            onPress={() => navigation.navigate('HistoryList')}
                        >
                            <MaterialCommunityIcons name="history" size={24} color="#E5E5E8" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.newBillBtn}
                            onPress={resetBill}
                        >
                            <Feather name="plus" size={16} color="#E5E5E8" />
                            <Text style={styles.newBillBtnText}>New</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Bill Title / Header ── */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            {isEditingTitle ? (
                                <TextInput
                                    style={styles.titleInput}
                                    value={billTitle}
                                    onChangeText={setBillTitle}
                                    onBlur={() => setIsEditingTitle(false)}
                                    autoFocus
                                    selectTextOnFocus
                                />
                            ) : (
                                <TouchableOpacity
                                    style={styles.titleClickArea}
                                    onPress={() => setIsEditingTitle(true)}
                                >
                                    <Text style={styles.title}>{billTitle}</Text>
                                    <Feather name="edit-2" size={16} color="#5C5C5E" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.moreIcon}>
                                <MaterialCommunityIcons name="dots-vertical" size={24} color="#5C5C5E" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Dynamic Fees Toggles ── */}
                    <View style={[
                        styles.toggleRow,
                        fees.some(f => f.isEnabled) && styles.toggleRowActive
                    ]}>
                        <TouchableOpacity
                            style={styles.masterToggle}
                            onPress={() => {
                                const anyOn = fees.some(f => f.isEnabled);
                                // If any are active, turn them all off. If none active, turn all on.
                                fees.forEach(f => {
                                    if (anyOn === f.isEnabled) toggleFee(f.id);
                                });
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.toggleTrack,
                                fees.some(f => f.isEnabled) && styles.toggleTrackActive,
                            ]}>
                                <View style={[
                                    styles.toggleThumb,
                                    fees.some(f => f.isEnabled) && styles.toggleThumbActive,
                                ]} />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.toggleChips}>
                            {/* Only show built-in fees as chips; custom fees get a +N badge */}
                            {fees
                                .filter(f => ['fee-1', 'fee-2'].includes(f.id))
                                .map((fee) => (
                                    <TouchableOpacity
                                        key={fee.id}
                                        style={[
                                            styles.toggleChip,
                                            fee.isEnabled && styles.toggleChipActive,
                                        ]}
                                        onPress={() => toggleFee(fee.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.toggleChipText,
                                            fee.isEnabled && styles.toggleChipTextActive,
                                        ]}>
                                            {fee.name} {Math.round(fee.rate * 100)}%
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            }
                            {/* +N badge for custom fees */}
                            {fees.filter(f => !['fee-1', 'fee-2'].includes(f.id)).length > 0 && (
                                <TouchableOpacity
                                    style={styles.toggleChipExtra}
                                    onPress={() => setTaxSettingsVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.toggleChipExtraText}>
                                        +{fees.filter(f => !['fee-1', 'fee-2'].includes(f.id)).length}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.settingsIconBtn} onPress={() => setTaxSettingsVisible(true)}>
                            <Feather name="sliders" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* ── People Section ── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>People</Text>
                        <View style={styles.sectionCountBadge}>
                            <Text style={styles.sectionCountText}>{participants.length}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.sectionAddBtnSmall}
                            onPress={() => addParticipant(`Friend ${participants.length + 1}`)}
                        >
                            <Feather name="user-plus" size={14} color="#A0A0A2" />
                            <Text style={styles.sectionAddBtnTextSmall}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Add shared item — only if more than 1 person */}
                    {participants.length > 1 && (
                        <TouchableOpacity
                            style={styles.sharedItemBtn}
                            onPress={openSheetForShared}
                            activeOpacity={0.7}
                        >
                            <Feather name="users" size={16} color="#2CC75C" style={{ marginRight: 8 }} />
                            <Text style={styles.sharedItemText}>Add shared item</Text>
                        </TouchableOpacity>
                    )}

                    {participants.map((p) => (
                        <PersonCard
                            key={p.id}
                            participant={p}
                            onAddItem={() => openSheetForParticipant(p.id, p.name)}
                            onEditItem={(item) => setEditTargetItem(item)}
                            onPress={() =>
                                navigation.navigate('PersonDetail', { participantId: p.id })
                            }
                        />
                    ))}

                    {/* ── Totals ── */}
                    <View style={styles.totalsCard}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Subtotal</Text>
                            <Text style={styles.totalsValue}>{bill.subtotal.toFixed(2)}</Text>
                        </View>
                        {bill.fees.map((fee) => {
                            if (!fee.isEnabled) return null;
                            const amount = bill.feesAmounts[fee.id] || 0;
                            return (
                                <View key={fee.id} style={styles.totalsRow}>
                                    <Text style={styles.totalsLabel}>{fee.name} {Math.round(fee.rate * 100)}%</Text>
                                    <Text style={styles.totalsValue}>
                                        {amount.toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })}
                        <View style={[styles.totalsRow, styles.totalsDivider]}>
                            <Text style={styles.totalsFinalLabel}>Total</Text>
                            <Text style={styles.totalsFinalValue}>
                                {bill.total.toFixed(2)} EGP
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Bottom Sheet */}
                <AddItemSheet
                    visible={sheetVisible}
                    targetLabel={sheetTargetLabel}
                    isShared={sheetIsShared}
                    participants={participants}
                    defaultLabel={`Item ${items.length + 1}`}
                    onAdd={handleSheetAdd}
                    onClose={() => setSheetVisible(false)}
                    onRequestMakeShared={openSheetForShared}
                />

                <EditItemSheet
                    visible={!!editTargetItem}
                    item={editTargetItem}
                    participants={participants}
                    onSave={handleEditItemSave}
                    onRemove={(id) => removeItem(id)}
                    onClose={() => setEditTargetItem(null)}
                />

                <TaxServiceSettingsSheet
                    visible={taxSettingsVisible}
                    onClose={() => setTaxSettingsVisible(false)}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#141414',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    appTitle: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: 'GoogleSansFlex_600SemiBold', // Mapping to 600 weight
        fontSize: 24, // var(--font-size-3, 24px)
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 32, // var(--line-height-3, 32px)
        letterSpacing: -0.25,
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    appHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    historyBtn: {
        padding: 4,
    },
    newBillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#292929',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#404041',
        gap: 4,
    },
    newBillBtnText: {
        color: '#E5E5E8',
        fontSize: 14,
        fontWeight: '600',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },

    // Header
    header: {
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleClickArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#F5F5F7',
        letterSpacing: -0.5,
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    moreIcon: {
        padding: 4,
    },
    editIcon: {
        fontSize: 16,
        color: '#5C5C5E',
        marginLeft: 8,
    },
    titleInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        color: '#F5F5F7',
        paddingBottom: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#2CC75C',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },

    // Toggles
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141414',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#292929',
    },
    toggleRowActive: {
        borderColor: '#0E8332',
    },
    masterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleTrack: {
        width: 52,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3E3E3E',
        padding: 2,
        justifyContent: 'center',
    },
    toggleTrackActive: {
        backgroundColor: '#2CC75C',
    },
    toggleThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#A0A0A2',
    },
    toggleThumbActive: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-end',
    },
    toggleChips: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 16,
        flex: 1,
    },
    toggleChip: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#404041',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    toggleChipActive: {
        backgroundColor: 'rgba(44, 199, 92, 0.1)',
        borderColor: 'rgba(44, 199, 92, 0.6)',
    },
    toggleChipText: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18,
        color: '#FFFFFF',
        // @ts-expect-error
        fontVariationSettings: "'liga' 0, 'clig' 0",
    },
    toggleChipTextActive: {
        color: '#F0FDF4',
    },
    toggleChipExtra: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(44, 199, 92, 0.6)',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleChipExtraText: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18,
        color: '#F0FDF4',
        // @ts-expect-error
        fontVariationSettings: "'liga' 0, 'clig' 0",
    },
    settingsIconBtn: {
        padding: 4,
    },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E5E5E8',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },
    sectionCountBadge: {
        marginLeft: 8,
        backgroundColor: '#292929',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 99,
    },
    sectionCountText: {
        fontSize: 13,
        color: '#7D7D80',
        fontWeight: '600',
    },
    sectionAddBtnSmall: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#292929',
        gap: 4,
        borderWidth: 1,
        borderColor: '#404041',
    },
    sectionAddBtnTextSmall: {
        fontSize: 12,
        color: '#A0A0A2',
        fontWeight: '600',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },

    // Shared item button
    sharedItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2CC75C40',
        borderStyle: 'dashed',
        backgroundColor: '#2CC75C08',
        marginTop: 6,
        marginBottom: 12,
    },
    sharedItemText: {
        fontSize: 14,
        color: '#7CFFA4',
        fontWeight: '600',
        // @ts-expect-error
        fontVariationSettings: "'wdth' 128, 'GRAD' 50, 'ROND' 50",
    },

    // Totals card
    totalsCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#292929',
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    totalsLabel: {
        fontSize: 14,
        color: '#7D7D80',
    },
    totalsValue: {
        fontSize: 14,
        color: '#C2C2C6',
        fontWeight: '600',
    },
    totalsDivider: {
        borderTopWidth: 1,
        borderTopColor: '#292929',
        marginTop: 8,
        paddingTop: 12,
    },
    totalsFinalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E5E5E8',
    },
    totalsFinalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2CC75C',
    },
});
