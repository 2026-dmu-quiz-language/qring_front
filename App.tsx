// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadSfx } from './src/utils/sfx';

export default function App() {
  // 효과음을 미리 불러둬야 첫 재생이 늦지 않다.
  useEffect(() => {
    preloadSfx();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex : 1 }}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
    
  );
}