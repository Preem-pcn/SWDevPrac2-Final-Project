export default function AuthPanel({ title, children, footer }: { title: string; children?: React.ReactNode; footer: string }) {
  return (
    <div className="flex flex-col justify-between gap-10 rounded-[40px] bg-brand p-10 md:p-14">
      <h1 className="display max-w-[10ch] text-6xl md:text-7xl lg:text-[80px]">{title}</h1>
      {children}
      <p className="max-w-[44ch] text-lg">{footer}</p>
    </div>
  );
}
