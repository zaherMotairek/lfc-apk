# Checklist de lancement OLSC — RedLeb Hub

Checklist pour passer du **MVP local** à un **lancement production** pour OLSC Lebanon.

---

## 1. Avant le déploiement

- [ ] Copier `.env.production.example` vers `.env` sur le serveur
- [ ] Générer des secrets JWT forts (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- [ ] Changer `SEED_SUPER_ADMIN_PASSWORD` avant le premier seed
- [ ] Configurer `APP_URL`, `API_URL`, `VITE_API_URL` avec le domaine HTTPS réel
- [ ] Configurer SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- [ ] Configurer Cloudinary pour les avatars en production (recommandé)
- [ ] Vérifier que le comité OLSC a approuvé le contenu et le branding

---

## 2. Déploiement Docker (recommandé)

Prérequis : Docker + Docker Compose sur le serveur.

```powershell
copy .env.production.example .env
# Éditer .env avec les vraies valeurs

npm.cmd run docker:prod:up
```

Services :
- **Web** : port `8080` (ou `WEB_PORT`)
- **API** : port `3000` (ou `API_PORT`)
- **PostgreSQL** : interne au réseau Docker

Premier déploiement — seed manuel (une seule fois) :

```powershell
docker exec -it kop-api-prod sh -c "cd /app/apps/api && npx tsx prisma/seed.ts"
```

Vérifications :

```powershell
curl http://localhost:3000/api/health
curl http://localhost:8080
```

Le endpoint `/api/health` indique l'état des intégrations (`email`, `mediaStorage`, `productionReady`).

---

## 3. Déploiement sans Docker (alternative)

### Backend

```powershell
npm.cmd run build
npm.cmd run prisma:migrate:deploy
npm.cmd run prisma:seed
npm.cmd run start:prod -w @kop/api
```

Variables : `NODE_ENV=production`, secrets JWT, `DATABASE_URL`, SMTP, Cloudinary.

### Frontend

```powershell
# apps/web/.env.production
VITE_API_URL=https://api.votredomaine.com/api

npm.cmd run build -w @kop/web
```

Servir `apps/web/dist` via Nginx / Netlify / Vercel avec fallback SPA (`try_files ... /index.html`).

---

## 4. Sécurité post-déploiement

- [ ] Se connecter en Super Admin et **changer le mot de passe**
- [ ] Confirmer que les tokens d'invitation / reset **ne s'affichent plus** dans l'API (SMTP actif + `NODE_ENV=production`)
- [ ] Activer HTTPS (Let's Encrypt / certificat)
- [ ] Restreindre l'accès admin si possible (VPN / IP allowlist)
- [ ] Planifier les sauvegardes PostgreSQL quotidiennes
- [ ] Vérifier rate limiting sur `/api/auth/*` (activé par défaut)

---

## 5. Contenu & membres OLSC

- [ ] Importer les membres officiels existants (`/admin/members` ou import CSV)
- [ ] S'assurer que chaque `officialMemberId` vient du comité uniquement
- [ ] Envoyer les invitations — les emails partent automatiquement si SMTP est configuré
- [ ] Publier les pages CMS (`/admin/cms`)
- [ ] Publier actualités et événements
- [ ] Ne pas utiliser de contenu LFC scrapé ni d'images protégées sans autorisation

---

## 6. Tests de lancement (production)

| Test | URL / action |
|------|----------------|
| Health | `GET /api/health` |
| Login admin | `/login` |
| Créer membre + invitation email | `/admin/members` |
| Activer compte | `/accept-invitation?token=...` |
| Carte d'adhésion | `/app/membership-card` |
| Profil + avatar | `/app/profile` |
| Match + prédiction | `/app/matches` |
| Leaderboard | `/app/leaderboard` |
| Communauté + événement | `/app/community` |
| Notifications | `/app/notifications` |
| Hall of Fame | `/app/hall-of-fame` |
| Mot de passe oublié | `/forgot-password` (email reçu) |

Script automatisé local : `scripts/e2e-verify.ps1`

---

## 7. Monitoring & maintenance

- [ ] Surveiller les logs API (`docker logs kop-api-prod -f`)
- [ ] Surveiller l'espace disque (`uploads/` si Cloudinary non utilisé)
- [ ] Mettre à jour les dépendances npm régulièrement
- [ ] Appliquer les migrations : `npm.cmd run prisma:migrate:deploy`

---

## Variables d'environnement clés

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | PostgreSQL |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Auth |
| `APP_URL` | Frontend (CORS + liens email) |
| `API_URL` | Backend public |
| `VITE_API_URL` | Build frontend |
| `SMTP_*` | Emails invitation + reset password |
| `CLOUDINARY_*` | Avatars cloud (prod) |
| `CORS_ORIGINS` | Origines supplémentaires (staging) |

---

## Rappels métier OLSC

- L'adhésion officielle OLSC reste **externe** à la plateforme
- Une seule adhésion **ACTIVE** à la fois par membre
- La carte numérique est générée **après activation** du compte
- La vérification QR requiert la permission `VERIFY_MEMBERSHIP_CARDS`
