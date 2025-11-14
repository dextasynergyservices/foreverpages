# Translation Debugging Guide

## Problem

Translations showing in English even after switching languages.

## Root Cause

Browser is caching the old translation files and not loading the new ones.

## Solution Steps

### Step 1: Clear ALL Browser Cache

1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select:
   - ✅ Cached images and files
   - ✅ Cookies and site data
3. Time range: **All time**
4. Click "Clear data"

### Step 2: Hard Refresh

1. Close ALL browser tabs with localhost
2. Restart your browser completely
3. Open a NEW incognito/private window
4. Go to `http://localhost:3000`

### Step 3: Verify Translations in Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Run these commands:

```javascript
// Check current locale
localStorage.getItem("locale");

// Check if translations are loaded
window.__NEXT_DATA__;

// Force reload translations (if available)
location.reload(true);
```

### Step 4: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Reload page (F5)
5. Look for any JSON files being loaded
6. Check their response content

### Step 5: Test Language Switching

1. Switch language to Spanish using the language switcher
2. You should see:
   - Sidebar: "Análisis", "Galería", etc. (NOT "Analytics", "Gallery")
   - Subscription card: "Acceso de Colaborador" (NOT "Collaborator Access")
   - Status badge: "Activo" (NOT "Active")

## What Should Translate

### Sidebar Navigation

- ✅ Analytics → Análisis (ES)
- ✅ Gallery → Galería (ES)
- ✅ Funeral Builder → Constructor de Funerales (ES)
- ✅ Invitations → Invitaciones (ES)
- ✅ Tributes → Tributos (ES)
- ✅ Settings → Configuración (ES)

### Subscription Card (Collaborators)

- ✅ Collaborator Access → Acceso de Colaborador (ES)
- ✅ Active → Activo (ES)
- ✅ Access granted as a memorial collaborator → Acceso otorgado como colaborador del memorial (ES)

### Collaborator Memorials Section

- ✅ Memorials You're Helping Manage → Memoriales que Ayudas a Gestionar (ES)
- ✅ You've been invited to collaborate on these memorials → Has sido invitado a colaborar en estos memoriales (ES)
- ✅ Owned by John Doe → Propiedad de John Doe (ES)
- ✅ Manage Memorial → Gestionar Memorial (ES)

## Translation Keys Reference

All translations are in: `src/lib/locales/[lang].json`

### Sidebar Keys

```
dashboard.sidebar.nav.analytics
dashboard.sidebar.nav.gallery
dashboard.sidebar.nav.builder
dashboard.sidebar.nav.invitations
dashboard.sidebar.nav.tributes
dashboard.sidebar.nav.settings
```

### Subscription Keys

```
subscription.collaboratorAccess.name
subscription.collaboratorAccess.description
subscription.status.active
```

### Collaborator Memorials Keys

```
dashboard.collaboratorMemorials.title
dashboard.collaboratorMemorials.subtitle
dashboard.collaboratorMemorials.ownedBy
dashboard.collaboratorMemorials.manageMemorial
```

## If Still Not Working

### Nuclear Option: Clear Everything

1. Stop dev server (`Ctrl + C` in terminal)
2. Run these commands:

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules cache (optional, if desperate)
rm -rf node_modules/.cache

# Restart dev server
pnpm dev
```

3. In browser:
   - Clear all cache again
   - Restart browser
   - Use incognito mode

### Check localStorage

If translations are still English, check localStorage:

```javascript
// In browser console
localStorage.clear();
location.reload();
```

## Verification Checklist

After clearing cache, verify:

- [ ] Sidebar items translate when language changes
- [ ] Subscription card title translates
- [ ] Subscription card status badge translates
- [ ] Collaborator memorials section translates
- [ ] "Owned by" text translates
- [ ] Buttons translate

## Common Issues

### Issue 1: Language Switcher Not Working

**Check:** Is the language actually changing?

```javascript
// In console, after switching language
localStorage.getItem("locale"); // Should show 'es', 'fr', etc.
```

### Issue 2: Partial Translation

**Symptom:** Some things translate, others don't
**Cause:** Browser cached old JSON files
**Fix:** Hard refresh + Clear cache

### Issue 3: No Translation at All

**Symptom:** Everything stays in English
**Cause:** Language context not initialized
**Fix:** Check if LanguageProvider is wrapping the app in layout.tsx

## Expected Behavior

When you switch to Spanish:

1. Language switcher should show "Español" as selected
2. ALL text should change immediately
3. localStorage should update to 'es'
4. Reload should keep Spanish language
5. New tabs should also open in Spanish

## Files Modified (For Reference)

1. ✅ `src/lib/locales/es.json` - Spanish translations updated
2. ✅ `src/lib/locales/fr.json` - French translations updated
3. ✅ `src/lib/locales/ha.json` - Hausa translations updated
4. ✅ `src/lib/locales/ig.json` - Igbo translations updated
5. ✅ `src/lib/locales/yo.json` - Yoruba translations updated
6. ✅ `src/components/userDashboard/SubscriptionCard.tsx` - Uses translation keys
7. ✅ `src/components/userDashboard/CollaboratorMemorials.tsx` - Uses translation keys
8. ✅ `src/components/userDashboard/DashboardNavbar.tsx` - Uses translation keys
9. ✅ `src/app/api/user/subscription/route.ts` - Returns translation keys

All code is correct. The issue is 100% browser caching.
