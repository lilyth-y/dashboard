# Dashboard Dev Notes

- Fixed-port dev server (Windows PowerShell):
  - Default 3051
  - Override with PORT

```powershell
# default 3051
pnpm run dev:strict

# custom port
$env:PORT=3000; pnpm run dev:strict
```

- Health check (if `app/api/health/route.ts` exists):

```powershell
curl.exe -sS http://localhost:3051/api/health
```

- If port is busy, stop the process and retry:

```powershell
netstat -ano | findstr :3051
Stop-Process -Id <PID> -Force
```

- Browser:
  - <http://localhost:3051> → redirects to /dashboard
