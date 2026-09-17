// src/components/common/AlertHost.tsx
// Alert.alert / window.confirm 을 대신하는 앱 공통 알림창.
//
// Alert.alert 는 함수라 async 흐름 한가운데서 바로 부를 수 있었지만,
// 모달은 화면마다 상태와 JSX가 필요하다. 그래서 App.tsx 에 호스트를 하나만 올려두고
// 화면에서는 showAlert, showConfirm 만 부르도록 했다.
//
//   await showAlert({ title: '오류', message: '...' });
//   if (await showConfirm({ title: '나가기', message: '...' })) { ... }
//
// 웹과 네이티브 모두 같은 모달이 뜨므로 Platform.OS 분기가 필요 없다.
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AppModal, type ModalButton } from './AppModal';

interface AlertOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** 확인 버튼 문구. 생략하면 '확인' */
  confirmText?: string;
}

interface ConfirmOptions extends AlertOptions {
  /** 취소 버튼 문구. 생략하면 '취소' */
  cancelText?: string;
  /** 되돌릴 수 없는 동작이면 확인 버튼이 빨갛게 나온다 */
  destructive?: boolean;
}

interface AlertRequest extends ConfirmOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

// 호스트가 마운트되면 여기에 자기 자신을 등록한다.
let enqueue: ((request: AlertRequest) => void) | null = null;
let nextId = 1;

const request = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (!enqueue) {
      // App.tsx 에 <AlertHost /> 가 빠졌을 때. 알림은 못 띄우지만 흐름은 막지 않는다.
      console.warn('[alert] AlertHost가 마운트되지 않았습니다:', options.title);
      resolve(false);
      return;
    }
    enqueue({ ...options, id: nextId++, resolve });
  });

/** 확인 버튼 하나짜리 알림. 닫힐 때까지 기다리려면 await 를 붙인다. */
export const showAlert = async (options: AlertOptions): Promise<void> => {
  await request(options);
};

/** 확인/취소 알림. 확인을 누르면 true. */
export const showConfirm = (options: ConfirmOptions): Promise<boolean> =>
  request({ cancelText: '취소', ...options });

export const AlertHost = () => {
  // 알림이 겹쳐 들어와도 순서대로 하나씩 보여준다.
  const [queue, setQueue] = useState<AlertRequest[]>([]);
  const current = queue[0];

  useEffect(() => {
    enqueue = (request) => setQueue((prev) => [...prev, request]);
    return () => {
      enqueue = null;
    };
  }, []);

  const close = (confirmed: boolean) => {
    if (!current) return;
    setQueue((prev) => prev.slice(1));
    current.resolve(confirmed);
  };

  // showConfirm 으로 들어온 요청만 cancelText 를 가진다. 그때만 버튼이 두 개다.
  const buttons: ModalButton[] = !current
    ? []
    : current.cancelText
      ? [
          {
            text: current.confirmText ?? '확인',
            variant: current.destructive ? 'danger' : 'primary',
            onPress: () => close(true),
          },
          { text: current.cancelText, variant: 'text', onPress: () => close(false) },
        ]
      : [{ text: current.confirmText ?? '확인', onPress: () => close(true) }];

  return (
    <AppModal
      visible={!!current}
      title={current?.title ?? ''}
      message={current?.message}
      icon={current?.icon}
      buttons={buttons}
      onRequestClose={() => close(false)}
    />
  );
};
