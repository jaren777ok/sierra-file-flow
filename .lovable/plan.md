

## Plan: Fix Admin Panel and User Registration White Screen Issues

### Root Causes Identified

There are **3 distinct bugs** causing the white screen:

**Bug 1: JWT verification blocks `admin-password-vault`**
The edge function `admin-password-vault` is NOT listed in `supabase/config.toml` with `verify_jwt = false`. This means Supabase requires a valid JWT token for every request. When the admin isn't logged in (or is on the admin panel without a session), all calls to this function fail with a 401 before the code even runs. This explains why "Ver", "Actualizar Lista", and user creation all break.

**Bug 2: CORS headers are incomplete**
The Supabase JS SDK v2 sends additional headers (`x-supabase-client-platform`, etc.) that aren't listed in the edge function's `Access-Control-Allow-Headers`. This causes the browser's CORS preflight to fail silently, resulting in a white screen instead of a useful error.

**Bug 3: `signUp()` auto-logs in the admin as the new user**
When the admin creates a user via `supabase.auth.signUp()`, Supabase automatically logs in as that new user (confirmed in auth logs: `immediate_login_after_signup: true`). This triggers the `useEffect` in Auth.tsx that redirects to `/`, causing the white screen. The admin loses their own session.

### Solution

#### 1. Add `admin-password-vault` to `config.toml`

```toml
[functions.admin-password-vault]
verify_jwt = false
```

#### 2. Fix CORS headers in the edge function

Update `admin-password-vault/index.ts` to include all Supabase SDK headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

#### 3. Create users via edge function instead of client-side `signUp`

Add a `create_user` action to `admin-password-vault` that uses `supabase.auth.admin.createUser()` server-side. This avoids auto-login entirely:

```typescript
if (action === 'create_user') {
  // 1. Create user via admin API (no auto-login)
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true
  });
  
  if (createError) throw createError;
  
  // 2. Save password to vault
  await supabaseAdmin.from('password_vault').upsert({
    user_email: email.toLowerCase().trim(),
    user_password: password,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_email' });
  
  return Response.json({ success: true });
}
```

#### 4. Update Auth.tsx to use the new edge function action

Replace the two-step process (vault save + signUp) with a single call:

```typescript
const { data, error } = await supabase.functions.invoke('admin-password-vault', {
  body: { action: 'create_user', email, password },
  headers: { 'x-admin-password': sessionStorage.getItem('adminPassword') || '' }
});
```

Remove the `signUp()` call entirely when in admin mode.

#### 5. Add error boundaries in AdminPanel

Wrap async operations with proper try/catch that shows toast errors instead of crashing to white screen.

### Files Modified

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `admin-password-vault` with `verify_jwt = false` |
| `supabase/functions/admin-password-vault/index.ts` | Fix CORS + add `create_user` action |
| `src/pages/Auth.tsx` | Use `create_user` action instead of client `signUp()` |

### Impact

- Admin can create users without getting auto-logged-in
- Admin panel loads and functions correctly without JWT
- CORS errors eliminated
- No changes to existing user login flow

