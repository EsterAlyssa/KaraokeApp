import { Icon } from './Icon';

export function Chip({
  selected,
  onClick,
  children,
  big = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  big?: boolean;
}) {
  return (
    <button type="button" className={`chip${big ? ' chip--big' : ''}`} aria-pressed={selected} onClick={onClick}>
      {selected && <Icon name="check" size={16} stroke={2.4} />}
      {children}
    </button>
  );
}

export function TopBar({ title, onBack, action }: { title: string; onBack: () => void; action?: React.ReactNode }) {
  return (
    <header className="topbar">
      <button type="button" className="round glass" aria-label="Torna alla home" onClick={onBack}>
        <Icon name="back" size={22} />
      </button>
      <h2 className="topbar__title">{title}</h2>
      {action}
    </header>
  );
}
