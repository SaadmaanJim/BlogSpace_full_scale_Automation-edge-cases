'use client';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Alert, EmptyState, Loader } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { getErrorMessage } from '@/lib/errors';
import { formatDate, fullName } from '@/lib/format';
import { cn } from '@/lib/cn';
import { userService } from '@/services/user.service';
import type { User } from '@/types';

const StatusBadge = ({ active }: { active: boolean }) => (
  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600')}>{active ? 'Active' : 'Inactive'}</span>
);

function UserDetailsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, loading, error } = useFetch((s) => userService.getById(userId, s), [userId]);
  const rows: [string, string][] = data ? [
    ['Name', fullName(data)], ['Email', data.email], ['Role', data.role],
    ['Status', data.isActive ? 'Active' : 'Inactive'], ['Created', formatDate(data.createdAt)],
  ] : [];
  return (
    <Modal open title="User Information" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      {loading ? <Loader /> : error ? <Alert>{error}</Alert> : data && (
        <div className="space-y-4" data-testid="user-details">
          <Avatar src={data.profileImage} name={fullName(data)} size="lg" />
          <dl className="grid grid-cols-3 gap-y-2">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="col-span-2 font-medium text-slate-800">{v}</dd></div>)}</dl>
        </div>
      )}
    </Modal>
  );
}

export function UsersView() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, error, loading, setData } = useFetch((s) => userService.list(s), []);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (target: User) => {
    setBusyId(target.id);
    try {
      await userService.setStatus(target.id, !target.isActive);
      setData((prev) => prev && prev.map((u) => (u.id === target.id ? { ...u, isActive: !target.isActive } : u)));
      toast.success(`${fullName(target)} ${target.isActive ? 'deactivated' : 'activated'}.`);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  const columns: Column<User>[] = [
    { key: 'user', header: 'User', render: (u) => <div className="flex items-center gap-2"><Avatar src={u.profileImage} name={fullName(u)} size="sm" />{fullName(u)}</div> },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'role', header: 'Role', render: (u) => <span className="capitalize">{u.role}</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge active={u.isActive} /> },
    { key: 'actions', header: 'Action', render: (u) => (
      <div className="flex gap-2">
        <Button variant="secondary" className="px-3 py-1" onClick={() => setViewingId(u.id)} data-testid={`view-user-${u.id}`}>View</Button>
        <Button variant={u.isActive ? 'danger' : 'primary'} className="px-3 py-1" disabled={u.id === me?.id} loading={busyId === u.id} loadingText="Saving..." onClick={() => toggle(u)} data-testid={`toggle-user-${u.id}`}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      {loading ? <Loader label="Loading users..." /> : error ? <Alert>{error}</Alert> : !data || data.length === 0 ? <EmptyState title="No users found." /> : (
        <DataTable columns={columns} rows={data} rowKey={(u) => u.id} testId="users-table" />
      )}
      {viewingId && <UserDetailsModal userId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}
