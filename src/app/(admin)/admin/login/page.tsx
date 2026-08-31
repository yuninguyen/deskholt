import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAdminTranslations } from '@/lib/admin/i18n/server';
import { loginAction } from './actions';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const translations = await getAdminTranslations();
  const { from, error } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-body text-lg font-semibold">{translations.login.title}</CardTitle>
          <CardDescription>{translations.login.prompt}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            {from && <input type="hidden" name="from" value={from} />}

            {error && (
              <p
                id="password-error"
                role="alert"
                className="rounded-md border border-admin-destructive/40 bg-admin-destructive/10 px-3 py-2 text-sm text-admin-destructive"
              >
                {translations.login.invalidPassword}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{translations.login.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                aria-describedby={error ? 'password-error' : undefined}
              />
            </div>

            <Button type="submit" className="w-full">
              {translations.login.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
