# APA Reminder: frontend (React + Vite)

- React 18, Vite, socket.io-client (მყისიერი განახლება ყველა ღია ფანჯარაში).
- გვერდები: დაფა, ისტორია, მომხმარებლები (ადმინი), პარამეტრები; ღია/მუქი თემა.
- `public/tg.html`: Telegram Mini App ფორმა (ბოტის `/new`), შესვლის გარეშე.

## Railway
New → GitHub Repo → ეს repo. Variables: `API_URL=https://<backend-domain>`. Railway თავისით აკეთებს `npm run build` და `npm start`.
`API_URL` გაშვებისას იკითხება (`write-config.cjs`), ამიტომ შეცვლის შემდეგ საკმარისია Redeploy.

## ლოკალურად
```
npm install
npm run dev        # http://localhost:5173 (API: http://localhost:3000)
```
