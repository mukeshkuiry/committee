import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { getGroup } from './src/storage';
import SetupScreen from './src/screens/SetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MembersScreen from './src/screens/MembersScreen';
import LoanScreen from './src/screens/LoanScreen';
import MonthlyScreen from './src/screens/MonthlyScreen';
import MemberDetailScreen from './src/screens/MemberDetailScreen';
import PaymentScreen from './src/screens/PaymentScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: { backgroundColor: '#1E3A8A' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{ title: 'Members', tabBarLabel: 'Members' }}
      />
      <Tab.Screen
        name="Monthly"
        component={MonthlyScreen}
        options={{ title: 'Monthly', tabBarLabel: 'Monthly' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasGroup, setHasGroup] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    const group = await getGroup();
    setHasGroup(!!group);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!hasGroup ? (
          <Stack.Screen
            name="Setup"
            options={{ title: 'Create Group' }}
          >
            {(props) => (
              <SetupScreen
                {...props}
                onSetupComplete={() => setHasGroup(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MemberDetail"
              component={MemberDetailScreen}
              options={{ title: 'Member Details' }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ title: 'Record Payment' }}
            />
            <Stack.Screen
              name="Loan"
              component={LoanScreen}
              options={{ title: 'Manage Loan' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
