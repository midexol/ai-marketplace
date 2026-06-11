import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#493113] border-t-cyan-400" />
    </div>
  );
}
