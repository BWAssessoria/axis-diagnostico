'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createProductAsset, deleteProductAsset } from '@/app/actions/product-assets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Link2, FileText } from 'lucide-react';

const inputClass = [
  'w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30 transition-colors',
].join(' ');

export default function ProductAssetsTab({ productId, assets: initial }) {
  const [assets,    setAssets]    = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [mode,      setMode]      = useState('pdf'); // 'pdf' | 'link'
  const [label,     setLabel]     = useState('');
  const [linkUrl,   setLinkUrl]   = useState('');
  const fileRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setUploading(true);
    setError(null);
    try {
      let fileUrl  = '';
      let fileName = null;

      if (mode === 'pdf') {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error('Selecione um arquivo PDF.');
        const supabase = createClient();
        const ext  = file.name.split('.').pop();
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: storageErr } = await supabase.storage
          .from('product-assets')
          .upload(path, file);
        if (storageErr) throw new Error(storageErr.message);
        fileUrl  = path;
        fileName = file.name;
      } else {
        if (!linkUrl.trim()) throw new Error('Informe uma URL válida.');
        fileUrl = linkUrl.trim();
      }

      const result = await createProductAsset(productId, {
        label: label.trim() || null,
        fileName,
        fileUrl,
        fileType: mode,
      });
      if (result.error) throw new Error(result.error);

      const supabase = createClient();
      const { data: fresh } = await supabase
        .from('product_assets')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      setAssets(fresh ?? []);
      setLabel('');
      setLinkUrl('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset) {
    if (!confirm(`Remover "${asset.label || asset.file_name || asset.file_url}"?`)) return;
    const path   = asset.file_type === 'pdf' ? asset.file_url : null;
    const result = await deleteProductAsset(asset.id, productId, path);
    if (result.error) { setError(result.error); return; }
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  async function openAsset(asset) {
    if (asset.file_type === 'link') { window.open(asset.file_url, '_blank'); return; }
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('product-assets')
      .createSignedUrl(asset.file_url, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  return (
    <div>
      <p className="mb-5 text-sm text-muted-foreground">
        Adicione PDFs e links de metodologia para este produto. Esses materiais enriquecem o contexto do AI Estrategista ao gerar planos.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-xl p-5"
        style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Adicionar material</h3>

        {/* Mode toggle */}
        <div className="mb-4 flex gap-2">
          {[
            { key: 'pdf',  Icon: FileText, label: 'PDF' },
            { key: 'link', Icon: Link2,    label: 'Link' },
          ].map(({ key, Icon, label: l }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                mode === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={mode === key
                ? { background: 'var(--bg-elevated)', border: '1px solid var(--axis-border)' }
                : {}}
            >
              <Icon size={12} />
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Etiqueta (opcional)</Label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Playbook GPS v2"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            {mode === 'pdf' ? (
              <>
                <Label className="text-xs text-muted-foreground">Arquivo PDF</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  required
                  className="w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:text-foreground focus:outline-none"
                />
              </>
            ) : (
              <>
                <Label className="text-xs text-muted-foreground">URL do documento</Label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className={inputClass}
                />
              </>
            )}
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
              background:  'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
              boxShadow:   '0 4px 14px rgba(240,200,32,0.35)',
            }}
          >
            <Upload size={14} />
            {uploading ? 'Enviando...' : 'Adicionar'}
          </Button>
        </div>
      </form>

      {/* List */}
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Nenhum material adicionado ainda.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">PDFs e links de metodologia aparecem aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                    a.file_type === 'link'
                      ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {a.file_type === 'link' ? 'Link' : 'PDF'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.label || a.file_name || a.file_url}
                  </p>
                  {a.label && a.file_name && (
                    <p className="truncate text-xs text-muted-foreground">{a.file_name}</p>
                  )}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                <p className="text-xs text-muted-foreground/50">
                  {new Date(a.created_at).toLocaleDateString('pt-BR')}
                </p>
                <button
                  onClick={() => openAsset(a)}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--bronze)' }}
                >
                  Abrir
                </button>
                <button
                  onClick={() => handleDelete(a)}
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
