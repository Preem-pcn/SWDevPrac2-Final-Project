export type RuleState = "pass" | "fail" | "pending";
export type Rule = { label: string; note: string; state: RuleState };

const icon = {
  pass: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  fail: <path d="M6 6l12 12M18 6L6 18" />,
  pending: <path d="M7 12h10" />,
};

export default function Rules({ rules }: { rules: Rule[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {rules.map((r) => (
        <li key={r.label} className="flex gap-3.5">
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-full ${
              r.state === "pass" ? "bg-sky" : r.state === "fail" ? "bg-danger" : "bg-field"
            }`}
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke={r.state === "pending" ? "#A8C8DC" : "#04263D"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {icon[r.state]}
            </svg>
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">{r.label}</span>
            <span className={`text-sm ${r.state === "fail" ? "text-danger" : "text-muted"}`}>{r.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
