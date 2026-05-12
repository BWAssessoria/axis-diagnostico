import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AvatarForm, NameForm, EmailForm, PasswordForm } from './_profile-forms';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fullName  = user.user_metadata?.full_name || '';
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const initial   = (fullName || user.email || 'A')[0].toUpperCase();

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informações pessoais e credenciais de acesso.
        </p>
      </div>

      <AvatarForm currentUrl={avatarUrl} initial={initial} />
      <NameForm currentName={fullName} />
      <EmailForm currentEmail={user.email} />
      <PasswordForm />
    </div>
  );
}
