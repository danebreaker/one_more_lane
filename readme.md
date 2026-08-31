# One More Lane: Highway Roguelike

## Overview

**One More Lane** is a Balatro-inspired **Highway Management Roguelike** webgame where adding just *one more lane* is the ultimate solution to meeting city commuter quotas.

Each run is structured into **Antes** (Sectors), each containing a cycle of **Small Commute**, **Big Commute**, and a high-stakes **Boss Commute** with unique game-altering modifiers (Boss Blinds).

---

## 🃏 Balatro Core Equivalence & Architecture Mapping

| Highway Concept | Balatro Equivalent | Function & Role |
| :--- | :--- | :--- |
| **🚗 Car** | **Card** | Individual scoring unit moving across the screen (Sedans, EV Supercars, Heavy Freight, Buses, Muscle Cars, Speeders). |
| **🛣️ Highway Lane** | **Hand** | Active scoring conveyor. Adding more lanes expands active throughput capacity. |
| **⚖️ Traffic Law** | **Joker** | Passive rule modifiers designed to **increase commuter volume and throughput**. Can target specific car/lane types (effects apply to all vehicles of that type!). |
| **⚡ Lane Upgrade** | **Planet Card** | Infrastructure enhancements (Gantry speed levels, nitro asphalt, induction coils) that permanently level up lane speed, throughput, and performance. |
| **📢 Billboards & Ads** | **Economy Upgrades** | A separate dedicated pool of municipal ad contracts and roadside signs **specifically for passive money making**. |

---

## 🏛️ Key Design & Gameplay Rules

### 1. ⚖️ Traffic Laws (Commuter Throughput & Jokers)
- **Primary Objective**: Traffic Laws are active/passive ordinances designed to **increase commuter volume, speed, and throughput** to hit strict daily quotas by Midnight.
- **Type-Wide Scaling**: When a Traffic Law specifically boosts a car type (e.g. EVs, Freight Rigs, Buses) or a lane type (e.g. Express HOV, BRT), the bonus applies across **all vehicles or lanes of that type**.

---

### 2. 📢 Roadside Billboards & Corporate Ad Contracts (Money Making)
- **Dedicated Economy Pool**: Billboards and corporate advertising sponsorships form a separate upgrade track designed **specifically for monetization and cash generation**.
- Passing commuters view active billboards to generate reliable passive cash revenue without relying exclusively on toll gates.

---

### 3. 🛣️ Specialized Lane Toll Rules
- **Matching Vehicle Bonuses**: Specialized lanes (Express HOV 3x, Freight Corridor, EV Fast-Track, Bus Rapid Transit) **only grant their premium toll / throughput bonus when the corresponding type of vehicle passes through their toll gantry**:
  - **Freight Corridors**: Heavy Freight Trucks pay 5x commercial multiplier ($10).
  - **EV Fast-Track**: EVs gain induction speed boosts and multiplier revenue.
  - **BRT Busways**: Commuter Buses process 4x commuters towards the daily target.
  - **Autobahn Unrestricted**: $0 Tolls (FREE Flow!) with a 2.0x flow speed boost for maximum vehicle clearance.

---

## 🏛️ Game Start: Starter Procurement (Pick 2 of 6)

At the beginning of every new run, the Highway Commission presents you with **6 starter options across 3 categories**:

