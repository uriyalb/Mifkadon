import IlanRider from './IlanRider';

interface Props {
  current: number;
  total: number;
  chapterLabel?: string;
}

export default function ProgressBar({ current, total, chapterLabel }: Props) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div className="w-full px-4">
      {chapterLabel && (
        <p className="text-center text-white/70 text-[10px] font-semibold mb-1">{chapterLabel}</p>
      )}
      <div className="flex justify-between text-xs text-white/80 mb-1 font-medium">
        <span>{current} מתוך {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="relative h-2 bg-white/30 rounded-full overflow-visible">
        <IlanRider pct={pct} />
        <div
          className="h-full bg-white rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
