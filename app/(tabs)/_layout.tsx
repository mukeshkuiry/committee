import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E3A5F',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: styles.tabBar,
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: 'Group Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#e9ecef',
    borderTopWidth: 1,
  },
});