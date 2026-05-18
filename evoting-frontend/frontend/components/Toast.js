import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);

  const icons = { success: '✅', error: '❌', warning: '⚠️' };

  return (
    <div className={`toast toast-${type}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
