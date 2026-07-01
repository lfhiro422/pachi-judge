"use client";

import { MachineMaster } from "@/lib/types";

export default function MachineSelect({
  machines,
  value,
  onChange,
}: {
  machines: MachineMaster[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-500" htmlFor="machine">
        機種を選ぶ
      </label>
      <select
        id="machine"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {machines.map((m) => (
          <option key={m.machineId} value={m.machineId}>
            {m.machineName}（{m.maker}）
          </option>
        ))}
      </select>
    </div>
  );
}
