// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppContext } from "@/contexts/AppContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { trpc, trpcClient } from "@/lib/trpc";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initApp = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log("App initialized successfully");
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initApp();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NotificationContext>
          <AppContext>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </AppContext>
        </NotificationContext>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
