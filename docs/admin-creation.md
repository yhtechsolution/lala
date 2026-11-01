# Adding administrators from the portal

**Users, Add an administrator** lets a signed-in admin create another admin login. The current admin stays signed in.

## How it works
1. Creating a Firebase login from the browser normally signs the browser in as the new user. To avoid that, the portal opens a temporary second Firebase app whose sign-in is kept in memory only.
2. The new login is created in that temporary app.
3. `admins/<new uid>` is then written with the **current admin's** session. The security rules therefore decide who may grant admin access: only an existing admin can create it, the creator is recorded, and the document may only hold `email`, `displayName`, `createdAt` and `createdBy`.
4. The temporary app is signed out and deleted. If "email them a link" is ticked, a password reset email is sent so the new admin chooses their own password.

This needs no Cloud Functions, so it works on the free Spark plan.

## Failure cases
- **Email already has a login:** if the temporary password matches that login, it is given admin access (this also recovers a half-finished earlier attempt). If the password does not match, nothing is changed.
- **Login created but admin access refused** (for example a rules problem): the form says so. Fix the cause and submit again with the same email and password.
- **Reset email fails:** the admin is still created; share the temporary password securely.

## Limits
- The first admin is still created by hand in the Firebase console, because only an existing admin can create admins.
- Admins cannot be removed, disabled or demoted from the portal. The rules forbid deleting admin documents from the client, and disabling a login needs a trusted backend. Do it in the console if needed.
- A temporary password is at least 12 characters; Firebase's own password policy may require more.

## Tests
`npm test` in `web/` covers validation, every branch of the flow and the password generator (`admin-users.test.ts`) and the form (`add-admin-form.test.tsx`). `npm test` in `backend/` includes a rules test that an existing admin profile cannot be replaced.
