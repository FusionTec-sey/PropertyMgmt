import { Tabs } from "expo-router";
import { Home, Building2, Users, DollarSign, Settings, Wrench, CheckSquare, FileText } from "lucide-react-native";
import React from "react";
import { useApp } from "@/contexts/AppContext";

export default function TabLayout() {
  const { currentUser, hasPermission } = useApp();
  const isOwner = currentUser?.role === 'owner';

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
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          href: isOwner ? undefined : null,
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
          title: "Payments & Invoices",
          tabBarIcon: ({ color }) => <DollarSign size={24} color={color} />,
          href: hasPermission('payments') ? undefined : null,
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
          title: "Maintenance",
          tabBarIcon: ({ color }) => <Wrench size={24} color={color} />,
          href: hasPermission('maintenance') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: "To-Do",
          tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
          href: hasPermission('todos') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          href: isOwner ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          href: hasPermission('settings') ? undefined : null,
        }}
      />
    </Tabs>
  );
}
