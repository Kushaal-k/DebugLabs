import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function LabShell({ children }: Props) {
  return (
    <div className="lab-shell">
      <div className="lab-ambient" aria-hidden="true">
        <span className="orb orb-emerald" />
        <span className="orb orb-violet" />
        <span className="orb orb-sky" />
      </div>
      {children}
    </div>
  );
}
