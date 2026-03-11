

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div className="w-full px-4">
      <div className="flex justify-between text-xs text-white/80 mb-1 font-medium">
        <span>{current} מתוך {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
