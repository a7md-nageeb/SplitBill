import { Text, TextInput } from "../components/Typography";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import type { Participant } from "../domain/types";
import type { RootStackParamList } from "../navigation/types";
import { useBill } from "../context/BillContext";
import { removeBillFromHistory } from "../storage/history";

type Props = NativeStackScreenProps<RootStackParamList, "HistoryDetail">;

export function HistoryDetailScreen({ route, navigation }: Props) {
  const { record } = route.params;
  const { bill, participantSummaries, participants, createdAt } = record;
  const { loadBillFromHistory } = useBill();

  const handleEditBill = () => {
    loadBillFromHistory(record);
    // Navigate back to Home which is the root of the Main stack
    navigation.navigate("Home");
  };

  const handleDeleteBill = async () => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill from history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeBillFromHistory(record.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Error", "Failed to delete bill. Please try again.");
            }
          },
        },
      ],
    );
  };

  const date = new Date(createdAt);
  const formattedDate = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const findParticipant = (id: string): Participant | undefined =>
    participants.find((p) => p.id === id);

  const renderRow = ({
    item,
  }: {
    item: (typeof participantSummaries)[number];
  }) => {
    const participant = findParticipant(item.participantId);
    const name = participant?.displayName ?? "Guest";

    return (
      <View style={styles.participantRow}>
        <View>
          <Text style={styles.participantName}>{name}</Text>
          <Text style={styles.participantMeta}>
            Items {item.itemSubtotal.toFixed(2)}
            {item.feesShares ? (
              Object.keys(item.feesShares).map((feeId) => {
                const fee = bill.fees?.find((f) => f.id === feeId);
                if (!fee || !fee.isEnabled) return null;
                return ` · ${fee.name} ${item.feesShares[feeId].toFixed(2)}`;
              })
            ) : (
              <>
                {" · Service "}
                {((item as any).serviceShare ?? 0).toFixed(2)}
                {" · VAT "}
                {((item as any).vatShare ?? 0).toFixed(2)}
              </>
            )}
          </Text>
        </View>
        <Text style={styles.participantTotal}>
          {item.grandTotal.toFixed(2)} EGP
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{bill.title}</Text>
        <Text style={styles.subtitle}>{formattedDate}</Text>
        <Text style={styles.subtitle}>
          Total {bill.total.toFixed(2)} EGP
          {bill.fees ? (
            bill.fees.map((fee) =>
              fee.isEnabled
                ? ` · ${fee.name} ${(fee.rate * 100).toFixed(0)}%`
                : "",
            )
          ) : (
            <>
              {" · Service "}
              {(((bill as any).serviceRate ?? 0) * 100).toFixed(0)}%{" · VAT "}
              {(((bill as any).vatRate ?? 0) * 100).toFixed(0)}%
            </>
          )}
        </Text>
      </View>

      <View style={styles.billCard}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Subtotal</Text>
          <Text style={styles.billValue}>{bill.subtotal.toFixed(2)}</Text>
        </View>
        {bill.fees ? (
          bill.fees.map((fee) =>
            fee.isEnabled ? (
              <View key={fee.id} style={styles.billRow}>
                <Text style={styles.billLabel}>{fee.name}</Text>
                <Text style={styles.billValue}>
                  {(bill.feesAmounts?.[fee.id] ?? 0).toFixed(2)}
                </Text>
              </View>
            ) : null,
          )
        ) : (
          <>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Service</Text>
              <Text style={styles.billValue}>
                {((bill as any).serviceAmount ?? 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>VAT</Text>
              <Text style={styles.billValue}>
                {((bill as any).vatAmount ?? 0).toFixed(2)}
              </Text>
            </View>
          </>
        )}
        <View style={styles.billTotalRow}>
          <Text style={styles.billTotalLabel}>Total</Text>
          <Text style={styles.billTotalValue}>{bill.total.toFixed(2)} EGP</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={handleEditBill}
          activeOpacity={0.7}
        >
          <Text style={styles.editBtnText}>✎ Edit this bill</Text>
        </TouchableOpacity>
        <View style={{ width: 12 }} />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteBill}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Who paid what</Text>

      <FlatList
        data={participantSummaries}
        keyExtractor={(item) => item.participantId}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F5F5F7",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#A0A0A2",
  },
  billCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 13,
    color: "#A0A0A2",
  },
  billValue: {
    fontSize: 14,
    color: "#F5F5F7",
  },
  billTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F5F5F7",
  },
  billTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2CC75C",
  },
  actionRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#292929",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#404041",
  },
  editBtnText: {
    color: "#C2C2C6",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#DD4E4E15",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "#FF8787",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: 16,
    marginHorizontal: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E5E8",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  participantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#141414",
  },
  participantName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#F5F5F7",
  },
  participantMeta: {
    fontSize: 12,
    color: "#7D7D80",
    marginTop: 2,
  },
  participantTotal: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FE9F4D",
  },
});
