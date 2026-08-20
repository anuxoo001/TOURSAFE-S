import { useSocket } from '../context/SocketContext.jsx';

const Toasts = () => {
  const { toasts } = useSocket();
  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div>
            <strong>{t.title}</strong>
            {t.body && <div className="text-sm" style={{ marginTop: '0.15rem' }}>{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toasts;