interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
}

export function MacroBar({ label, value, target, color }: MacroBarProps) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          marginBottom: 3,
          color: 'var(--muted-foreground, #888)',
        }}
      >
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span>
          {Math.round(value)}&thinsp;/&thinsp;{target}&thinsp;g
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--muted, #e5e7eb)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 3,
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
