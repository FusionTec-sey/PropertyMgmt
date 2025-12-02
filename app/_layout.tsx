// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { AppContext } from "@/contexts/AppContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { SyncContext } from "@/contexts/SyncContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { Analytics } from "@/utils/analytics";
import { PerformanceMonitor } from "@/utils/performanceMonitor";
import { CacheManager } from "@/utils/cacheManager";
import { AppInitializer } from "@/utils/appInitializer";
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
        console.log('[APP] Initializing utilities...');
        
        await Promise.all([
          Analytics.init(),
          PerformanceMonitor.init(),
          CacheManager.init(),
        ]);
        
        console.log('[APP] Utilities initialized successfully');
        
        console.log('[APP] Running app initializer...');
        await AppInitializer.checkAndCreateExpiringDocumentReminders();
        
        await SplashScreen.hideAsync();
        console.log('[APP] App initialized successfully');
      } catch (error) {
        console.error('[APP] Error initializing app:', error);
        Analytics.trackError(error as Error, 'critical', 'app_initialization');
      }
    };

    initApp();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SyncContext>
          <NotificationContext>
            <AppContext>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <AppErrorBoundary>
                  <RootLayoutNav />
                </AppErrorBoundary>
              </GestureHandlerRootView>
            </AppContext>
          </NotificationContext>
        </SyncContext>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
