import { Text, TextInput } from './src/components/Typography';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  useFonts,
  GoogleSansFlex_100Thin,
  GoogleSansFlex_200ExtraLight,
  GoogleSansFlex_300Light,
  GoogleSansFlex_400Regular,
  GoogleSansFlex_500Medium,
  GoogleSansFlex_600SemiBold,
  GoogleSansFlex_700Bold,
  GoogleSansFlex_800ExtraBold,
  GoogleSansFlex_900Black,
} from '@expo-google-fonts/google-sans-flex';
import { BillProvider } from './src/context/BillContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { PersonDetailScreen } from './src/screens/PersonDetailScreen';
import { QuickCalculatorScreen } from './src/screens/QuickCalculatorScreen';
import { CreateBillScreen } from './src/screens/CreateBillScreen';
import { BillItemsScreen } from './src/screens/BillItemsScreen';
import { BillSummaryScreen } from './src/screens/BillSummaryScreen';
import { HistoryListScreen } from './src/screens/HistoryListScreen';
import { HistoryDetailScreen } from './src/screens/HistoryDetailScreen';
import type { RootStackParamList } from './src/navigation/types';
import { colors as ThemeColors } from './src/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: ThemeColors.Basic_Black,
    card: ThemeColors.Basic_Black,
    text: ThemeColors.Charcoal_charcoal50,
    border: ThemeColors.Basic_Black,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    GoogleSansFlex_100Thin,
    GoogleSansFlex_200ExtraLight,
    GoogleSansFlex_300Light,
    GoogleSansFlex_400Regular,
    GoogleSansFlex_500Medium,
    GoogleSansFlex_600SemiBold,
    GoogleSansFlex_700Bold,
    GoogleSansFlex_800ExtraBold,
    GoogleSansFlex_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <BillProvider>
      <View style={styles.container}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: styles.header,
              headerTintColor: ThemeColors.Charcoal_charcoal50,
              headerTitleStyle: styles.headerTitle,
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PersonDetail"
              component={PersonDetailScreen}
              options={{ title: 'Person Details' }}
            />
            <Stack.Screen
              name="QuickCalculator"
              component={QuickCalculatorScreen}
              options={({ navigation }) => ({
                title: 'SplitBill',
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('HistoryList')}
                    style={styles.historyButton}
                  >
                    <Text style={styles.historyButtonText}>History</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="CreateBill"
              component={CreateBillScreen}
              options={{ title: 'New bill' }}
            />
            <Stack.Screen
              name="BillItems"
              component={BillItemsScreen}
              options={{ title: 'Items' }}
            />
            <Stack.Screen
              name="BillSummary"
              component={BillSummaryScreen}
              options={{ title: 'Summary' }}
            />
            <Stack.Screen
              name="HistoryList"
              component={HistoryListScreen}
              options={{ title: 'History' }}
            />
            <Stack.Screen
              name="HistoryDetail"
              component={HistoryDetailScreen}
              options={{ title: 'Bill details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </View>
    </BillProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    backgroundColor: '#141414',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  historyButtonText: {
    fontSize: 13,
    color: '#E5E5E8',
  },
});
