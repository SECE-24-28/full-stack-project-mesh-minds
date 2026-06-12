import { Sidebar } from '@/components/navigation';
import { RoleBackground } from '@/components/role-background';

export default function EngagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1">
        <RoleBackground>{children}</RoleBackground>
      </div>
    </div>
  );
}
