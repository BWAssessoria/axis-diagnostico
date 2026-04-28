import LoginForm from './login-form';

export const metadata = {
  title: 'Entrar — AXIS 360',
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">

      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(240,200,32,0.48) 0%, transparent 60%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--bronze) 1px, transparent 1px), linear-gradient(90deg, var(--bronze) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Logo area */}
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white"
              style={{
                background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
                boxShadow: '0 8px 32px rgba(240,200,32,0.48), 0 0 0 1px rgba(240,200,32,0.35)',
              }}
            >
              A
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AXIS <span style={{ color: 'var(--bronze)' }}>360</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Plataforma de gestão estratégica
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--axis-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          <h2 className="mb-6 text-base font-semibold text-foreground">Entrar na conta</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          AXIS Clinic Brasil · Plataforma restrita
        </p>
      </div>
    </main>
  );
}
