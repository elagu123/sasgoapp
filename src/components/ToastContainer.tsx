import React from 'react';
import Toast from './Toast.tsx';
import type { ToastMessage } from '../contexts/ToastContext.tsx';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;