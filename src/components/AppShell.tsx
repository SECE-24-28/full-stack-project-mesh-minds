import { Sidebar } from '@/components/navigation';
import { Topbar } from '@/components/Topbar';
import { RoleBackground } from '@/components/role-background';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[280px] flex-1 min-w-0 flex flex-col">
        <RoleBackground>
          <Topbar />
          {children}
        </RoleBackground>
      </div>
    </div>
  );
}
