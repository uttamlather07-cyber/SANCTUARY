# ClassQuiz

A free, live classroom quiz & test app for ~20-25 students — built with React,
Tailwind, and Firebase (all free tier). Runs from your laptop; students join
from their own phones/laptops via a room code.

---

## 1. One-time setup (about 10 minutes)

### A. Create a free Firebase project

1. Go to **https://console.firebase.google.com**
2. **Add project** → name it anything (e.g. `classquiz`) → you can disable
   Google Analytics → **Create project**
3. Once created, click the **web icon `</>`** to register a web app → name it
   anything → **do not** check "Firebase Hosting" → **Register app**
4. Firebase shows a `firebaseConfig` object. Copy it — you'll paste it into
   `src/firebase.js` (see step B below).
5. In the left sidebar: **Build → Firestore Database → Create database** →
   choose **"Start in test mode"** → pick any location → **Enable**
6. In the left sidebar: **Build → Authentication → Get started** → enable the
   **Anonymous** sign-in provider (lets students join without an account)
7. Back in **Firestore Database → Rules** tab, replace the default rules with
   the contents of `firestore.rules` in this project, then **Publish**.
   (This matters — Firebase's default "test mode" rules expire after 30 days
   and lock everyone out, including you. The rules in this repo don't expire.)

### B. Paste your config into the app

Open `src/firebase.js` and replace the placeholder object with the one
Firebase gave you in step A.4:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "classquiz-xxxxx.firebaseapp.com",
  projectId: "classquiz-xxxxx",
  storageBucket: "classquiz-xxxxx.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};
```

### C. Set your admin password

Open `src/pages/AdminLogin.jsx` and change this line to a password of your
choice (share it with any co-admins):

```js
const ADMIN_PASSWORD = "quiz2026"; // change this
```

### D. Install dependencies

```bash
npm install
```

---

## 2. Running it

```bash
npm run dev
```

This starts a local server (usually `http://localhost:5173`). Open it on
your laptop.

- **You (teacher):** go to the app → "I'm the teacher" → enter your admin
  password → create a quiz → click **Launch** → a 4-digit room code and
  join link appear.
- **Students:** on their own phone/laptop, they either scan/open the link
  you share, or go to the app and tap "I'm a student," then enter the room
  code + their name.

Everyone needs to be on a network that can reach your laptop's dev server —
easiest is to make sure phones are on the **same Wi-Fi** and you use your
laptop's local network address (Vite prints a "Network:" URL alongside
"Local:" when you run `npm run dev -- --host`) instead of `localhost`.

To get that network URL:
```bash
npm run dev -- --host
```
Then share the `Network: http://192.168.x.x:5173` address (not `localhost`)
with students.

---

## 3. How it works

- **Live Quiz mode:** you control the pace. Each question has a fixed timer;
  when it runs out, you reveal the correct answer (with a live bar chart of
  who picked what), then advance everyone to the next question together.
- **Self-paced Test mode:** students get one total time budget and can move
  freely between questions until they submit or time runs out.
- **Reattempts:** unlimited. For tests, a student can just rejoin and retake
  it. For live quizzes (which are synced to everyone), "Attempt again" after
  a session ends lets a student replay the same questions solo, self-paced.
  Their **best score** is always kept on the leaderboard.
- **Admins:** anyone with the shared admin password can create and launch
  quizzes — handy for adding co-teachers later.

---

## 4. Cost

Firebase's free "Spark" plan covers this comfortably — 20-25 students
running a few quizzes a day is a tiny fraction of the free daily quota
(50K document reads/writes per day, 1GB storage). You will not need to
enter a credit card.

---

## 5. Deploying so you don't need to run `npm run dev` every time (optional)

If you'd rather have a permanent link instead of running this from your
laptop each time, free static hosts that work with this Vite build:

```bash
npm run build
```
This outputs a `dist/` folder you can drag-and-drop onto
**https://app.netlify.com/drop** (free, no account needed for a quick
deploy) or connect to **Firebase Hosting** (also free) for a permanent URL.
