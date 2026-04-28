import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default async function PortalReportDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles').select('client_id').eq('id', user.id).single();

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, title, content, created_at')
    .eq('id', id)
    .eq('client_id', profile?.client_id)
    .eq('visible_to_client', true)
    .single();

  if (!analysis) notFound();

  const paragraphs = analysis.content
    ? analysis.content.split('\n').filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/portal/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={14} className="opacity-60" />
          Relatórios
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{analysis.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Content */}
      <div className="rounded-2xl p-6" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
        {paragraphs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {paragraphs.map((line, i) => {
              if (line.startsWith('# ')) {
                return <h2 key={i} className="mt-2 text-lg font-bold text-foreground">{line.slice(2)}</h2>;
              }
              if (line.startsWith('## ')) {
                return <h3 key={i} className="mt-2 text-base font-semibold text-foreground/90">{line.slice(3)}</h3>;
              }
              if (line.startsWith('### ')) {
                return <h4 key={i} className="mt-1 text-sm font-semibold text-foreground/80">{line.slice(4)}</h4>;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
              }
              if (line.startsWith('- ') || line.startsWith('• ')) {
                return (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--bronze)' }} />
                    <p className="text-sm text-foreground/80 leading-relaxed">{line.slice(2)}</p>
                  </div>
                );
              }
              return <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>;
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Conteúdo não disponível.</p>
        )}
      </div>
    </div>
  );
}