1. **⚖️ 2 Traffic Laws**: Randomly drawn ordinances to start with unique passive rules.
2. **⚡ 2 Lane & Auto-Toll Upgrades**: Pre-paved specialized lanes (Express, Freight, EV, Autobahn), RFID Level 2 gantry upgrades, or performance asphalt.
3. **📢 2 Billboard & Ad Options**: Free roadside billboards or signed corporate sponsorship contracts (Bob's 24h Diner, Zen Anger Management, Personal Injury Lawyer).

👉 **The player selects any 2 options** (e.g. 2 laws, 1 lane + 1 billboard, 2 billboards, etc.) to customize their starter build before launching Ante 1!

---

## 🛒 Post-Commute Transit Shop (Strict Roguelike Progression)

Upgrades and purchases can **ONLY** be made inside the **Post-Commute Transit Shop** which opens exclusively after successfully completing a 24-hour commute:

- **No Outside Purchases**: All lane constructions, gantry speed upgrades, roadside billboards, corporate ad contracts, and traffic laws must be acquired through the post-commute shop.
- **Post-Commute Flow**:
  1. Complete the 24-Hour Commute (1:00 AM to 12:00 Midnight).
  2. View the Debrief Summary showing tolls, ad revenue, fines, interest, and boss bonuses.
  3. Click **"🛒 Continue to Shop"** to enter the Transit Shop:
     - **2 Traffic Law Choices** (Jokers)
     - **2 Infrastructure Slots** (Auto-Toll Gantry speed, Billboards, Ad Contracts, Highway Boosters)
     - **+ Construct Extra Lane** (Permanent Specialization)
     - **🎲 Shop Reroll** ($5 base)
  4. Click **"Done / Launch Planning"** to proceed to the next day's commute!

---

## Core Gameplay & Economy Balance

### 🦌 1. Deer Crossings & Roadside Hazard Bounties
- **5% Deer Crossing Probability at the Top of Every Hour**: Deer crossings now occur strictly at top-of-the-hour transitions with a clean **5% probability**.
- **$10 Deer Eco Bounty**: Safely guiding a crossing deer awards **+$10** (boosted to +$25 with the *Wildlife Eco-Corridor Accord*).
- **Reduced Sleepy Driver Frequency**: Sleepy driver probability decreased to a rare **~5%** late night and **~1.5%** during daytime.
- **$5 Road Rager De-escalation Bounty**: Calming a Road Raging driver awards **+$5**.

---

### 🛣️ 2. $1 Base Toll Economy & Lane Specializations
- **Base Toll = $1**: Standard commuter lanes charge a baseline toll of **$1**, with all other specialized lanes scaled proportionally:
  - **Standard Commuter**: $1 Toll (Balanced baseline throughput).
  - **Express HOV 3x**: $3 Toll (Premium fast-lane for sedans, sports cars, EVs).
  - **Freight Corridor**: $2 Base Toll (Heavy rigs pay 5x commercial multiplier = $10).
  - **EV Fast-Track**: $2 Toll (Induction coils boost EV speed by +50%).
  - **Bus Rapid Transit (BRT)**: $2 Toll (Commuter buses process 4x commuters towards daily target).
  - **Autobahn Unrestricted**: **$0 Toll (FREE Flow!)** — Zero toll revenue, but provides maximum high-speed commuter throughput to beat difficult daily quotas!

---

### 📸 3. Speeder Balance & Fines
- Speeder spawn chance reduced to a rare event (~3.5% base chance).
- **Base Speeder Fine on Click**: **$5**
- **Upgradeable Fines**: Upgraded through Urban Planning Grants (Surveillance Precision: +$5 per level $\rightarrow$ $10, $15, $20...) and Traffic Law synergies.

---

### 🛡️ 4. Strict Anti-Overlap Vehicle Physics
- **Entrance Safety Clearances**: Vehicles only spawn when the highway entrance is clear (70px margin).
- **Physics Following Distance & Bumper Clamping**: Hard clamping ensures vehicle front bumpers never penetrate lead rear bumpers, even during heavy braking, gantry queues, or lane transitions.

---

### ⚡ 5. Default Auto-Tolling & Upgradeable Gantry Speeds
- **Auto-Tolling is Default**: Every lane has automated RFID toll collection built-in.
- **Upgradeable Gantry Speed Levels (In Shop)**:
  - **Level 1: Mechanical Barrier Gate** (1.8s stop delay)
  - **Level 2: Standard RFID Transponder** (1.1s stop delay)
  - **Level 3: High-Speed Laser Scanner** (0.6s pause)
  - **Level 4: Open-Road ALPR Gantry** (0.2s roll-through)
  - **Level 5: Quantum Multi-Spectrum Gantry** (0.0s instant fly-through!)

---

### 🕒 6. Slower 24-Hour Day Progression & Speed Multipliers
- **85-Second Day Cycle** (1:00 AM to 12:00 Midnight).
- **Speed Controls**: Toggle between **⏩ 1x Speed**, **⏩ 2x Speed**, and **⏩ 3x Speed** on the header bar at any time.

---

### 👑 7. Balatro-Style Lane Debuff Boss Blinds
- **HOV Outage** (Debuffs Express lanes $\rightarrow$ $0 tolls, 50% speed).
- **Weight Scale** (Debuffs Freight corridors $\rightarrow$ 40% speed, no commercial multiplier).
- **EMP Spike** (Debuffs EV Fast-Tracks $\rightarrow$ no speed boosts or neon trails).
- **Transit Strike** (Debuffs BRT bus lanes $\rightarrow$ buses clear only 1 commuter).
- **Radar Trap** (Debuffs Autobahn $\rightarrow$ 45mph limit imposed).
- **Pothole Catastrophe** (Debuffs Standard lanes $\rightarrow$ 40% speed reduction).

---

## Tech Stack

- Vanilla ES6 JavaScript (No external build tools required)
- HTML5 Canvas for real-time physics, animated traffic, deer crossings, and billboard rendering
- Bulma CSS Framework & Dark Mode Highway Roguelike styling
- Web Audio API for synthesized procedural sound effects
- LocalStorage API for game and meta-progression persistence
