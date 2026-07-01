import { Judgement } from "@/lib/types";

const CONFIG: Record<
  Judgement,
  { ring: string; dot: string; label: string; sub: string }
> = {
  GO: {
    ring: "ring-green-200 bg-green-50",
    dot: "bg-green-500 shadow-[0_0_30px_6px_rgba(34,197,94,0.45)]",
    label: "GO",
    sub: "狙い目圏内です",
  },
  STAY: {
    ring: "ring-amber-200 bg-amber-50",
    dot: "bg-amber-400 shadow-[0_0_30px_6px_rgba(251,191,36,0.45)]",
    label: "STAY",
    sub: "もう少し様子見です",
  },
  STOP: {
    ring: "ring-rose-200 bg-rose-50",
    dot: "bg-rose-500 shadow-[0_0_30px_6px_rgba(244,63,94,0.45)]",
    label: "STOP",
    sub: "見送りが無難です",
  },
};

export default function SignalLight({ judgement }: { judgement: Judgement }) {
  const c = CONFIG[judgement];
  return (
    <div
      className={`flex flex-col items-center gap-3 w-full rounded-2xl ring-1 py-6 ${c.ring}`}
    >
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-xl font-bold ${c.dot}`}
      >
        {c.label}
      </div>
      <p className="text-sm text-gray-600">{c.sub}</p>
    </div>
  );
}
