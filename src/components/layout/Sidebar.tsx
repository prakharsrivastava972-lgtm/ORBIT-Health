import { NavLink } from 'react-router-dom';
import { Orbit } from 'lucide-react';
import { navGroups } from '@/routes';

interface Props {
  open: boolean;
}

export default function Sidebar({ open }: Props) {
  return (
    <aside
      id="primary-nav-panel"
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line/60 bg-space-900/95 backdrop-blur transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full max-lg:invisible'
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Orbit className="h-7 w-7 text-accent" aria-hidden="true" />
        <div>
          <p className="text-base font-semibold leading-tight tracking-tight">ORBIT Health</p>
          <p className="label-caps !text-[10px]">Crew health monitor</p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map(({ group, items }) => (
          <div key={group} className="mt-4 first:mt-1">
            <p className="label-caps mb-1.5 px-2">{group}</p>
            <ul className="space-y-0.5">
              {items.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-accent bg-accent/10 font-medium text-accent'
                          : 'border-transparent text-ink-muted hover:bg-space-700/60 hover:text-ink'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line/60 px-5 py-4 text-[11px] leading-relaxed text-ink-faint">
        <p>
          <strong className="text-ink-muted">Simulated demo data.</strong> Not a medical device. Does not diagnose.
          Not endorsed by NASA.
        </p>
      </div>
    </aside>
  );
}