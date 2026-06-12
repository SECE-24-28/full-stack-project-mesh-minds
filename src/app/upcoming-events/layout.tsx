import { Sidebar } from '@/components/navigation';
import { RoleBackground } from '@/components/role-background';

export default function UpcomingEventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[280px] flex-1 min-w-0">
        <RoleBackground>{children}</RoleBackground>
      </div>
    </div>
  );
}
