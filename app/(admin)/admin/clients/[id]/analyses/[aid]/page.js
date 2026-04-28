import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AnalysisForm from '../_analysis-form';
import DeleteButton from './_delete-button';
import PdfExportButton from './_pdf-export';
import { ChevronRight } from 'lucide-react';

export default async function AnalysisDetailPage({ params }) {
  const { id, aid } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: analysis }] = await Promise.all([
    supabase.from('clients').select('id, business_name').eq('id', id).single(),
    supabase.from('analyses').select('*').eq('id', aid).eq('client_id', id).single(),
  ]);

  if (!client || !analysis) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="transition-colors hover:text-foreground">Carteira</Link>
        <ChevronRight size={14} className="opacity-40" />
        <Link href={`/admin/clients/${id}?tab=analyses`} className="transition-colors hover:text-foreground">{client.business_name}</Link>
        <ChevronRight size={14} className="opacity-40" />
        <span className="text-foreground">{analysis.title}</span>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{analysis.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Criado em {new Date(analysis.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {analysis.visible_to_client && <span className="ml-2" style={{ color: 'var(--bronze)' }}>· Visível ao cliente</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PdfExportButton analysisId={aid} />
          <DeleteButton clientId={id} analysisId={aid} />
        </div>
      </div>

      <AnalysisForm clientId={id} analysis={analysis} />
    </div>
  );
}
