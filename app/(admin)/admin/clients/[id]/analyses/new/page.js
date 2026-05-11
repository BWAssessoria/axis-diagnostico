import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AnalysisForm from '../_analysis-form';
import { ChevronRight } from 'lucide-react';

export default async function NewAnalysisPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('id', id)
    .single();

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="transition-colors hover:text-foreground">Carteira</Link>
        <ChevronRight size={14} className="opacity-40" />
        <Link href={`/admin/clients/${id}?tab=analyses`} className="transition-colors hover:text-foreground">{client.business_name}</Link>
        <ChevronRight size={14} className="opacity-40" />
        <span className="text-foreground">Nova análise</span>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Nova análise</h1>
        <p className="mt-1 text-sm text-muted-foreground">{client.business_name}</p>
      </div>
      <AnalysisForm clientId={id} />
    </div>
  );
}
