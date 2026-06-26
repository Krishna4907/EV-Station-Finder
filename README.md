# ⚡ VOLTpath — Smart EV Trip Planner

<div align="center">

![VOLTpath Banner](https://capsule-render.vercel.app/api?type=waving&color=00C896&height=200&section=header&text=VOLTpath&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Smart%20EV%20Charging%20Trip%20Planner%20for%20India&descAlignY=58&descAlign=50&animation=fadeIn)

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-00C896?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square" />
  <img src="https://img.shields.io/badge/India-🇮🇳-orange?style=flat-square" />
</p>

<br/>

**VOLTpath** is a smart EV trip planner that tells you *exactly* which charging station to stop at — based on your car model, real-time battery level, and route distance. No more range anxiety.

<br/>

[🚀 Live Demo](https://ev-station-finder.vercel.app) · [🐛 Report Bug](https://github.com/Krishna4907/EV-Station-Finder/issues) · [✨ Request Feature](https://github.com/Krishna4907/EV-Station-Finder/issues)

</div>

---

## 🎯 The Problem

Most EV apps in India just show a list of nearby charging stations. They don't answer the real question every EV driver has before a long trip:

> *"I'm going from Delhi to Ranchi with 80% battery in my Nexon EV. Where exactly should I stop to charge, and for how long?"*

**VOLTpath answers that question.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication
- Email/Password & Google SSO
- Firebase Auth with protected routes
- Per-user data isolation

### 🚗 Smart Car Profile
- Dropdown of 25+ Indian EVs
- Saves car model, range & connector type
- Persisted to Firestore per user

### 🔍 Smart Search
- Place autocomplete via Photon API
- Suggestions after 2+ characters
- Search history (last 5 routes)

</td>
<td width="50%">

### ⚡ Trip Planner Algorithm
- Greedy interval scheduling
- Auto-suggests charging stops by range
- Battery % slider input
- "Arrive at ~X%" predictions

### 🗺️ Interactive Map
- Leaflet.js split-view layout
- Multi-point route sampling
- Distinct pins for suggested stops
- Click pin ↔ highlights card

### 📊 Station Detail Drawer
- Charging time estimate
- Cost estimate in ₹
- Connector compatibility check
- Navigate via Google Maps

</td>
</tr>
</table>

---

## 🧠 How the Trip Planner Works

```
User enters: Delhi → Ranchi | Nexon EV | 80% battery
                        ↓
  Current range = (80/100) × 312 km = 249 km
                        ↓
  Total distance = 999 km  →  Stops needed
                        ↓
  Walk along route, find station at ~75% of range (187 km)
  → Stop 1: Statiq Jaypee Agra (arrive ~15%)
                        ↓
  Recharge to 80% → new range = 249 km
  Find next station at 187 km ahead
  → Stop 2: Bundelkhand Expressway Rest Area (arrive ~27%)
                        ↓
  Repeat until destination is reachable
  → Stop 3: Tata Power, Lucknow (arrive ~52%)
                        ↓
  ✅ Trip planned — 3 stops, 999 km covered
```

The algorithm uses **greedy interval scheduling** — at each step, jump as far as safely possible (75% of remaining range as buffer), find the nearest station to that target point, then repeat.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Map | Leaflet.js + CARTO tiles (OpenStreetMap) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Station Data | OpenChargeMap API |
| Geocoding | Nominatim (OpenStreetMap) |
| Autocomplete | Photon API (Komoot) |
| Routing | Greedy interval scheduling (custom) |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project
- OpenChargeMap API key (free at [openchargemap.org](https://openchargemap.org))

### Installation

```bash
# Clone the repo
git clone https://github.com/Krishna4907/EV-Station-Finder.git
cd EV-Station-Finder

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** → Start in test mode
5. Add your web app config to `src/Firebase/config.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /searchLogs/{docId} {
      allow read, write: if true;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── CarProfileModal.jsx      # EV model picker + Firestore save
│   ├── Logo.jsx
│   ├── MapPanel.jsx             # Leaflet map with custom pins
│   ├── Navbar.jsx
│   ├── StationDetailDrawer.jsx  # Slide-in station info + estimates
│   └── SuggestionsDropdown.jsx  # Autocomplete + search history UI
├── context/
│   └── AuthContext.jsx          # Firebase auth state provider
├── data/
│   └── evCars.js                # 25+ Indian EVs database
├── Firebase/
│   └── config.js                # Firebase init + exports
├── hooks/
│   └── usePlaceAutocomplete.js  # Debounced Photon API hook
├── pages/
│   ├── Home.jsx                 # Search + trip setup
│   ├── Login.jsx
│   ├── MapView.jsx              # Map + station list + trip planner
│   └── Signup.jsx
└── utils/
    ├── chargingEstimate.js      # Time + cost calculation functions
    └── tripPlanner.js           # Greedy interval scheduling algorithm
```

---

## 🔌 Supported EV Models

<details>
<summary>Click to expand — 25+ Indian EVs supported</summary>

| Brand | Models |
|---|---|
| **Tata Motors** | Nexon EV, Nexon EV Max, Tiago EV, Tigor EV, Punch EV, Curvv EV |
| **MG Motor** | ZS EV, Comet EV, Windsor EV |
| **Hyundai / Kia** | Ioniq 5, Kona Electric, EV6, EV9 |
| **BYD** | Atto 3, Seal, e6 |
| **Volvo / BMW / Mercedes** | XC40 Recharge, i4, iX, EQB, EQS |
| **Audi** | e-tron, e-tron GT |
| **Others** | Mini Electric, Ola S1 Pro |

</details>

---



## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "feat: add your feature"

# Push and open a PR
git push origin feature/your-feature-name
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Krishna Pandey**

<p align="left">
  <a href="https://linkedin.com/in/krishnapandey43">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  <a href="https://github.com/Krishna4907">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://leetcode.com/u/Krishna_43/">
    <img src="https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=leetcode&logoColor=black" />
  </a>
  <a href="https://codeforces.com/profile/krishnap_14">
    <img src="https://img.shields.io/badge/Codeforces-1F8ACB?style=for-the-badge&logo=codeforces&logoColor=white" />
  </a>
</p>

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=00C896&height=100&section=footer&animation=fadeIn)

**If this project helped you, consider giving it a ⭐**

</div>
