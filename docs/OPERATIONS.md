# Operations (draft)

- **DB backup**: nightly `pg_dump` of local/staging; test restore monthly.
- **Uploads**: `uploads/` or Cloudinary — persist volume in production.
- **Rollback**: redeploy previous image + `prisma migrate deploy` only forward; restore DB from backup if needed.
- **Secrets**: rotate JWT secrets and SMTP credentials quarterly.
