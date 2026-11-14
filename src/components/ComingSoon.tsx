// Placeholder for features that teammates are building. See TEAM_TASKS.md.
export default function ComingSoon({ title, task, children }: { title: string; task: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[32px] bg-surface p-10">
      <p className="text-sm font-medium text-lantern">{task} · in progress</p>
      <h2 className="display text-4xl">{title}</h2>
      <p className="max-w-[60ch] text-lg text-muted">This feature is being built. See TEAM_TASKS.md in the repository for the spec.</p>
      {children}
    </div>
  );
}
