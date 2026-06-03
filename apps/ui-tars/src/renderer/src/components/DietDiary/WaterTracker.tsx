interface WaterTrackerProps {
  count: number;
  onSet: (n: number) => void;
  accent?: string;
}

function DropIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg
      width="28"
      height="34"
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <path
        d="M14 2C14 2 3 13.5 3 21a11 11 0 0 0 22 0C25 13.5 14 2 14 2Z"
        fill={filled ? color : 'none'}
        stroke={filled ? color : 'var(--muted-foreground, #aaa)'}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WaterTracker({
  count,
  onSet,
  accent = '#3b82f6',
}: WaterTrackerProps) {
  const liters = ((count * 250) / 1000).toFixed(1);

  return (
    <div
      style={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 10,
          color: 'var(--foreground)',
        }}
      >
        Wasseraufnahme
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <button
            key={i}
            onClick={() => onSet(i + 1 === count ? i : i + 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 4,
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.transform =
                'scale(1.15)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.transform =
                'scale(1)')
            }
            title={`${i + 1} Glas`}
          >
            <DropIcon filled={i < count} color={accent} />
          </button>
        ))}
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--muted-foreground, #888)',
        }}
      >
        {count}/8 Gläser&nbsp;·&nbsp;{liters}&thinsp;L
      </div>
    </div>
  );
}
