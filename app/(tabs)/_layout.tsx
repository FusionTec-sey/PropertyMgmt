import { Tabs } from "expo-router";
import { Home, Building2, Users, DollarSign, MoreHorizontal } from "lucide-react-native";
import React from "react";
import { useApp } from "@/contexts/AppContext";

export default function TabLayout() {
  const { hasPermission } = useApp();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: "Properties",
          tabBarIcon: ({ color }) => <Building2 size={24} color={color} />,
          href: hasPermission('properties') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          href: hasPermission('tenants') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Finances",
          tabBarIcon: ({ color }) => <DollarSign size={24} color={color} />,
          href: hasPermission('payments') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
