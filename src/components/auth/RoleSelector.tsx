'use client';

import { StudentIcon, FacultyIcon, AdminIcon } from '@/components/icons';
import { Role } from '@/types';

interface RoleSelectorProps {
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
}

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  const roles: { value: Role; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'STUDENT', label: 'Student', icon: <StudentIcon />, description: 'Propose events, vote, comment, and book tickets' },
    { value: 'FACULTY', label: 'Faculty', icon: <FacultyIcon />, description: 'Review proposals, approve funding, and mentor ideas' },
    { value: 'ADMIN', label: 'Admin', icon: <AdminIcon />, description: 'Manage all events, venues, and system settings' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Your Role</p>
      <div className="grid grid-cols-3 gap-2">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onRoleChange(role.value)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
              selectedRole === role.value
                ? 'border-blue-500 bg-blue-500/10 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
            }`}
          >
            <div className={`text-2xl ${selectedRole === role.value ? 'text-blue-500' : 'text-slate-600'}`}>{role.icon}</div>
            <span className={`text-sm font-medium ${selectedRole === role.value ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>{role.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}