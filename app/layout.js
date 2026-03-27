import './globals.css';

export const metadata = {
  title: 'AXIS 360 — Mapeamento Estratégico',
  description: 'Mapeamento estratégico completo para clínicas de estética avançada',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
