'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createUploadRecord, deleteUpload } from '@/app/actions/uploads';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

const TYPE_LABELS = {
  gbp_check:  'GBP Check',
  whatsapp:   'WhatsApp',
  instagram:  'Instagram',
  other:      'Outro',
};

const TYPE_COLORS = {
  gbp_check: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  whatsapp:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  other:     'bg-secondary text-muted-foreground border-border/50',
};

const inputClass = [
  'w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30 transition-colors',
].join(' ');

const selectClass = [
  'w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2',
  'text-sm text-foreground outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30 transition-colors',
].join(' ');

export default function UploadsTab({ clientId, uploads: initial }) {
  const [uploads, setUploads] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError]   = useState(null);
  const [type, setType]     = useState('gbp_check');
  const [label, setLabel]   = useState('');
  const fileRef = useRef(null);

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from('client-uploads')
        .upload(path, file);

      if (storageErr) throw new Error(storageErr.message);

      const result = await createUploadRecord(clientId, {
        type,
        label: label.trim() || null,
        fileName: file.name,
        fileUrl: path,
      });

      if (result.error) throw new Error(result.error);

      const { data: freshUploads } = await supabase
        .from('client_uploads')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      setUploads(freshUploads ?? []);
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(upload) {
    if (!confirm(`Remover "${upload.file_name}"?`)) return;
    const result = await deleteUpload(upload.id, clientId, upload.file_url);
    if (result.error) { setError(result.error); return; }
    setUploads((prev) => prev.filter((u) => u.id !== upload.id));
  }

  async function getSignedUrl(path) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('client-uploads')
      .createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  return (
    <div>
      {/* Formulário de upload */}
      <form onSubmit={handleUpload} className="mb-6 rounded-xl p-5" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
        <h3 className="mb-4 text-sm font-semibold text-foreground">Novo upload</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Etiqueta (opcional)</Label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Março 2026"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Arquivo (PDF / imagem)</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/*"
              required
              className="w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:text-foreground focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            disabled={uploading}
            size="sm"
            className="h-9 gap-2 font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
              boxShadow: '0 4px 14px rgba(240,200,32,0.35)',
            }}
          >
            <Upload size={14} />
            {uploading ? 'Enviando...' : 'Enviar arquivo'}
          </Button>
        </div>
      </form>

      {/* Lista de uploads */}
      {uploads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Nenhum arquivo enviado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {uploads.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[u.type] ?? TYPE_COLORS.other}`}>
                  {TYPE_LABELS[u.type] ?? u.type}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{u.label || u.file_name}</p>
                  {u.label && <p className="truncate text-xs text-muted-foreground">{u.file_name}</p>}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                <p className="text-xs text-muted-foreground/50">
                  {new Date(u.uploaded_at).toLocaleDateString('pt-BR')}
                </p>
                <button
                  onClick={() => getSignedUrl(u.file_url)}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--bronze)' }}
                >
                  Abrir
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="text-xs text-red-400 transition-opacity hover:opacity-70"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
