'use client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A26',
            color: '#fff',
            border: '1px solid #22223A',
            fontFamily: 'var(--font-syne)',
          },
          success: { iconTheme: { primary: '#4F63FF', secondary: '#fff' } },
        }}
      />
    </Provider>
  );
}
