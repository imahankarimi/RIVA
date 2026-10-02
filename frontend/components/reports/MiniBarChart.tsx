export function MiniBarChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="w-full rounded-sm bg-signal-500/85 transition-all duration-300"
            style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
          />
          <span className="text-[10.5px] text-ink-faint">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
