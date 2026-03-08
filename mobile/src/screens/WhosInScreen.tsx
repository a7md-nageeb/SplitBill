import { Text, TextInput } from '../components/Typography';
import {
  useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';;
import { useBill, type LocalParticipant } from '../context/BillContext';

// ─── Person Row ──────────────────────────────────────────
function PersonRow({
    participant,
    onRemove,
    canRemove,
}: {
    participant: LocalParticipant;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const { renameParticipant } = useBill();
    const [editing, setEditing] = useState(false);

    const hue =
        participant.name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
    const firstLetter = participant.name.charAt(0).toUpperCase();

    return (
        <View style={rowStyles.card}>
            <View
                style={[
                    rowStyles.avatar,
                    { backgroundColor: `hsla(${hue}, 60%, 50%, 0.2)` },
                ]}
            >
                <Text
                    style={[rowStyles.avatarText, { color: `hsl(${hue}, 70%, 65%)` }]}
                >
                    {firstLetter}
                </Text>
            </View>

            {editing ? (
                <TextInput
                    style={rowStyles.nameInput}
                    value={participant.name}
                    onChangeText={(t) => renameParticipant(participant.id, t)}
                    onBlur={() => setEditing(false)}
                    autoFocus
                    selectTextOnFocus
                />
            ) : (
                <TouchableOpacity
                    style={rowStyles.nameTap}
                    onPress={() => setEditing(true)}
                >
                    <Text style={rowStyles.name}>{participant.name}</Text>
                    <Text style={rowStyles.editHint}>✎</Text>
                </TouchableOpacity>
            )}

            {canRemove && (
                <TouchableOpacity style={rowStyles.removeBtn} onPress={onRemove}>
                    <Text style={rowStyles.removeBtnText}>✕</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const rowStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#292929',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
    },
    nameTap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: '#E5E5E8',
    },
    editHint: {
        fontSize: 14,
        color: '#5C5C5E',
        marginLeft: 8,
    },
    nameInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#F5F5F7',
        borderBottomWidth: 2,
        borderBottomColor: '#2CC75C',
        paddingVertical: 4,
        paddingHorizontal: 0,
    },
    removeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DD4E4E20',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    removeBtnText: {
        color: '#FF8787',
        fontSize: 14,
        fontWeight: '700',
    },
});

// ═══════════════════════════════════════════════════════════
// ─── Who's In Screen ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════

export function WhosInScreen() {
    const navigation = useNavigation<any>();
    const { participants, addParticipant, removeParticipant } = useBill();

    const handleAddPerson = () => {
        addParticipant(`Friend ${participants.length}`);
    };

    const handleNext = () => {
        navigation.navigate('Home');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title */}
                <Text style={styles.emoji}>👋</Text>
                <Text style={styles.title}>Who's in?</Text>
                <Text style={styles.subtitle}>
                    Add everyone splitting this bill. You can edit names by tapping them.
                </Text>

                {/* People list */}
                <View style={styles.list}>
                    {participants.map((p) => (
                        <PersonRow
                            key={p.id}
                            participant={p}
                            onRemove={() => removeParticipant(p.id)}
                            canRemove={participants.length > 1}
                        />
                    ))}
                </View>

                {/* Add person button */}
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddPerson}
                    activeOpacity={0.7}
                >
                    <Text style={styles.addBtnIcon}>＋</Text>
                    <Text style={styles.addBtnText}>Add person</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Next button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.nextBtnText}>Next →</Text>
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#F5F5F7',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#7D7D80',
        lineHeight: 22,
        marginBottom: 32,
    },
    list: {
        marginBottom: 12,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#292929',
        borderStyle: 'dashed',
    },
    addBtnIcon: {
        fontSize: 18,
        color: '#2CC75C',
        fontWeight: '700',
        marginRight: 8,
    },
    addBtnText: {
        fontSize: 15,
        color: '#A0A0A2',
        fontWeight: '600',
    },
    bottomBar: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: '#141414',
        borderTopWidth: 1,
        borderTopColor: '#292929',
    },
    nextBtn: {
        backgroundColor: '#2CC75C',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    nextBtnText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#022C22',
    },
});
