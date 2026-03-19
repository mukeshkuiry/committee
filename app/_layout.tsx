import { Stack } from 'expo-router';
import { AppProvider } from '../src/context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#1E3A5F' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="member/add" options={{ title: 'Add Member' }} />
        <Stack.Screen name="member/[id]/edit" options={{ title: 'Edit Member' }} />
        <Stack.Screen name="loan/new" options={{ title: 'Issue New Loan' }} />
        <Stack.Screen name="loan/[id]" options={{ title: 'Loan Details' }} />
        <Stack.Screen name="payment/new" options={{ title: 'Record Payment' }} />
        <Stack.Screen name="monthly" options={{ title: 'Monthly Processing' }} />
      </Stack>
    </AppProvider>
  );
}