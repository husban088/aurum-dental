# Aurum Dental Atelier — Full-stack version

Design bilkul wohi hai jo aapke original HTML site ka tha (same CSS). Ab data browser ki localStorage ki jagah **MongoDB** mein save hota hai.

## Kaun si technology kahan use hui

| Folder | Technology | Kaam |
|---|---|---|
| `frontend/` | **Angular 18** (standalone, TypeScript) | Poori website + public dashboard |
| `backend-java/` | **Java 21 + Spring Boot 3** | Signup, login (JWT), appointments, reviews. MongoDB mein save. Har event **Kafka** par bhejta hai |
| `notification-kotlin/` | **Kotlin + Spring Boot** | Kafka se events sunta hai, MongoDB mein notifications save karta hai (dashboard ka "Recent activity") |
| `analytics-python/` | **Python + FastAPI** | Kafka se events sunta hai, appointments ka analytics banata hai (dashboard ka "Popular treatments") |
| `docker-compose.yml` | **MongoDB 7 + Kafka 3.8 (KRaft)** + sab services | Ek command se sab kuch chalta hai |

```
Angular (nginx :4200) ──/api──────────▶ Java API :8080 ──▶ MongoDB
                      ──/notify───────▶ Kotlin  :8081 ──▶ MongoDB      ▲
                      ──/analytics────▶ Python  :8000 ──▶ MongoDB      │
                                             ▲                          │
              Java API ──(appointment-events)──▶ Kafka ──▶ Kotlin + Python
```

## Chalane ka tareeqa (sab se aasan): Docker

1. Docker Desktop install karein aur start karein.
2. Is folder mein terminal kholen aur chalayen:

```
docker compose up --build
```

Pehli baar 5 se 10 minute lagte hain (downloads). Phir browser mein kholen: **http://localhost:4200**

Band karne ke liye `Ctrl+C`, dobara chalane ke liye `docker compose up`. Data `mongo_data` volume mein safe rehta hai. Sab kuch mita kar naya shuru karna ho: `docker compose down -v`.

## Website kaise kaam karti hai

- **Signup / Login**: `/signup` aur `/login`. Password BCrypt se hash hokar MongoDB mein jata hai, login JWT token se hota hai.
- **Appointment book karna**: `/book` par login zaroori hai. Login na ho to khud login page par le jata hai, login ke baad wapis booking par aa jata hai. Booking MongoDB (`appointments`) mein save hoti hai.
- **Reviews**: dekhna sab ke liye open hai, likhne ke liye login chahiye. MongoDB (`reviews`) mein save.
- **Dashboard**: `/dashboard` — **koi password nahi**, navbar aur footer mein "Dashboard" link se sab ko dikhta hai. Overview, Appointments (search, status badalna, delete, new appointment), Patients, Reviews. Har 15 second baad khud refresh hota hai, aur naye bookings foran nazar aati hain.
- **Dummy data**: pehli baar chalne par MongoDB khali ho to **5 dummy appointments** aur 6 reviews khud add ho jate hain (Hira Siddiqui, Usman Tariq, Maryam Ali, Bilal Ahmed, Sadia Noor).

## Dentists ki HD photos

`frontend/public/images/` mein ye 3 files rakhein: `dr-ayesha.jpg`, `dr-zain.jpg`, `dr-sana.jpg` (portrait 4:5, jaise 1200x1500). Photo na ho to gold frame mein initials dikhte hain. Docker par photos badalne ke baad: `docker compose up --build -d web`.

## Bina Docker ke (development)

Zaroorat: Java 21, Maven, Node 20+, Python 3.12, aur MongoDB + Kafka chalte hue.

```
docker compose up -d mongo kafka                 # sirf database aur Kafka Docker mein

cd backend-java        && mvn spring-boot:run     # http://localhost:8080
cd notification-kotlin && mvn spring-boot:run     # http://localhost:8081
cd analytics-python    && pip install -r requirements.txt && uvicorn app.main:app --port 8000
cd frontend            && npm install && npm start   # http://localhost:4200 (proxy.conf.json khud API tak pohanchata hai)
```

## API (Java, port 8080)

| Method | Path | Login? | Kaam |
|---|---|---|---|
| POST | `/api/auth/signup` | nahi | account banao |
| POST | `/api/auth/login` | nahi | login |
| GET | `/api/auth/me` | haan | apni profile |
| GET | `/api/appointments` | nahi | sab appointments (dashboard) |
| GET | `/api/appointments/mine` | haan | apni appointments |
| POST | `/api/appointments` | haan | website se booking |
| POST | `/api/appointments/manual` | nahi | dashboard se new appointment |
| PATCH | `/api/appointments/{id}/status` | nahi | status badlo |
| DELETE | `/api/appointments/{id}` | nahi | delete |
| GET/POST/DELETE | `/api/reviews` | POST ke liye haan | reviews |

## Zaroori baatein

- Dashboard aapke kehne par bina password ke public hai, is liye jis ke paas link ho woh appointments dekh, badal aur delete kar sakta hai. Website online daalne se pehle dashboard ke liye login lagana behtar hoga.
- `docker-compose.yml` mein `JWT_SECRET` badal dein jab site live karein.
- Kafka ya Kotlin/Python band ho tab bhi website, login aur booking chalte rahte hain. Bas dashboard ke do extra cards (Recent activity, Popular treatments) chhup jate hain.


## Frontend styling (Tailwind CSS)

The whole Angular frontend is styled with **Tailwind CSS v3** (no Bootstrap CSS/JS).
- `frontend/tailwind.config.js` holds the design tokens (colours, gradients, shadows, animations) and uses the same breakpoints as before (576 / 768 / 992 / 1200 / 1400 px).
- `frontend/src/styles.css` only has the Tailwind directives, a few base defaults, and the reusable `btn-gold`, `btn-line` and `field` components.
- Icons still come from the `bootstrap-icons` icon font (icons only, no Bootstrap CSS).
- Run `npm install` in `frontend/` once, then `npm start` as usual.
