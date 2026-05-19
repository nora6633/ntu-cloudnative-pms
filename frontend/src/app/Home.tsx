import { useState } from 'react';
import {
  ClipboardList, FileCheck, FileText, Search, UserPlus,
  PlayCircle, BadgeCheck, LayoutList, History, LogOut,
} from 'lucide-react';

import { MyEvaluationSection }      from './sections/MyEvaluationSection';
import { ReviewGoalSection }         from './sections/ReviewGoalSection';
import { ReviewSection }             from './sections/ReviewSection';
import { TemplateSection }           from './sections/TemplateSection';
import { AuditSection }              from './sections/AuditSection';
import { RegisterSection }           from './sections/RegisterSection';
import { StartEvaluationSection }    from './sections/StartEvaluationSection';
import { FinalizeSection }           from './sections/FinalizeSection';
import { ViewAllSection }            from './sections/ViewAllSection';
import { HistorySection }            from './sections/HistorySection';
import { useAuth }                   from '../auth/AuthContext';
import type { Role }                 from '../auth/AuthContext';
import { Button }                    from './components/ui/button';

// ── Section definitions ───────────────────────────────────────────────────

type SectionId =
  | 'start_evaluation' | 'my_evaluation' | 'review_goal' | 'review'
  | 'finalize' | 'view_all' | 'history' | 'template' | 'audit' | 'register';

const SECTION_ROLES: Record<SectionId, Role[]> = {
  start_evaluation: ['ADMIN'],
  my_evaluation:    ['EMPLOYEE', 'MANAGER', 'HR', 'USER'],
  review_goal:      ['MANAGER'],
  review:           ['MANAGER'],
  finalize:         ['HR'],
  view_all:         ['ADMIN'],
  history:          ['EMPLOYEE', 'MANAGER', 'USER'],
  template:         ['HR'],
  audit:            ['ADMIN'],
  register:         ['ADMIN'],
};

const menuItems: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'start_evaluation', label: 'Start Evaluation', icon: PlayCircle    },
  { id: 'my_evaluation',    label: 'My Evaluation',    icon: ClipboardList },
  { id: 'review_goal',      label: 'Review Goal',      icon: FileCheck     },
  { id: 'review',           label: 'Review',           icon: FileCheck     },
  { id: 'finalize',         label: 'Finalize',         icon: BadgeCheck    },
  { id: 'view_all',         label: 'View All',         icon: LayoutList    },
  { id: 'history',          label: 'History',          icon: History       },
  { id: 'template',         label: 'Template',         icon: FileText      },
  { id: 'audit',            label: 'Audit',            icon: Search        },
  { id: 'register',         label: 'Register',         icon: UserPlus      },
];

// ── App ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, logout } = useAuth();
  const role = user?.role ?? 'EMPLOYEE';

  const visibleItems = menuItems.filter((item) =>
    SECTION_ROLES[item.id].includes(role),
  );

  const [activeSection, setActiveSection] = useState<SectionId>(
    () => visibleItems[0]?.id ?? 'my_evaluation',
  );

  // If the current section became hidden (e.g. after a role change), fall back
  const safeSection = visibleItems.some((i) => i.id === activeSection)
    ? activeSection
    : (visibleItems[0]?.id ?? 'my_evaluation');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Performance Hub</h2>
          {user && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {user.username} · {user.role}
            </p>
          )}
        </div>

        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      safeSection === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {safeSection === 'start_evaluation' && <StartEvaluationSection />}
        {safeSection === 'my_evaluation'    && <MyEvaluationSection />}
        {safeSection === 'review_goal'      && <ReviewGoalSection />}
        {safeSection === 'review'           && <ReviewSection />}
        {safeSection === 'finalize'         && <FinalizeSection />}
        {safeSection === 'view_all'         && <ViewAllSection />}
        {safeSection === 'history'          && <HistorySection />}
        {safeSection === 'template'         && <TemplateSection />}
        {safeSection === 'audit'            && (
          <AuditSection />
        )}
        {safeSection === 'register'         && <RegisterSection />}
      </div>
    </div>
  );
}
