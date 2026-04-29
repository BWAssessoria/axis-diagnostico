'use client';

import { useState } from 'react';
import ProductForm from './_product-form';
import ProductAssetsTab from './_product-assets-tab';

const TABS = [
  { key: 'config',      label: 'Configuração' },
  { key: 'metodologia', label: 'Metodologia'  },
];

export default function ProductDetailTabs({ product, assets }) {
  const [active, setActive] = useState('config');

  return (
    <div>
      <div
        className="mb-6 flex gap-1 rounded-xl p-1"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--axis-border)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              active === t.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={active === t.key
              ? { background: 'var(--bg-elevated)', border: '1px solid var(--axis-border)' }
              : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'config'      && <ProductForm product={product} />}
      {active === 'metodologia' && <ProductAssetsTab productId={product.id} assets={assets} />}
    </div>
  );
}
