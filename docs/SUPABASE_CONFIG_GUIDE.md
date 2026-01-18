# ⚙️ GUIDE DE CONFIGURATION - SUPABASE

Pour que l'inscription et la confirmation d'email fonctionnent, vous devez configurer ces deux éléments dans votre dashboard Supabase.

## 1. Configuration des URLs
1.  Allez dans **Authentication** → **URL Configuration**.
2.  **Site URL** : `https://voicetracker.vercel.app` (ou votre domaine actuel).
3.  **Redirect URLs** : Ajoutez `https://voicetracker.vercel.app/**` pour autoriser toutes les redirections vers votre app.

## 2. Template d'Email "Confirm signup"
1.  Allez dans **Authentication** → **Email Templates**.
2.  Sélectionnez **"Confirm signup"**.
3.  Remplacez le contenu par le code HTML ci-dessous :

```html
<h2>Confirmez votre inscription à VoiceTracker</h2>

<p>Merci de vous être inscrit ! Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Confirmer mon email
  </a>
</p>

<p>Ou copiez ce lien dans votre navigateur :</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</p>

<p>Ce lien expire dans 24 heures.</p>
<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
```

## 3. Template d'Email "Magic Link" (Optionnel)
Si vous utilisez le Magic Link, utilisez ce lien :
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`

---
> [!IMPORTANT]
> N'oubliez pas de cliquer sur **"Save"** après avoir modifié chaque template.
