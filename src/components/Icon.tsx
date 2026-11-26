// Icone a tratto, prese dal mockup.
type Name =
  | 'sun' | 'moon' | 'check' | 'note' | 'group' | 'dice' | 'list' | 'plus' | 'minus'
  | 'back' | 'close' | 'clock' | 'search' | 'filter';

const paths: Record<Name, React.ReactNode> = {
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" /></>),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  note: (<><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>),
  group: (<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3.5 19c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3" /><path d="M15.8 13.8c2.8 0 4.9 1.8 4.9 4.6" /></>),
  dice: (<><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />{[[8.5, 8.5], [15.5, 8.5], [12, 12], [8.5, 15.5], [15.5, 15.5]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.2" fill="currentColor" stroke="none" />)}</>),
  list: (<><path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" /><circle cx="4" cy="6.5" r=".9" fill="currentColor" /><circle cx="4" cy="12" r=".9" fill="currentColor" /><circle cx="4" cy="17.5" r=".9" fill="currentColor" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>),
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
};

export function Icon({ name, size = 24, stroke = 1.6 }: { name: Name; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
