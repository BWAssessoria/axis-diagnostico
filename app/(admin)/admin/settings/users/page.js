import { createClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/assert-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import CreateUserForm from './_user-form';
import DeleteUserButton from './_delete-button';
import { Shield, User, AlertTriangle } from 'lucide-react';

const roleMeta = {
  admin:  { label: 'Admin',   color: 'var(--bronze)', bg: 'var(--bronze-glow)' },
  client: { label: 'Cliente', color: 'var(--info)',    bg: 'rgba(88,166,255,0.10)' },
};

export default async function UsersPage() {
  const { supabase } = await assertAdmin();

  // Load clients for the create-user form dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('status', 'active')
    .order('business_name');

  // Load users — requires service role key
  let users = [];
  let serviceKeyMissing = false;

  try {
    const admin = createAdminClient();
    const [{ data: authData }, { data: profiles }] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 200 }),
      supabase.from('user_profiles').select('id, role, client_id, full_name, clients(business_name)'),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    users = (authData?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      profile: profileMap[u.id] ?? null,
    }));
  } catch (e) {
    if (e.message.includes('SERVICE_ROLE')) serviceKeyMissing = true;
  }

  const adminUsers  = users.filter((u) => u.profile?.role === 'admin');
  const clientUsers = users.filter((u) => u.profile?.role === 'client');
  const unprofiled  = users.filter((u) => !u.profile);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Acessos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie quem pode acessar o sistema interno e o portal do cliente.
          </p>
        </div>
        {!serviceKeyMissing && <CreateUserForm clients={clients ?? []} />}
      </div>

      {serviceKeyMissing && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.25)' }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-500" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Service role key não configurada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Adicione <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> no arquivo{' '}
              <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-[11px]">.env.local</code> para gerenciar usuários.
              Obtenha a chave em: Supabase → Settings → API → service_role.
            </p>
          </div>
        </div>
      )}

      {!serviceKeyMissing && (
        <div className="space-y-6">
          <UserGroup
            title="Administradores"
            icon={Shield}
            users={adminUsers}
            emptyText="Nenhum admin criado ainda."
          />
          <UserGroup
            title="Clientes com portal"
            icon={User}
            users={clientUsers}
            emptyText="Nenhum acesso de cliente criado."
          />
          {unprofiled.length > 0 && (
            <UserGroup
              title="Sem perfil"
              icon={AlertTriangle}
              users={unprofiled}
              emptyText=""
            />
          )}
        </div>
      )}
    </div>
  );
}

function UserGroup({ title, icon: Icon, users, emptyText }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={13} className="text-muted-foreground/60" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">{title}</p>
        <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/60" style={{ background: 'var(--bg-elevated)' }}>
          {users.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
        {users.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground/50">{emptyText}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--axis-border)' }}>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Usuário</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Papel</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Vinculado a</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Criado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const meta   = roleMeta[u.profile?.role] ?? { label: '—', color: 'var(--text-muted)', bg: 'transparent' };
                const name   = u.profile?.full_name || '—';
                const client = u.profile?.clients?.business_name ?? '—';
                const date   = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—';
                const initial = (u.profile?.full_name || u.email || '?')[0].toUpperCase();

                return (
                  <tr
                    key={u.id}
                    style={i < users.length - 1 ? { borderBottom: '1px solid var(--axis-border-sub)' } : {}}
                    className="transition-colors hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--axis-border)' }}
                        >
                          {initial}
                        </div>
                        <div>
                          <p className="font-medium text-foreground leading-none">{name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{client}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{date}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteUserButton userId={u.id} email={u.email} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
