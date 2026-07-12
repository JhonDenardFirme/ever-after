// -----------------------------------------------------------------------------
// app/signin/page.tsx — the front door.
//
// Server Component all the way down. The Google button is a <form> whose
// action is an inline Server Action calling NextAuth's signIn() — no client
// JS needed for auth at all. That's the v5 pattern: forms + server actions
// instead of onClick handlers.
//
// The email/password form below the divider is DECORATIVE. There's no
// Credentials provider behind it yet — it's disabled, with an honest note,
// so it reads as "coming soon" instead of "broken". When real password auth
// lands, the fieldset loses `disabled` and lib/auth.ts gains a provider.
//
// ?error=AccessDenied is where NextAuth sends someone who authenticated with
// Google but failed the allowlist. The copy for that is deliberately warm —
// being turned away from a love letter shouldn't feel like a 403.
// -----------------------------------------------------------------------------

import { signIn } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { GoogleIcon } from '@/components/ui/icons';

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const denied = searchParams.error === 'AccessDenied';

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        {/* ---- Masthead ---- */}
        <p className="text-center text-[11px] uppercase tracking-[0.28em] text-ember mb-6">
          {copy.signin.eyebrow}
        </p>
        <h1 className="text-center font-serif text-5xl text-ink mb-3">
          Ever <em>After</em>
        </h1>
        <p className="text-center text-sm text-ink-soft mb-10">{copy.signin.lead}</p>

        {/* ---- The card ---- */}
        <div className="rounded-2xl border border-rule bg-paper2 p-7 shadow-shelf">
          {denied && (
            <p
              role="alert"
              className="mb-5 border-l-2 border-ember pl-3 text-sm text-ink-soft"
            >
              {copy.signin.denied}
            </p>
          )}

          {/* Google — the only real way in */}
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/library' });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-ever-gradient px-6 py-3.5 text-sm tracking-wide text-paper shadow-glow-soft transition-opacity hover:opacity-90"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <GoogleIcon size={13} />
              </span>
              {copy.signin.google}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-rule" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              {copy.signin.divider}
            </span>
            <span className="h-px flex-1 bg-rule" />
          </div>

          {/* Decorative password form — disabled on purpose */}
          <fieldset disabled className="space-y-3 opacity-60">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs uppercase tracking-[0.14em] text-ink-soft"
              >
                {copy.signin.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="off"
                className="w-full rounded-lg border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs uppercase tracking-[0.14em] text-ink-soft"
              >
                {copy.signin.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="off"
                className="w-full rounded-lg border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
          </fieldset>
          <p className="mt-3 text-center text-xs italic text-ink-soft">
            {copy.signin.passwordSoon}
          </p>
        </div>

        <p className="mt-8 text-center font-serif italic text-sm text-ink-soft">
          {copy.brand.tagline}
        </p>
      </div>
    </main>
  );
}
