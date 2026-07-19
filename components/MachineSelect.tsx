"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.machineId === value),
    [machines, value]
  );

  // 開いていないときの入力欄には、選択中の機種名を表示する。
  // 開いている間は、ユーザーが入力中の検索文字列（query）をそのまま表示する。
  const displayValue = isOpen
    ? query
    : selectedMachine
    ? `${selectedMachine.machineName}（${selectedMachine.maker}）`
    : "";

  const filteredMachines = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return machines;
    return machines.filter((m) =>
      `${m.machineName}${m.maker}`.toLowerCase().includes(trimmed)
    );
  }, [machines, query]);

  // 候補一覧の外側をタップ/クリックしたら閉じる
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, isOpen]);

  function handleSelect(machineId: string) {
    onChange(machineId);
    setIsOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        Math.min(prev + 1, filteredMachines.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredMachines[highlightIndex];
      if (target) handleSelect(target.machineId);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <div className="flex flex-col gap-2 relative" ref={containerRef}>
      <label className="text-sm text-gray-500" htmlFor="machine">
        機種を選ぶ
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="machine"
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="機種名で検索（例: からくり）"
          autoComplete="off"
          className="w-full border border-gray-300 rounded-xl pl-4 pr-10 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>

      {isOpen && (
        <ul className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-20">
          {filteredMachines.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400">
              該当する機種が見つかりません
            </li>
          ) : (
            filteredMachines.map((m, index) => (
              <li key={m.machineId}>
                <button
                  type="button"
                  // onMouseDownにすることで、inputのonBlur（外側クリック判定）より先に発火させ、
                  // 候補タップ時に選択が確実に反映されるようにする
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(m.machineId);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 ${
                    index === highlightIndex ? "bg-blue-50" : "bg-white"
                  } ${
                    m.machineId === value ? "font-semibold text-blue-700" : "text-gray-900"
                  }`}
                >
                  {m.machineName}
                  <span className="text-gray-400">（{m.maker}）</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
