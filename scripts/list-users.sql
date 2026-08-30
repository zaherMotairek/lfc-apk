SELECT u.email, u."firstName", u."lastName", u."platformAccountStatus", 
       COALESCE(string_agg(r.code::text, ', '), 'none') as roles
FROM "User" u
LEFT JOIN "UserRole" ur ON ur."userId" = u.id
LEFT JOIN "Role" r ON r.id = ur."roleId"
GROUP BY u.id
ORDER BY u."createdAt";
