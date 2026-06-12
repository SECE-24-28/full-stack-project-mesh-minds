import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function CreateAdminUserPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Create Admin User</h1>
      <p className="mt-4 text-slate-600">
        Admin creation functionality would be implemented here. For now, please create admin users directly in the database.
      </p>
    </div>
  );
}