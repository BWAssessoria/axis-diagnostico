import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function PortalReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles').select('client_id').eq('id', user.id).single();

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, title, created_at')
    .eq('client_id', profile?.client_id)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Análises e relatórios estratégicos da sua clínica</p>
      </div>

      {!analyses?.length ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Nenhum relatório disponível ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {analyses.map((a) => (
            <Link
              key={a.id}
              href={`/portal/reports/${a.id}`}
              className="group flex items-center justify-between rounded-xl p-5 transition-all hover:scale-[1.005]"
              style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
              onMouseEnter={undefined}
            >
              <div>
                <p className="font-medium text-foreground">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--bronze)' }}>
                Abrir →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
