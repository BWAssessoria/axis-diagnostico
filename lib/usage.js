// Preços por token (USD) — atualizar se Anthropic mudar tabela
const PRICING = {
  'claude-sonnet-4-6': {
    input:         0.000003,    // $3/MTok
    output:        0.000015,    // $15/MTok
    cacheWrite:    0.00000375,  // $3.75/MTok
    cacheRead:     0.0000003,   // $0.30/MTok
  },
  'claude-haiku-4-5-20251001': {
    input:         0.00000025,  // $0.25/MTok
    output:        0.00000125,  // $1.25/MTok
    cacheWrite:    0.0000003,   // $0.30/MTok
    cacheRead:     0.00000003,  // $0.03/MTok
  },
};

export function calculateCost(usage, model) {
  const p = PRICING[model] ?? PRICING['claude-sonnet-4-6'];
  return (
    (usage.input_tokens ?? 0)                  * p.input +
    (usage.output_tokens ?? 0)                 * p.output +
    (usage.cache_creation_input_tokens ?? 0)   * p.cacheWrite +
    (usage.cache_read_input_tokens ?? 0)       * p.cacheRead
  );
}

export async function logUsage(supabase, { clientId, type, model, usage }) {
  const costUsd = calculateCost(usage, model);

  console.log(
    `[usage] ${type} | client=${clientId} | ` +
    `in=${usage.input_tokens} out=${usage.output_tokens} ` +
    (usage.cache_read_input_tokens ? `cache_read=${usage.cache_read_input_tokens} ` : '') +
    `| $${costUsd.toFixed(4)} USD`
  );

  await supabase.from('usage_logs').insert({
    client_id:            clientId,
    type,
    model,
    input_tokens:         usage.input_tokens ?? 0,
    output_tokens:        usage.output_tokens ?? 0,
    cache_creation_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_tokens:    usage.cache_read_input_tokens ?? 0,
    cost_usd:             costUsd,
  });
}
