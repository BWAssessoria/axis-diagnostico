import { createClient } from '@/lib/supabase/server';
import PortalSidebar from '@/components/portal-sidebar';

export default async function PortalLayout({ children }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('client_id')
    .eq('id', user?.id)
    .single();

  const { data: client } = profile?.client_id
    ? await supabase.from('clients').select('business_name').eq('id', profile.client_id).single()
    : { data: null };

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <PortalSidebar clientName={client?.business_name ?? null} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
