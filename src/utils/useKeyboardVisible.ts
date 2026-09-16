// src/utils/useKeyboardVisible.ts
// 키보드가 떠 있는지 추적하는 훅.
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export const useKeyboardVisible = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 아이폰은 키보드가 올라오기 직전에 알려줘서 화면이 튀지 않는다.
    // 안드로이드는 직전 알림이 없어서 올라온 뒤 알림을 쓴다.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
};
