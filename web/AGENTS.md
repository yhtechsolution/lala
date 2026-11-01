<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history — force pushing, or rebasing/amending/squashing commits that are already pushed — as it rewrites history on Lovable's side and the user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Active workspace routes use Firebase Auth and the shared Firestore schema. Do not restore demo login bypasses or mix sample records into live results. Customer profiles remain private; no communications backend is configured.
- Keep each admin workspace view in its own TanStack route under the shared root shell; this provides direct links and consistent navigation.
