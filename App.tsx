// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadSfx, loadSfxSetting } from './src/utils/sfx';

export default function App() {
  // 저장된 효과음 설정을 먼저 읽고, 소리를 미리 불러둬야 첫 재생이 늦지 않다.
  useEffect(() => {
    loadSfxSetting();
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