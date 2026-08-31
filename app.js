/**
 * One More Lane - Roguelike Highway Management Engine
 * Features:
 * - 5% Deer Crossing Probability at the Top of Every Hour (with $10 Eco Bounty)
 * - Reduced Sleepy Driver Probability (~5% late night, ~1% day)
 * - Reduced Road Rager De-escalation Bounty to $5
 * - Base Toll values set to $1 (proportional across all lane types)
 * - Autobahn: $0 Tolls, Pure High-Speed Commuter Throughput
 * - Rare Speeders with $5 Base Fine (Upgradeable via Meta Bureau & Modifiers)
 * - Zero Visual Overlapping (Strict Safety Following Distance & Bumper Clamping)
 * - Default Auto-Tolling with Upgradeable RFID Gantry Processing Speeds
 * - Slower 24-Hour Day Progression with 1x, 2x, 3x Game Speed Controls
 * - Dynamic Flow Patterns, Sleepy Drivers, Deer/Wildlife Crossings, Hard Quota Cutoffs
 * - Balatro-Style Traffic Laws (Jokers) & Boss Blinds (including Lane Debuffs)
 */

// ==========================================
// 1. WEB AUDIO SYNTHESIZER ENGINE
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playTone(freq, type = "sine", duration = 0.1, gainVal = 0.15) {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Fallback
    }
  }

  playTollChime() {
    this.init();
    this.playTone(880, "sine", 0.08, 0.12);
  }

  playCashChime() {
    this.init();
    this.playTone(523.25, "triangle", 0.09, 0.12);
    setTimeout(() => this.playTone(659.25, "triangle", 0.14, 0.15), 60);
  }

  playRadarSnap() {
    this.init();
    this.playTone(1200, "square", 0.05, 0.15);
    setTimeout(() => this.playTone(1800, "square", 0.08, 0.18), 40);
  }

  playHonk() {
    this.init();
    this.playTone(340, "sawtooth", 0.12, 0.1);
    setTimeout(() => this.playTone(420, "sawtooth", 0.14, 0.12), 50);
  }

  playSirenChirp() {
    this.init();
    this.playTone(600, "sawtooth", 0.1, 0.1);
    setTimeout(() => this.playTone(900, "sawtooth", 0.12, 0.12), 80);
  }

  playWildlifeChime() {
    this.init();
    this.playTone(587.33, "triangle", 0.12, 0.15);
    setTimeout(() => this.playTone(880, "triangle", 0.18, 0.15), 80);
  }

  playWakeupChime() {
    this.init();
    this.playTone(440, "sine", 0.08, 0.15);
    setTimeout(() => this.playTone(660, "sine", 0.12, 0.15), 60);
    setTimeout(() => this.playTone(880, "sine", 0.16, 0.18), 120);
  }

  playDraftSelect() {
    this.init();
    this.playTone(440, "sine", 0.08, 0.15);
    setTimeout(() => this.playTone(880, "sine", 0.18, 0.2), 70);
  }

  playSurge() {
    this.init();
    this.playTone(220, "sawtooth", 0.3, 0.2);
    setTimeout(() => this.playTone(440, "sawtooth", 0.3, 0.25), 100);
  }

  playVictoryFanfare() {
    this.init();
    [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => {
      setTimeout(() => this.playTone(note, "triangle", 0.25, 0.2), i * 120);
    });
  }

  playGameOverDrone() {
    this.init();
    [300, 240, 180, 120].forEach((note, i) => {
      setTimeout(() => this.playTone(note, "sawtooth", 0.35, 0.25), i * 160);
    });
  }
}

// ==========================================
// 2. UTILITIES & 24-HOUR FORMATTER
// ==========================================
class Formatter {
  static formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return "0";
    if (num < 1000) {
      return num >= 100 ? num.toFixed(0) : (num % 1 === 0 ? num.toFixed(0) : num.toFixed(1));
    }
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx"];
    const i = Math.floor(Math.log10(num) / 3);
    if (i >= suffixes.length) return num.toExponential(2);
    const formatted = (num / Math.pow(10, i * 3)).toFixed(2);
    return `${formatted}${suffixes[i]}`;
  }

  static formatTimeOfDay(progress) {
    const totalHours = 1.0 + progress * 23.0; // 1:00 AM to 12:00 Midnight
    const hour24 = Math.floor(totalHours);
    const mins = Math.floor((totalHours % 1) * 60);

    if (hour24 >= 24) {
      return "12:00 AM (Midnight)";
    }

    const period = hour24 >= 12 && hour24 < 24 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const minsStr = mins < 10 ? `0${mins}` : mins;
    return `${hour12}:${minsStr} ${period}`;
  }

  static getHour24(progress) {
    return 1.0 + progress * 23.0;
  }
}

class NotificationSystem {
  static show(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => {
        if (typeof toast.remove === "function") {
          toast.remove();
        } else if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }
}

const MEME_NEWS = [
  "City Council mandates all highways meet 24-hour commuter throughput quotas.",
  "Flock ALPR cameras catch driver doing 140mph in a grocery delivery van.",
  "Department of Transportation upgrades toll gantry sensors to reduce queuing delays.",
  "Wildlife conservation group praises highway authority for safe deer crossings.",
  "Sleepy commuter wakes up after hitting rumble strip; thanks highway coffee sponsor.",
  "Muscle car driver engages maximum Road Rage; attempts to jump the toll gantry.",
  "Department of Transportation declares 'One More Lane' official city motto.",
  "Roadside billboard campaign for personal injury lawyer generates record impressions.",
  "Billionaire pays $4,000 express lane toll to beat 3 cars to the exit.",
  "EV Supercar achieves Mach 1 on dedicated Fast-Track lane; sparks green neon fire."
];

const BILLBOARD_ADS = [
  "CALL 1-800-MORE-LANE • INJURED IN GRIDLOCK?",
  "BOB'S HIGHWAY DINER • FRESH COFFEE NEXT EXIT ☕",
  "MARS CASINO & RESORT • BET ON RED 🎰",
  "BUY CYBER EV 2099 • 0-60 IN 1.2s ⚡",
  "FALLING ASLEEP? PULL OVER & GRAB ESPRESSO!",
  "FEELING STUCK? JUST ADD ONE MORE LANE!",
  "BRAKE FOR WILDLIFE • DEER CROSSING ZONE 🦌"
];

const HONK_PHRASES = ["HONK! 🗯️", "BEEP! 🚗", "MOVE OVER! 😡", "GET GOING! 💥", "OUTTA MY WAY! 🏎️"];

class NewsTicker {
  constructor() {
    this.tickerEl = document.getElementById("newsContent");
  }

  start() {
    if (!this.tickerEl) return;
    const separator = " &nbsp;&nbsp;&nbsp; 🛣️ &nbsp;&nbsp;&nbsp; ";
    const fullStream = MEME_NEWS.join(separator);
    this.tickerEl.innerHTML = `<span>${fullStream}${separator}${fullStream}${separator}</span>`;
  }
}

// ==========================================
// 3. AUTO-TOLL GANTRY SPEED TIERS
// ==========================================
const TOLL_SPEED_TIERS = [
  { level: 1, name: "Mechanical Barrier Gate", delay: 1.8, cost: 0, desc: "Cars come to a full stop for 1.8s while mechanical gate lifts." },
  { level: 2, name: "Standard RFID Transponder", delay: 1.1, cost: 50, desc: "Electronic sensors process tolls with a brief 1.1s stop." },
  { level: 3, name: "High-Speed Laser Scanner", delay: 0.6, cost: 110, desc: "Fast optical sensors scan vehicles with only a 0.6s pause." },
  { level: 4, name: "Open-Road ALPR Gantry", delay: 0.2, cost: 200, desc: "Overhead cameras scan license plates with a 0.2s roll-through." },
  { level: 5, name: "Quantum Multi-Spectrum Gantry", delay: 0.0, cost: 360, desc: "Zero-delay instant fly-through! Cars never brake at the gantry!" }
];

// ==========================================
// 4. BALATRO-STYLE BOSS BLINDS (INCLUDING LANE DEBUFFS)
// ==========================================
const BOSS_BLINDS = [
  // 1. LANE SPECIALIZATION DEBUFFS (BALATRO SUIT DEBUFF EQUIVALENT)
  {
    id: "debuff_express",
    name: "The HOV FastPass Outage",
    desc: "All Express HOV Lanes are DEBUFFED! Generates $0 tolls and flow speed cut in half!",
    color: "#a855f7",
    debuffedLaneType: "express",
    apply: (game) => { game.modifiers.debuffedLaneType = "express"; }
  },
  {
    id: "debuff_freight",
    name: "The Mandatory Weight Scale",
    desc: "All Freight Corridors are DEBUFFED! Heavy freight rigs crawl at 40% speed and commercial toll multipliers disabled!",
    color: "#f97316",
    debuffedLaneType: "freight",
    apply: (game) => { game.modifiers.debuffedLaneType = "freight"; }
  },
  {
    id: "debuff_ev",
    name: "The EMP Substation Spike",
    desc: "All EV Fast-Tracks are DEBUFFED! Asphalt induction coils disabled; EVs lose speed boosts and neon trails!",
    color: "#10b981",
    debuffedLaneType: "ev",
    apply: (game) => { game.modifiers.debuffedLaneType = "ev"; }
  },
  {
    id: "debuff_brt",
    name: "The Transit Union Strike",
    desc: "All BRT Bus Lanes are DEBUFFED! Commuter buses process only 1 commuter (instead of 4x)!",
    color: "#eab308",
    debuffedLaneType: "brt",
    apply: (game) => { game.modifiers.debuffedLaneType = "brt"; }
  },
  {
    id: "debuff_autobahn",
    name: "Strict 45MPH Radar Trap",
    desc: "All Autobahn Lanes are DEBUFFED! Strict 45mph speed limits imposed; speed boosts disabled!",
    color: "#06b6d4",
    debuffedLaneType: "autobahn",
    apply: (game) => { game.modifiers.debuffedLaneType = "autobahn"; }
  },
  {
    id: "debuff_standard",
    name: "The Pothole Catastrophe",
    desc: "All Standard Commuter Lanes are DEBUFFED! Severe asphalt damage reduces flow speed by 40%!",
    color: "#64748b",
    debuffedLaneType: "standard",
    apply: (game) => { game.modifiers.debuffedLaneType = "standard"; }
  },

  // 2. GLOBAL ENVIRONMENTAL & TRAFFIC MODIFIERS
  {
    id: "power_outage",
    name: "The Power Grid Brownout",
    desc: "Gantry sensors run on emergency power! Adds +1.4s delay to toll processing!",
    color: "#ef4444",
    apply: (game) => { game.modifiers.gantryDelayPenalty = 1.4; }
  },
  {
    id: "deer_migration",
    name: "Midnight Wildlife Migration",
    desc: "Deer herds frequently trot across highway lanes at the top of the hour! Guide them safely!",
    color: "#10b981",
    apply: (game) => { game.modifiers.wildlifeRateMultiplier = 4.0; }
  },
  {
    id: "road_rage_fury",
    name: "Monday Morning Road Rage",
    desc: "Commuter patience drops 3x faster! Raging drivers honk and cause brake delays!",
    color: "#dc2626",
    apply: (game) => { game.modifiers.rageRateMultiplier = 3.0; }
  },
  {
    id: "sleepy_graveyard",
    name: "The Graveyard Shift Fog",
    desc: "Severe fatigue! Night fatigue increases sleepy driver frequency.",
    color: "#60a5fa",
    apply: (game) => { game.modifiers.sleepyRateMultiplier = 3.0; }
  },
  {
    id: "toll_strike",
    name: "The Toll Strike",
    desc: "Regular lane tolls cut by 50%. Rely on Express lanes, billboards, and speeder fines!",
    color: "#f59e0b",
    apply: (game) => { game.modifiers.regularTollMultiplier = 0.5; }
  },
  {
    id: "flash_monsoon",
    name: "Flash Monsoon",
    desc: "Severe rain cuts tire grip. Braking distances doubled and cars brake abruptly!",
    color: "#06b6d4",
    apply: (game) => { game.modifiers.weather = "rain"; game.modifiers.brakingMultiplier = 2.0; }
  },
  {
    id: "friday_apocalypse",
    name: "The 24-Hour Friday Apocalypse",
    desc: "Final Boss! Massive commuter volume with mixed rain, deer crossings, and road rage!",
    color: "#dc2626",
    apply: (game) => {
      game.modifiers.weather = "rain";
      game.modifiers.speederRate = 0.10;
      game.modifiers.wildlifeRateMultiplier = 3.0;
      game.modifiers.rageRateMultiplier = 2.0;
    }
  }
];

// ==========================================
// 5. TRAFFIC LAWS & ROAD RAGE ORDINANCES (JOKERS)
// ==========================================
const TRAFFIC_LAWS_CATALOG = [
  {
    id: "rumble_strips",
    name: "Rumble Strip Ordinance",
    icon: "📳",
    rarity: "uncommon",
    desc: "Sleepy drivers swerving across lane lines wake up instantly and award +$25 awareness bounty!",
    isPassive: true
  },
  {
    id: "wildlife_bridge",
    name: "Wildlife Eco-Corridor Accord",
    icon: "🦌",
    rarity: "rare",
    desc: "Crossing deer grant +$25 city eco grant upon safe crossing and never cause car delays!",
    isPassive: true
  },
  {
    id: "honking_surcharge",
    name: "Noise Violation Ordinance",
    icon: "📢",
    rarity: "uncommon",
    desc: "Every time an angry driver honks, city hall awards you a +$6 noise fee!",
    isPassive: true
  },
  {
    id: "anti_tailgating",
    name: "Anti-Tailgating Fine",
    icon: "🚨",
    rarity: "rare",
    desc: "Road Raging drivers ticketed by police/radar pay a massive $60 aggressive driving penalty!",
    isPassive: true
  },
  {
    id: "defensive_driving",
    name: "Defensive Driving Mandate",
    icon: "🛡️",
    rarity: "common",
    desc: "Reduces commuter road rage buildup rate across all lanes by 70%.",
    isPassive: true
  },
  {
    id: "dynamic_pricing",
    name: "Surge Pricing Ordinance",
    icon: "⚖️",
    rarity: "common",
    desc: "+50% toll revenue during peak rush hours (7-9 AM & 4-6 PM).",
    onToll: (toll, v, game) => {
      const h = Formatter.getHour24(game.commuteProgress);
      const isPeak = (h >= 7.0 && h <= 9.5) || (h >= 16.0 && h <= 19.0);
      return isPeak ? toll * 1.5 : toll;
    }
  },
  {
    id: "billboard_deregulation",
    name: "Billboard Deregulation Act",
    icon: "📢",
    rarity: "uncommon",
    desc: "All Roadside Billboards generate +100% extra passive ad revenue per car!",
    isPassive: true
  },
  {
    id: "commercial_corridor",
    name: "Commercial Corridor Zoning",
    icon: "🏬",
    rarity: "rare",
    desc: "Each active Billboard grants +$1 bonus toll revenue to every car on the highway!",
    onToll: (toll, v, game) => {
      return toll + (game.billboards * 1);
    }
  },
  {
    id: "flock_surveillance",
    name: "Flock ALPR Surveillance Act",
    icon: "📸",
    rarity: "rare",
    desc: "Overhead cameras automatically ticket speeders instantly with full fine revenue.",
    isPassive: true
  },
  {
    id: "hov_fastpass",
    name: "Mandatory HOV FastPass",
    icon: "⚡",
    rarity: "common",
    desc: "Express HOV lanes yield 4.0x toll revenue instead of 3.0x.",
    isPassive: true
  },
  {
    id: "brt_priority",
    name: "BRT Transit Super-Priority",
    icon: "🚌",
    rarity: "uncommon",
    desc: "Commuter Buses process 6x commuters towards daily target instead of 4x!",
    isPassive: true
  },
  {
    id: "rapid_tow",
    name: "Zero-Tolerance Tow Ordinance",
    icon: "🚨",
    rarity: "uncommon",
    desc: "Breakdown hazards clear automatically in 3s and award +$80 towing bounty.",
    isPassive: true
  },
  {
    id: "green_corridor",
    name: "Clean Air EV Incentive Statute",
    icon: "🔋",
    rarity: "uncommon",
    desc: "EV Supercars pay 2x toll and provide +30% speed boost aura to trailing cars.",
    isPassive: true
  },
  {
    id: "heavy_hauler_tax",
    name: "Heavy Vehicle Weight Tax",
    icon: "🚚",
    rarity: "common",
    desc: "Heavy Freight Trucks pay 5x commercial toll revenue.",
    isPassive: true
  },
  {
    id: "diamond_interchange",
    name: "Diverging Diamond Code",
    icon: "💠",
    rarity: "rare",
    desc: "Cars change lanes 100% faster with zero collision delay.",
    isPassive: true
  },
  {
    id: "emergency_priority",
    name: "Move-Over Siren Law",
    icon: "🚑",
    rarity: "uncommon",
    desc: "Ambulances award +$150 on exit and carry +3 commuters towards target.",
    isPassive: true
  },
  {
    id: "rubbernecking_ban",
    name: "Anti-Rubbernecking Fine",
    icon: "🚫",
    rarity: "common",
    desc: "Cars no longer brake or slow down near accidents or traffic stops.",
    isPassive: true
  },
  {
    id: "overclocked_asphalt",
    name: "Speed Limit: Suggested Law",
    icon: "🏎️",
    rarity: "common",
    desc: "+25% baseline vehicle speed on all lanes to clear commuter quota faster.",
    isPassive: true
  },
  {
    id: "bogo_permit",
    name: "Eminent Domain Subsidy",
    icon: "🏷️",
    rarity: "rare",
    desc: "Building new lanes grants 35% instant cash refund.",
    isPassive: true
  },
  {
    id: "ghost_lane",
    name: "Ghost Overpass Exemption",
    icon: "👻",
    rarity: "legendary",
    desc: "All vehicles gain +40% baseline flow speed and instant lane switching!",
    isPassive: true
  },
  {
    id: "cyber_neon",
    name: "Megacity Transit Charter",
    icon: "🌆",
    rarity: "legendary",
    desc: "Multiplies all round end earnings by 1.5x!",
    isPassive: true
  }
];

// ==========================================
// 6. CORPORATE AD SPONSORSHIP CONTRACTS
// ==========================================
const AD_CONTRACTS = [
  {
    id: "local_diner",
    name: "Bob's 24-Hour Highway Diner & Coffee",
    icon: "☕",
    desc: "+$1.00 per car + reduces sleepy drivers on the highway by 80%!",
    cost: 60,
    perCarBonus: 1.0
  },
  {
    id: "anger_management",
    name: "Zen Highway Anger Management Ad",
    icon: "🧘",
    desc: "Billboards emit soothing audio ads that instantly calm 60% of road raging cars!",
    cost: 90,
    perCarBonus: 1.0
  },
  {
    id: "injury_lawyer",
    name: "Personal Injury Lawyer Billboard",
    icon: "⚖️",
    desc: "+$2.00 per car + $10 bonus bounty whenever a speeder is ticketed!",
    cost: 130,
    perCarBonus: 2.0
  },
  {
    id: "supercar_dealership",
    name: "Cyber Supercar Dealership LED",
    icon: "🏎️",
    desc: "+$3.00 per car + EV Supercars yield double ad revenue!",
    cost: 200,
    perCarBonus: 3.0
  },
  {
    id: "mega_casino",
    name: "Olympus Mons Mega-Casino Hologram",
    icon: "🎰",
    desc: "+$5.00 per car passive advertising sponsorship!",
    cost: 320,
    perCarBonus: 5.0
  }
];

// ==========================================
// 7. ACHIEVEMENTS CATALOG
// ==========================================
const ACHIEVEMENTS_DEF = [
  { id: "first_commute", title: "First 24-Hour Day", desc: "Hit the commuter quota across a full 24-hour cycle.", req: (g) => g.stats.totalCommutesCleared >= 1 },
  { id: "first_boss", title: "Boss Buster", desc: "Defeat your first Boss Commute target!", req: (g) => g.stats.bossesDefeated >= 1 },
  { id: "five_lanes", title: "One More Lane!", desc: "Expand to 5 lanes on a single highway.", req: (g) => g.highway.lanes.length >= 5 },
  { id: "max_gantry", title: "Quantum Fly-Through", desc: "Upgrade Auto-Toll Gantry to Level 5 Quantum Speed.", req: (g) => g.autoTollSpeedLevel >= 5 },
  { id: "first_billboard", title: "Billboard Mogul", desc: "Erect your first Roadside Billboard.", req: (g) => g.billboards >= 1 },
  { id: "wildlife_guardian", title: "Wildlife Guardian", desc: "Guide 5 deer safely across the highway.", req: (g) => g.stats.wildlifeHandled >= 5 },
  { id: "coffee_wakeup", title: "Coffee Patrol", desc: "Wake up 8 sleepy drivers on the graveyard shift.", req: (g) => g.stats.sleepyWoken >= 8 },
  { id: "calm_rager", title: "Traffic Diplomat", desc: "Calm or ticket 10 Road Raging drivers.", req: (g) => g.stats.ragersHandled >= 10 },
  { id: "ante_4", title: "Halfway There", desc: "Reach Ante 4 in a run.", req: (g) => g.currentAnte >= 4 },
  { id: "ante_8", title: "Transit Legend", desc: "Clear Ante 8 and win the run!", req: (g) => g.currentAnte >= 8 && g.stageInAnte === 0 }
];

// ==========================================
// 8. LANE TYPES & HIGHWAY STRUCTURE (BASE TOLL = $1)
// ==========================================
const LANE_TYPES = {
  standard: {
    id: "standard",
    name: "Standard Commuter",
    icon: "🚗",
    tollMult: 1.0, // Base toll: $1
    speedMult: 1.0,
    costMultiplier: 1.0,
    desc: "Baseline commuter lane ($1 toll). Balanced throughput and standard auto-tolls.",
    tagClass: "is-lane-standard"
  },
  express: {
    id: "express",
    name: "Express HOV 3x",
    icon: "⚡",
    tollMult: 3.0, // Toll: $3
    speedMult: 1.35,
    costMultiplier: 1.35,
    desc: "Premium fast-lane ($3 toll). Earns 3x tolls from fast sedans, sports cars & EVs.",
    tagClass: "is-lane-express"
  },
  freight: {
    id: "freight",
    name: "Freight Corridor",
    icon: "🚚",
    tollMult: 2.0, // Toll: $2 (commercial multiplier x5 on trucks = $10)
    speedMult: 1.15,
    costMultiplier: 1.4,
    desc: "Heavy freight corridor ($2 base toll). Trucks pay commercial tolls without slowing cars.",
    tagClass: "is-lane-freight"
  },
  ev: {
    id: "ev",
    name: "EV Fast-Track",
    icon: "🔋",
    tollMult: 2.0, // Toll: $2
    speedMult: 1.5,
    costMultiplier: 1.5,
    desc: "Induction coils on asphalt ($2 toll). EVs travel +50% faster with neon trails.",
    tagClass: "is-lane-ev"
  },
  brt: {
    id: "brt",
    name: "Bus Rapid Transit (BRT)",
    icon: "🚌",
    tollMult: 1.5, // Toll: $2
    speedMult: 1.25,
    costMultiplier: 1.45,
    desc: "Dedicated busway ($2 toll). Commuter buses process 4x commuters towards daily target!",
    tagClass: "is-lane-brt"
  },
  autobahn: {
    id: "autobahn",
    name: "Autobahn Unrestricted",
    icon: "🏎️",
    tollMult: 0.0, // $0 Toll! Free high-speed throughput!
    speedMult: 2.0,
    costMultiplier: 1.6,
    desc: "No speed limits and NO toll fee ($0). Supercharged vehicle flow speed to maximize daily commuter throughput!",
    tagClass: "is-lane-autobahn"
  }
};

class Lane {
  constructor(id, laneType = "standard") {
    this.id = id;
    this.laneType = laneType;
    this.autoToll = true;
    this.baseToll = 1; // Base toll set to $1 for all lanes!
    this.hasBreakdown = false;
    this.hasPothole = false;
  }

  get isExpress() {
    return this.laneType === "express";
  }

  getTollValue(globalMultiplier = 1) {
    const typeDef = LANE_TYPES[this.laneType] || LANE_TYPES.standard;
    if (typeDef.tollMult === 0) return 0; // Autobahn has no toll!
    return Math.max(1, Math.round(this.baseToll * typeDef.tollMult * globalMultiplier));
  }
}

class Highway {
  constructor(name = "Metro Turnpike") {
    this.name = name;
    this.lanes = [new Lane(1, "standard")];
    this.baseLaneCost = 60;
  }

  getBaseNewLaneCost() {
    return Math.floor(this.baseLaneCost * Math.pow(1.5, this.lanes.length - 1));
  }

  getLaneTypeCost(typeId) {
    const typeDef = LANE_TYPES[typeId] || LANE_TYPES.standard;
    return Math.round(this.getBaseNewLaneCost() * typeDef.costMultiplier);
  }

  addLane(laneType = "standard") {
    const newLane = new Lane(this.lanes.length + 1, laneType);
    this.lanes.push(newLane);
    return newLane;
  }

  isLaneDebuffed(lane) {
    if (!lane) return false;
    return game && game.modifiers && game.modifiers.debuffedLaneType === lane.laneType;
  }
}

// ==========================================
// 9. TRAFFIC RENDERER & LIVE 24-HOUR SIMULATOR
// ==========================================
class TrafficRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.vehicles = [];
    this.wildlife = [];
    this.particles = [];
    this.floatingTexts = [];
    this.lastSpawnTime = 0;
    this.lastCheckedHour = -1; // Top of the hour tracker for 5% deer crossings
    this.blinkTimer = 0;
    this.adRotationIndex = 0;
    this.lastAdRotateTime = Date.now();
    this.initCanvas();

    if (this.canvas) {
      this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
    }
  }

  initCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 400;
  }

  addFloatingText(x, y, text, color = "#10b981") {
    this.floatingTexts.push({ x, y, text, color, alpha: 1.0, dy: -1.4 });
  }

  addParticle(x, y, vx, vy, color, size, life) {
    this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
  }

  handleCanvasClick(e) {
    if (game.gameState !== "COMMUTE") return;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let hit = false;

    // 1. Check click on Crossing Deer / Wildlife 🦌 (Decreased bonus to $10)
    for (let d = this.wildlife.length - 1; d >= 0; d--) {
      const deer = this.wildlife[d];
      if (Math.abs(deer.x - clickX) < 30 && Math.abs(deer.y - clickY) < 30) {
        hit = true;
        const bounty = (game.hasTrafficLaw("wildlife_bridge") ? 25 : 10) * game.getGlobalMultiplier();
        game.bank += bounty;
        game.roundFinesCollected += bounty;
        game.stats.wildlifeHandled++;
        this.addFloatingText(clickX, clickY, `🦌 SAFE PASSAGE! +$${bounty}`, "#34d399");
        game.sound.playWildlifeChime();
        this.wildlife.splice(d, 1);
        NotificationSystem.show(`Guided wildlife safely across! +$${bounty} Eco Bounty`, "wildlife");
        game.updateUI();
        game.checkAchievements();
        break;
      }
    }

    // 2. Check click on vehicles (Sleepy Drivers, Ragers, Speeders, Police)
    if (!hit) {
      this.vehicles.forEach((v) => {
        if (!hit && Math.abs(v.x - clickX) <= v.length / 2 + 14 && Math.abs(v.y - clickY) <= v.width / 2 + 14) {
          hit = true;
          if (v.isSleepy) {
            v.isSleepy = false;
            v.currentSpeed = v.maxSpeed;
            const wakeBonus = 20 * game.getGlobalMultiplier();
            game.bank += wakeBonus;
            game.roundFinesCollected += wakeBonus;
            game.stats.sleepyWoken++;
            this.addFloatingText(clickX, clickY, `☕ WOKE UP! +$${wakeBonus}`, "#60a5fa");
            game.sound.playWakeupChime();
            NotificationSystem.show("Woke up sleepy driver with fresh highway coffee!", "sleepy");
            game.updateUI();
            game.checkAchievements();
          } else if (v.isPolice && v.isConductingStop) {
            v.isConductingStop = false;
            v.stopTimer = 0;
            v.currentSpeed = v.maxSpeed;
            if (v.chaseTarget) {
              v.chaseTarget.isBraking = false;
              v.chaseTarget.currentSpeed = v.chaseTarget.maxSpeed;
            }
            const escortBonus = 30 * game.getGlobalMultiplier();
            game.bank += escortBonus;
            game.roundFinesCollected += escortBonus;
            this.addFloatingText(clickX, clickY, `🚔 CLEARED STOP! +$${escortBonus}`, "#38bdf8");
            game.sound.playSirenChirp();
            game.updateUI();
          } else if (v.isRaging) {
            // Road rager bonus decreased to $5
            v.isRaging = false;
            v.patience = 100;
            const calmBonus = 5 * game.getGlobalMultiplier();
            game.bank += calmBonus;
            game.roundFinesCollected += calmBonus;
            game.stats.ragersHandled++;
            this.addFloatingText(clickX, clickY, `🧘 CALMED RAGER! +$${calmBonus}`, "#34d399");
            game.sound.playCashChime();
            NotificationSystem.show(`Calmed Road Rager! +$${calmBonus} Bounty!`, "success");
            game.updateUI();
          } else if (v.isSpeeding) {
            v.isSpeeding = false;
            v.maxSpeed = v.maxSpeed / 1.5;
            const ticketBonus = game.getSpeederFine();
            game.bank += ticketBonus;
            game.roundFinesCollected += ticketBonus;
            game.stats.speedersCaught++;
            this.addFloatingText(clickX, clickY, `📸 SPEED TICKET! +$${ticketBonus}`, "#ef4444");

            if (game.adContracts.injury_lawyer) {
              game.bank += 10;
              game.roundAdRevenue += 10;
              this.addFloatingText(clickX, clickY - 14, "+$10 LAWYER SPONSOR! ⚖️", "#facc15");
            }

            game.sound.playRadarSnap();
            NotificationSystem.show(`Ticketed Speeder! Issued $${ticketBonus} Fine!`, "warning");
            game.updateUIHeader();
            game.checkAchievements();
          }
        }
      });
    }

    // 3. Check click on Hazard Breakdown / Pothole
    if (!hit) {
      const hw = game.highway;
      if (hw && hw.lanes.length > 0) {
        const laneIdx = Math.floor((clickY / this.canvas.height) * hw.lanes.length);
        const lane = hw.lanes[laneIdx];
        if (lane && (lane.hasBreakdown || lane.hasPothole)) {
          lane.hasBreakdown = false;
          lane.hasPothole = false;
          const hazardBonus = 30 * game.getGlobalMultiplier();
          game.bank += hazardBonus;
          game.roundFinesCollected += hazardBonus;
          this.addFloatingText(clickX, clickY, `🚨 TOW CLEARED! +$${hazardBonus}`, "#10b981");
          game.sound.playSirenChirp();
          NotificationSystem.show("Tow Truck Cleared Road Hazard!", "success");
          game.updateUI();
        }
      }
    }
  }

  render(highway, delta = 0.016) {
    if (!this.ctx || !highway) return;

    this.blinkTimer += delta * 7;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const now = Date.now();

    if (now - this.lastAdRotateTime > 6000) {
      this.lastAdRotateTime = now;
      this.adRotationIndex = (this.adRotationIndex + 1) % BILLBOARD_ADS.length;
    }

    // 1. FULL 24-HOUR DYNAMIC SKY LIGHTING (1:00 AM to 12:00 Midnight)
    const hour24 = Formatter.getHour24(game.commuteProgress);
    let skyGradient = this.ctx.createLinearGradient(0, 0, 0, height);

    if (game.selectedSector === "mars") {
      skyGradient.addColorStop(0, "#431407");
      skyGradient.addColorStop(1, "#1c0a04");
    } else if (game.selectedSector === "cyber") {
      skyGradient.addColorStop(0, "#09090b");
      skyGradient.addColorStop(1, "#180828");
      this.ctx.fillStyle = skyGradient;
      this.ctx.fillRect(0, 0, width, height);

      this.ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      this.ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }
    } else {
      if (hour24 < 5.0) {
        skyGradient.addColorStop(0, "#020617");
        skyGradient.addColorStop(1, "#0f172a");
      } else if (hour24 < 7.5) {
        skyGradient.addColorStop(0, "#1e1b4b");
        skyGradient.addColorStop(1, "#c2410c");
      } else if (hour24 < 16.5) {
        skyGradient.addColorStop(0, "#0284c7");
        skyGradient.addColorStop(1, "#38bdf8");
      } else if (hour24 < 19.5) {
        skyGradient.addColorStop(0, "#7c2d12");
        skyGradient.addColorStop(1, "#ea580c");
      } else {
        skyGradient.addColorStop(0, "#090d16");
        skyGradient.addColorStop(1, "#1e1b4b");
      }
    }

    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, width, height);

    // Weather Rain
    if (game.modifiers.weather === "rain") {
      this.ctx.strokeStyle = "rgba(186, 230, 253, 0.35)";
      this.ctx.lineWidth = 1.5;
      for (let r = 0; r < 25; r++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        this.ctx.beginPath();
        this.ctx.moveTo(rx, ry);
        this.ctx.lineTo(rx - 8, ry + 16);
        this.ctx.stroke();
      }
    }

    // 2. ROADSIDE BILLBOARDS (Top Margin)
    const billboardCount = game.billboards;
    if (billboardCount > 0) {
      const bSlotWidth = (width * 0.7) / Math.max(1, billboardCount);
      for (let b = 0; b < billboardCount; b++) {
        const bx = 30 + b * bSlotWidth;
        const by = 8;
        const bw = Math.min(180, bSlotWidth - 20);
        const bh = 28;

        this.ctx.fillStyle = "#475569";
        this.ctx.fillRect(bx + bw / 2 - 3, by + bh, 6, 12);

        this.ctx.fillStyle = "#0f172a";
        this.ctx.fillRect(bx, by, bw, bh);
        this.ctx.strokeStyle = "#facc15";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bx, by, bw, bh);

        this.ctx.fillStyle = "#facc15";
        this.ctx.font = "bold 8.5px monospace";
        this.ctx.textAlign = "center";
        const adText = BILLBOARD_ADS[(this.adRotationIndex + b) % BILLBOARD_ADS.length];
        this.ctx.fillText(adText.substring(0, 26), bx + bw / 2, by + 18);
        this.ctx.textAlign = "left";
      }
    }

    // 3. HIGHWAY ASPHALT & DISTINCT LANE TYPES (WITH BOSS DEBUFF RENDERING)
    const lanesCount = highway.lanes.length;
    const roadMargin = 45;
    const totalRoadHeight = height - roadMargin - 20;
    const laneHeight = totalRoadHeight / Math.max(1, lanesCount);

    this.ctx.fillStyle = (hour24 < 6.0 || hour24 > 19.5) ? "#0d131f" : "#1e293b";
    this.ctx.fillRect(0, roadMargin, width, totalRoadHeight);

    // Guardrails / Grass edges
    this.ctx.fillStyle = "#15803d";
    this.ctx.fillRect(0, roadMargin - 6, width, 6);
    this.ctx.fillRect(0, roadMargin + totalRoadHeight, width, 6);

    const gantryX = width * 0.78;
    const activeGantryDelay = game.getGantryDelay();

    // Draw Lanes with Type Colors & Debuff Indicators
    for (let i = 0; i < lanesCount; i++) {
      const lane = highway.lanes[i];
      const laneY = roadMargin + i * laneHeight;
      const laneType = lane.laneType || "standard";
      const isDebuffed = highway.isLaneDebuffed(lane);

      let laneLineColor = "rgba(255, 255, 255, 0.35)";
      let laneLabelColor = "rgba(255, 255, 255, 0.3)";
      let laneTypeName = `LANE #${i+1}`;

      if (laneType === "express") {
        laneLineColor = "#c084fc";
        laneLabelColor = "#d8b4fe";
        laneTypeName = `EXPRESS #${i+1}`;
      } else if (laneType === "freight") {
        laneLineColor = "#fb923c";
        laneLabelColor = "#fdba74";
        laneTypeName = `FREIGHT #${i+1}`;
      } else if (laneType === "ev") {
        laneLineColor = "#34d399";
        laneLabelColor = "#6ee7b7";
        laneTypeName = `EV TRACK #${i+1}`;
      } else if (laneType === "brt") {
        laneLineColor = "#fde047";
        laneLabelColor = "#fef08a";
        laneTypeName = `BRT BUS #${i+1}`;
      } else if (laneType === "autobahn") {
        laneLineColor = "#22d3ee";
        laneLabelColor = "#67e8f9";
        laneTypeName = `AUTOBAHN (FREE) #${i+1}`;
      }

      if (isDebuffed) {
        this.ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
        this.ctx.fillRect(0, laneY, width, laneHeight);
        laneLineColor = "#ef4444";
        laneLabelColor = "#fca5a5";
        laneTypeName += " [🚫 DEBUFFED]";
      }

      if (i > 0) {
        this.ctx.strokeStyle = laneLineColor;
        this.ctx.lineWidth = laneType !== "standard" ? 3 : 2;
        this.ctx.setLineDash(laneType !== "standard" ? [16, 10] : [10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, laneY);
        this.ctx.lineTo(width, laneY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // EV Induction sparkles (only if not debuffed)
      if (laneType === "ev" && !isDebuffed && Math.random() < 0.15) {
        this.addParticle(Math.random() * width, laneY + laneHeight / 2 + (Math.random() - 0.5) * 12, 10, 0, "#34d399", 2, 0.4);
      }

      if (lane.hasBreakdown || lane.hasPothole) {
        this.ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        this.ctx.fillRect(0, laneY, width, laneHeight);
        this.ctx.fillStyle = "#f87171";
        this.ctx.font = "bold 11px Segoe UI, sans-serif";
        this.ctx.fillText(lane.hasBreakdown ? "⚠️ HAZARD / BREAKDOWN - CLICK TO TOW" : "⚠️ POTHOLE HAZARD - CLICK TO REPAIR", width * 0.25, laneY + laneHeight / 2 + 4);
      }

      this.ctx.fillStyle = laneLabelColor;
      this.ctx.font = "bold 10px monospace";
      this.ctx.fillText(laneTypeName, 8, laneY + laneHeight / 2 + 4);
    }

    // 4. OVERHEAD AUTO-TOLL RFID GANTRY & SENSORS
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(gantryX - 7, roadMargin - 14, 14, totalRoadHeight + 28);

    for (let i = 0; i < lanesCount; i++) {
      const lane = highway.lanes[i];
      const laneY = roadMargin + i * laneHeight;
      const isDebuffed = highway.isLaneDebuffed(lane);
      const isAutobahn = lane.laneType === "autobahn";
      const isProcessing = this.vehicles.some(v => (v.isChangingLane ? v.targetLaneIndex : v.laneIndex) === i && v.isWaitingAtToll);

      this.ctx.fillStyle = "#090d16";
      this.ctx.fillRect(gantryX - 24, laneY + laneHeight / 2 - 11, 48, 22);
      this.ctx.strokeStyle = isDebuffed ? "#ef4444" : (isAutobahn ? "#06b6d4" : (isProcessing ? "#f59e0b" : "#10b981"));
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(gantryX - 24, laneY + laneHeight / 2 - 11, 48, 22);

      this.ctx.fillStyle = isDebuffed ? "#ef4444" : (isAutobahn ? "#06b6d4" : (isProcessing ? "#f59e0b" : "#10b981"));
      this.ctx.font = "900 8.5px monospace";
      this.ctx.textAlign = "center";
      
      let label = `AUTO ⚡`;
      if (isDebuffed) label = "DEBUFF 🚫";
      else if (isAutobahn) label = "FREE 🏎️";
      else if (isProcessing) label = "SCAN ⏳";
      else if (activeGantryDelay === 0) label = "FAST ⚡";

      this.ctx.fillText(label, gantryX, laneY + laneHeight / 2 + 3);
      this.ctx.textAlign = "left";

      // Overhead laser scanning line when car is being scanned
      if (isProcessing && !isDebuffed && !isAutobahn) {
        this.ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(gantryX, laneY + 2);
        this.ctx.lineTo(gantryX, laneY + laneHeight - 2);
        this.ctx.stroke();
      }
    }

    // 5. DEER / WILDLIFE CROSSING: EXACTLY 5% PROBABILITY AT TOP OF EVERY HOUR 🦌
    if (game.gameState === "COMMUTE") {
      const currentHour = Math.floor(Formatter.getHour24(game.commuteProgress));
      
      // Check when hour changes in the 24-hour cycle
      if (currentHour !== this.lastCheckedHour) {
        this.lastCheckedHour = currentHour;
        
        // 5% chance at the top of every hour
        const deerChance = 0.05 * (game.modifiers.wildlifeRateMultiplier || 1.0);
        if (this.wildlife.length === 0 && Math.random() < deerChance) {
          this.wildlife.push({
            x: width * 0.48 + (Math.random() - 0.5) * 80,
            y: roadMargin - 15,
            targetY: roadMargin + totalRoadHeight + 15,
            speedY: 28,
            dir: 1
          });
          NotificationSystem.show("🦌 Wildlife Crossing at top of the hour! Click deer to guide safely!", "wildlife");
        }
      }
    }

    // Render & Move Wildlife 🦌
    for (let d = this.wildlife.length - 1; d >= 0; d--) {
      const deer = this.wildlife[d];
      deer.y += deer.speedY * delta;

      this.ctx.fillStyle = "#b45309";
      this.ctx.fillRect(deer.x - 8, deer.y - 6, 16, 12);
      this.ctx.fillStyle = "#d97706";
      this.ctx.fillRect(deer.x - 4, deer.y - 12, 8, 8);
      this.ctx.fillStyle = "#fef3c7";
      this.ctx.fillRect(deer.x - 6, deer.y - 16, 3, 5);
      this.ctx.fillRect(deer.x + 3, deer.y - 16, 3, 5);

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 9px monospace";
      this.ctx.fillText("🦌 DEER", deer.x - 14, deer.y - 18);

      if (deer.y >= deer.targetY) {
        this.wildlife.splice(d, 1);
      }
    }

    // 6. 24-HOUR DYNAMIC VEHICLE SPAWNING (REDUCED SLEEPY DRIVER PROBABILITY)
    if (game.gameState === "COMMUTE") {
      const baseCarWidth = Math.max(16, Math.min(36, laneHeight * 0.58));
      const surgeMultiplier = game.surgeActive ? 0.35 : 1.0;

      let densityMod = 1.0;
      if (hour24 < 5.0) densityMod = 1.6;
      else if (hour24 >= 7.0 && hour24 <= 9.5) densityMod = 0.65;
      else if (hour24 >= 16.0 && hour24 <= 19.0) densityMod = 0.6;

      const spawnCadence = Math.max(180, 780 * surgeMultiplier * densityMod);

      if (now - this.lastSpawnTime > spawnCadence) {
        this.lastSpawnTime = now;
        const targetLaneIndex = Math.floor(Math.random() * lanesCount);
        const lane = highway.lanes[targetLaneIndex];
        const laneType = lane.laneType || "standard";
        const typeDef = LANE_TYPES[laneType] || LANE_TYPES.standard;
        const isLaneDebuffed = highway.isLaneDebuffed(lane);

        let vType = "sedan";
        let vWidth = baseCarWidth;
        let vLength = baseCarWidth * 2.1;
        let vColor = laneType === "express" ? "#a855f7" : "#3b82f6";
        let speedMult = isLaneDebuffed ? 0.6 : typeDef.speedMult;
        let multRevenue = 1.0;
        let commuterWeight = 1;
        let isSleepy = false;

        const rand = Math.random();
        const freightChance = game.modifiers.freightRate || (hour24 < 5.0 || hour24 > 21.0 ? 0.45 : (laneType === "freight" ? 0.6 : 0.16));
        
        // Rare speeders (~3.5% base chance)
        const speederChance = game.modifiers.speederRate || (laneType === "autobahn" && !isLaneDebuffed ? 0.10 : 0.035);

        // Decreased Sleepy Driver probability (~5% late night, ~1.5% daytime)
        const isLateNight = hour24 < 5.5 || hour24 > 22.5;
        const sleepyChance = (isLateNight ? 0.05 : 0.015) * (game.modifiers.sleepyRateMultiplier || 1.0) * (game.adContracts.local_diner ? 0.2 : 1.0);

        if (Math.random() < sleepyChance) {
          isSleepy = true;
          speedMult *= 0.65;
        }

        if (game.modifiers.vipMotorcade && rand < 0.14) {
          vType = "vip";
          vColor = "#0f172a";
          vWidth = baseCarWidth * 1.05;
          vLength = baseCarWidth * 2.7;
          speedMult *= 1.1;
          multRevenue = 4.0;
          commuterWeight = 5;
        } else if (rand < 0.07) {
          vType = "ambulance";
          vColor = "#f8fafc";
          vWidth = baseCarWidth * 1.1;
          vLength = baseCarWidth * 2.5;
          speedMult *= 1.35;
          multRevenue = 2.0;
          commuterWeight = game.hasTrafficLaw("emergency_priority") ? 4 : 2;
        } else if (laneType === "brt" || ((hour24 >= 6.5 && hour24 <= 9.5) && rand < 0.25)) {
          vType = "bus";
          vColor = "#eab308";
          vWidth = baseCarWidth * 1.1;
          vLength = baseCarWidth * 3.4;
          speedMult *= 0.85;
          multRevenue = 3.0;
          commuterWeight = (laneType === "brt" && isLaneDebuffed) ? 1 : (game.hasTrafficLaw("brt_priority") ? 6 : 4);
        } else if (hour24 >= 16.0 && hour24 <= 19.5 && rand < 0.3) {
          vType = "muscle";
          vColor = "#dc2626";
          vWidth = baseCarWidth * 1.0;
          vLength = baseCarWidth * 2.2;
          speedMult *= 1.3;
          multRevenue = 1.2;
          commuterWeight = 1;
        } else if (laneType === "ev" || rand < 0.35 || game.hasTrafficLaw("green_corridor")) {
          vType = "ev";
          vColor = "#10b981";
          vWidth = baseCarWidth * 0.95;
          vLength = baseCarWidth * 2.2;
          speedMult *= isLaneDebuffed ? 0.9 : 1.35;
          multRevenue = game.hasTrafficLaw("green_corridor") ? 2.0 : 1.5;
          commuterWeight = 1;
        } else if (rand < (0.35 + freightChance)) {
          vType = "truck";
          vColor = "#f97316";
          vWidth = baseCarWidth * 1.18;
          vLength = baseCarWidth * 3.6;
          speedMult *= isLaneDebuffed ? 0.4 : 0.75;
          multRevenue = (laneType === "freight" && isLaneDebuffed) ? 1.0 : (game.hasTrafficLaw("heavy_hauler_tax") ? 5.0 : 3.0);
          commuterWeight = 1;
        } else if (rand < 0.48) {
          vType = "van";
          vColor = "#facc15";
          vWidth = baseCarWidth * 1.05;
          vLength = baseCarWidth * 2.5;
          speedMult *= 0.95;
          multRevenue = 1.4;
          commuterWeight = 1;
        } else if (rand < 0.58) {
          vType = "clunker";
          vColor = "#78716c";
          vWidth = baseCarWidth * 0.95;
          vLength = baseCarWidth * 2.0;
          speedMult *= 0.75;
          multRevenue = 0.8;
          commuterWeight = 1;
        }

        const isSpeeding = Math.random() < speederChance;
        const asphaltBoost = (game.hasTrafficLaw("overclocked_asphalt") ? 1.25 : 1.0) * (game.hasTrafficLaw("ghost_lane") ? 1.4 : 1.0);
        const baseMaxSpeed = 185 * speedMult * (isSpeeding ? 1.55 : 1.0) * asphaltBoost;

        if ((vType === "clunker" || Math.random() < 0.03) && !lane.hasBreakdown && !lane.hasPothole) {
          if (Math.random() < 0.25) lane.hasBreakdown = true;
        }

        const spawnX = -vLength;
        
        // Strict Entrance Clearance Check: Never spawn if a car is within 70px of the entrance line!
        const entranceBlocked = this.vehicles.some(v => (v.isChangingLane ? v.targetLaneIndex : v.laneIndex) === targetLaneIndex && v.x < vLength + 70);

        if (!entranceBlocked) {
          this.vehicles.push({
            id: Math.random().toString(36).substring(2, 9),
            laneIndex: targetLaneIndex,
            targetLaneIndex: targetLaneIndex,
            originLaneIndex: targetLaneIndex,
            x: spawnX,
            y: roadMargin + targetLaneIndex * laneHeight + laneHeight / 2,
            currentSpeed: baseMaxSpeed,
            maxSpeed: baseMaxSpeed,
            color: vColor,
            length: vLength,
            width: vWidth,
            vType: vType,
            multRevenue: multRevenue,
            commuterWeight: commuterWeight,
            isSpeeding: isSpeeding,
            isSleepy: isSleepy,
            sleepySwervePhase: Math.random() * Math.PI * 2,
            patience: 100,
            isRaging: false,
            honkTimer: 0,
            isBraking: false,
            isWaitingAtToll: false,
            tollProcessTimer: 0,
            totalProcessDelay: 0,
            isChangingLane: false,
            laneChangeProgress: 0,
            laneChangeCooldown: 1.0,
            turnSignal: null,
            processedToll: false,
            processedAd: false
          });
        }
      }
    }

    // 7. AUTO-TOLL SIMULATION & STRICT ANTI-OVERLAP VEHICLE PHYSICS
    const vehiclesByLane = {};
    for (let i = 0; i < lanesCount; i++) vehiclesByLane[i] = [];

    this.vehicles.forEach((v) => {
      const activeLane = v.isChangingLane ? v.targetLaneIndex : v.laneIndex;
      if (vehiclesByLane[activeLane]) {
        vehiclesByLane[activeLane].push(v);
      }
    });

    let ragingDriversCount = 0;

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];

      if (v.laneChangeCooldown > 0) v.laneChangeCooldown -= delta;

      const activeLaneIdx = v.isChangingLane ? v.targetLaneIndex : v.laneIndex;
      const lane = highway.lanes[activeLaneIdx] || highway.lanes[0];
      const isLaneDebuffed = highway.isLaneDebuffed(lane);
      const isAutobahn = lane ? lane.laneType === "autobahn" : false;

      // SLEEPY DRIVER LOGIC 😴
      if (v.isSleepy) {
        v.sleepySwervePhase += delta * 2.5;
        if (game.hasTrafficLaw("rumble_strips") && Math.abs(Math.sin(v.sleepySwervePhase)) > 0.8) {
          v.isSleepy = false;
          v.currentSpeed = v.maxSpeed;
          game.bank += 25;
          game.roundFinesCollected += 25;
          this.addFloatingText(v.x, v.y - 14, "📳 RUMBLE STRIP! +$25", "#60a5fa");
        }
      }

      // ROAD RAGE LOGIC: Patience drain when stopped or slowed down
      if (!v.isPolice && !v.isSleepy) {
        const isHeldUp = v.currentSpeed < v.maxSpeed * 0.4 || v.isWaitingAtToll;
        const rageMultiplier = game.modifiers.rageRateMultiplier || 1.0;
        const defensiveBuffer = game.hasTrafficLaw("defensive_driving") ? 0.3 : 1.0;

        if (isHeldUp) {
          const drainRate = (v.vType === "muscle" ? 22 : 12) * rageMultiplier * defensiveBuffer;
          v.patience = Math.max(0, v.patience - drainRate * delta);
        } else {
          v.patience = Math.min(100, v.patience + 8 * delta);
        }

        if (game.adContracts.anger_management && v.patience < 40 && Math.random() < 0.05) {
          v.patience = 100;
          v.isRaging = false;
        }

        if (v.patience < 40 && v.honkTimer <= 0) {
          v.honkTimer = 2.5 + Math.random() * 2.0;
          const honkText = HONK_PHRASES[Math.floor(Math.random() * HONK_PHRASES.length)];
          this.addFloatingText(v.x, v.y - 16, honkText, "#ef4444");
          game.sound.playHonk();

          if (game.hasTrafficLaw("honking_surcharge")) {
            game.bank += 6;
            game.roundFinesCollected += 6;
            this.addFloatingText(v.x, v.y - 30, "+$6 NOISE FINE!", "#facc15");
          }
        }
        if (v.honkTimer > 0) v.honkTimer -= delta;

        if (v.patience <= 0) {
          v.isRaging = true;
          ragingDriversCount++;
          this.addParticle(v.x - v.length / 2, v.y + (Math.random() - 0.5) * 4, -40, (Math.random() - 0.5) * 10, "#ef4444", 3, 0.4);
        }
      }

      // Flock camera auto-ticket
      if (game.hasTrafficLaw("flock_surveillance") && v.isSpeeding && !v.processedToll && v.x >= gantryX - 10 && v.x <= gantryX + 20) {
        v.isSpeeding = false;
        const ticketBonus = game.getSpeederFine();
        game.bank += ticketBonus;
        game.roundFinesCollected += ticketBonus;
        game.stats.speedersCaught++;
        this.addFloatingText(v.x, v.y - 14, `📸 FLOCK TICKET! +$${ticketBonus}`, "#06b6d4");
        this.addParticle(gantryX, v.y, 0, 0, "#ffffff", 12, 0.2);
        game.sound.playRadarSnap();
        game.updateUIHeader();
        game.checkAchievements();
      }

      // Passive Billboard Ad Revenue trigger
      if (!v.processedAd && v.x >= width * 0.35 && game.billboards > 0) {
        v.processedAd = true;
        const earnedAd = game.collectAdRevenue(v);
        if (earnedAd > 0 && Math.random() < 0.4) {
          this.addFloatingText(v.x, v.y - 8, `+$${earnedAd} Ad`, "#facc15");
        }
      }

      // Find lead car in the same lane
      const laneCars = vehiclesByLane[activeLaneIdx] || [];
      let leadCar = null;
      let minDistAhead = Infinity;

      for (let j = 0; j < laneCars.length; j++) {
        const other = laneCars[j];
        if (other.id !== v.id && other.x > v.x) {
          const dist = other.x - v.x;
          if (dist < minDistAhead) {
            minDistAhead = dist;
            leadCar = other;
          }
        }
      }

      let targetSpeed = isLaneDebuffed ? v.maxSpeed * 0.55 : v.maxSpeed;

      // ==========================================
      // AUTOMATED TOLL PROCESSING WITH SPEED DELAYS
      // ==========================================
      if (!v.processedToll) {
        const stopLineX = gantryX - v.length / 2 - 4;
        const distToStopLine = stopLineX - v.x;

        if (isAutobahn) {
          if (v.x >= gantryX - 5) {
            v.processedToll = true;
            this.addFloatingText(v.x, v.y - 12, "FREE FLOW 🏎️", "#06b6d4");
          }
        } else if (activeGantryDelay > 0.05) {
          if (distToStopLine > 0 && distToStopLine < 50) {
            targetSpeed = Math.min(targetSpeed, (distToStopLine / 50) * v.maxSpeed);
          }

          if (v.x >= stopLineX - 5 && !v.isWaitingAtToll) {
            v.x = Math.min(v.x, stopLineX);
            v.currentSpeed = 0;
            v.isWaitingAtToll = true;
            v.isBraking = true;
            v.totalProcessDelay = activeGantryDelay;
            v.tollProcessTimer = activeGantryDelay;
            targetSpeed = 0;
          }

          if (v.isWaitingAtToll) {
            targetSpeed = 0;
            v.currentSpeed = 0;
            v.tollProcessTimer -= delta;

            if (v.tollProcessTimer <= 0) {
              v.isWaitingAtToll = false;
              v.isBraking = false;
              v.processedToll = true;
              v.currentSpeed = v.maxSpeed * 1.3;
              const earned = game.collectAutoToll(activeLaneIdx, v.multRevenue, v);
              this.addFloatingText(v.x, v.y - 12, `+$${earned} AUTO ⚡`, "#10b981");
              game.sound.playTollChime();
            }
          }
        } else {
          if (v.x >= gantryX - 5) {
            v.processedToll = true;
            const earned = game.collectAutoToll(activeLaneIdx, v.multRevenue, v);
            this.addFloatingText(v.x, v.y - 12, `+$${earned} FLY-THROUGH ⚡`, "#38bdf8");
            game.sound.playTollChime();
          }
        }
      }

      // Brake for crossing wildlife 🦌
      if (this.wildlife.length > 0 && !game.hasTrafficLaw("wildlife_bridge")) {
        const deer = this.wildlife[0];
        const distToDeer = deer.x - v.x;
        if (distToDeer > 0 && distToDeer < 110) {
          targetSpeed = 0;
        }
      }

      // Hazard slowdown
      if (lane && (lane.hasBreakdown || lane.hasPothole)) {
        const hazardX = width * 0.45;
        if (Math.abs(v.x - hazardX) < 100) {
          targetSpeed = Math.min(targetSpeed, 25);
        }
      }

      // ==========================================
      // STRICT ANTI-OVERLAPPING DISTANCE & CLAMPING
      // ==========================================
      const minBumperGap = 12;
      const safeHeadway = Math.max(22, v.currentSpeed * 0.28);

      if (leadCar) {
        const leadRearBumperX = leadCar.x - leadCar.length / 2;
        const vFrontBumperX = v.x + v.length / 2;
        const spaceAhead = leadRearBumperX - vFrontBumperX;

        if (spaceAhead <= minBumperGap) {
          targetSpeed = 0;
          v.currentSpeed = 0;
          v.x = leadRearBumperX - v.length / 2 - minBumperGap;
        } else if (spaceAhead < safeHeadway) {
          const ratio = Math.max(0, (spaceAhead - minBumperGap) / (safeHeadway - minBumperGap));
          targetSpeed = Math.min(targetSpeed, leadCar.currentSpeed * ratio, ratio * v.maxSpeed);
        }
      }

      const brakeForce = (game.modifiers.brakingMultiplier || 1.0) * 550 * delta;

      if (v.currentSpeed > targetSpeed + 2) {
        v.isBraking = true;
        v.currentSpeed = Math.max(targetSpeed, v.currentSpeed - brakeForce);
      } else {
        if (!v.isWaitingAtToll && !v.isConductingStop) {
          v.isBraking = false;
          if (v.currentSpeed < targetSpeed) {
            v.currentSpeed = Math.min(targetSpeed, v.currentSpeed + 450 * delta);
          }
        }
      }

      // Lane changing with strict collision checks
      const fastLaneChange = game.hasTrafficLaw("diamond_interchange") || game.hasTrafficLaw("ghost_lane") || v.isRaging;
      if (!v.isChangingLane && !v.isWaitingAtToll && !v.isConductingStop && v.laneChangeCooldown <= 0 && lanesCount > 1) {
        const isSlowed = (v.currentSpeed < v.maxSpeed * (v.isRaging ? 0.85 : 0.65)) || (leadCar && (leadCar.x - leadCar.length / 2) - (v.x + v.length / 2) < v.length * 2.2);

        if (isSlowed) {
          const candidateLanes = [];
          if (v.laneIndex > 0) candidateLanes.push(v.laneIndex - 1);
          if (v.laneIndex < lanesCount - 1) candidateLanes.push(v.laneIndex + 1);

          for (let c = 0; c < candidateLanes.length; c++) {
            const candIdx = candidateLanes[c];
            const candCars = vehiclesByLane[candIdx] || [];

            let candLead = null;
            let candFollow = null;
            let candLeadDist = Infinity;
            let candFollowDist = Infinity;

            for (let k = 0; k < candCars.length; k++) {
              const other = candCars[k];
              if (other.id !== v.id) {
                if (other.x > v.x) {
                  const d = other.x - v.x;
                  if (d < candLeadDist) { candLeadDist = d; candLead = other; }
                } else {
                  const d = v.x - other.x;
                  if (d < candFollowDist) { candFollowDist = d; candFollow = other; }
                }
              }
            }

            const candSpaceAhead = candLead ? (candLead.x - candLead.length / 2) - (v.x + v.length / 2) : Infinity;
            const candSpaceBehind = candFollow ? (v.x - v.length / 2) - (candFollow.x + candFollow.length / 2) : Infinity;

            if (candSpaceAhead > v.length * 2.4 && candSpaceBehind > v.length * 1.8) {
              v.isChangingLane = true;
              v.originLaneIndex = v.laneIndex;
              v.targetLaneIndex = candIdx;
              v.laneChangeProgress = 0;
              v.turnSignal = (candIdx > v.laneIndex) ? "down" : "up";
              v.laneChangeCooldown = fastLaneChange ? 0.6 : 2.2;
              break;
            }
          }
        }
      }

      v.x += v.currentSpeed * delta;

      if (v.isChangingLane) {
        v.laneChangeProgress += (fastLaneChange ? 4.5 : 2.2) * delta;
        const startY = roadMargin + v.originLaneIndex * laneHeight + laneHeight / 2;
        const endY = roadMargin + v.targetLaneIndex * laneHeight + laneHeight / 2;
        const prog = Math.min(1.0, v.laneChangeProgress);
        v.y = startY + (endY - startY) * Math.sin((prog * Math.PI) / 2);

        if (prog >= 1.0) {
          v.laneIndex = v.targetLaneIndex;
          v.isChangingLane = false;
          v.turnSignal = null;
        }
      } else {
        const swerveOffset = v.isSleepy ? Math.sin(v.sleepySwervePhase) * (laneHeight * 0.28) : 0;
        v.y = roadMargin + v.laneIndex * laneHeight + laneHeight / 2 + swerveOffset;
      }

      // Render Vehicle Graphic
      this.drawVehicle(v);

      // Despawn on exit (Counts towards Commuter Target Quota!)
      if (v.x > width + v.length + 40) {
        this.vehicles.splice(i, 1);
        game.stats.carsServed += v.commuterWeight;
        game.commutersServedThisRound += v.commuterWeight;
        game.updateCommuterHUD();
      }
    }

    if (game.gameState === "COMMUTE") {
      game.updateRageHUD(ragingDriversCount);
      game.updateLiveControlStatus();
    }

    // 8. PARTICLES & FLOATING TEXTS
    this.renderParticles(delta);
    this.renderFloatingTexts();
  }

  drawVehicle(v) {
    const hour24 = Formatter.getHour24(game.commuteProgress);
    const isNight = hour24 < 6.0 || hour24 > 19.5;

    // Headlight cones
    this.ctx.fillStyle = v.isRaging ? "rgba(239, 68, 68, 0.25)" : (isNight ? "rgba(254, 240, 138, 0.22)" : "rgba(254, 240, 138, 0.08)");
    this.ctx.beginPath();
    this.ctx.moveTo(v.x + v.length / 2, v.y - v.width * 0.25);
    this.ctx.lineTo(v.x + v.length / 2 + 55, v.y - v.width * 0.85);
    this.ctx.lineTo(v.x + v.length / 2 + 55, v.y + v.width * 0.85);
    this.ctx.lineTo(v.x + v.length / 2, v.y + v.width * 0.25);
    this.ctx.closePath();
    this.ctx.fill();

    if (v.isPolice) {
      this.ctx.fillStyle = "#0f172a";
      this.ctx.fillRect(v.x - v.length / 2, v.y - v.width / 2, v.length, v.width);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(v.x - v.length * 0.15, v.y - v.width / 2, v.length * 0.35, v.width);

      const isRed = Math.floor(this.blinkTimer) % 2 === 0;
      this.ctx.fillStyle = isRed ? "#ef4444" : "#38bdf8";
      this.ctx.fillRect(v.x - 3, v.y - v.width / 2 - 2, 6, v.width + 4);
    } else {
      if (v.isSpeeding || v.isRaging) {
        this.ctx.strokeStyle = v.isRaging ? "#dc2626" : "#ef4444";
        this.ctx.lineWidth = v.isRaging ? 3 : 2;
        this.ctx.strokeRect(v.x - v.length / 2 - 2, v.y - v.width / 2 - 2, v.length + 4, v.width + 4);
      }

      this.ctx.fillStyle = v.color;
      this.ctx.fillRect(v.x - v.length / 2, v.y - v.width / 2, v.length, v.width);

      if (v.vType === "ev") {
        this.ctx.strokeStyle = "#34d399";
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(v.x - v.length / 2, v.y - v.width / 2, v.length, v.width);
      } else if (v.vType === "bus") {
        this.ctx.fillStyle = "#0f172a";
        for (let w = -v.length * 0.35; w < v.length * 0.35; w += 10) {
          this.ctx.fillRect(v.x + w, v.y - v.width / 2 + 2, 6, v.width - 4);
        }
      }

      if (v.isSleepy) {
        this.ctx.fillStyle = "#93c5fd";
        this.ctx.font = "bold 9px monospace";
        this.ctx.fillText("💤 zzz", v.x - 12, v.y - v.width / 2 - 4);
      }
    }

    // Gantry Scanning Progress Bar
    if (v.isWaitingAtToll && v.totalProcessDelay > 0) {
      const scanPct = Math.max(0, Math.min(1, 1 - (v.tollProcessTimer / v.totalProcessDelay)));
      this.ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      this.ctx.fillRect(v.x - 14, v.y - v.width / 2 - 10, 28, 5);
      this.ctx.fillStyle = "#38bdf8";
      this.ctx.fillRect(v.x - 13, v.y - v.width / 2 - 9, 26 * scanPct, 3);
    }

    // Cabin Glass
    this.ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    const glassW = v.length * 0.3;
    const glassH = v.width * 0.75;
    this.ctx.fillRect(v.x - glassW / 2, v.y - glassH / 2, glassW, glassH);

    // Taillights
    const isBraking = v.isBraking || v.currentSpeed === 0 || v.isWaitingAtToll;
    this.ctx.fillStyle = isBraking ? "#ef4444" : "#7f1d1d";
    this.ctx.fillRect(v.x - v.length / 2, v.y - v.width / 2 + 2, 3, v.width * 0.3);
    this.ctx.fillRect(v.x - v.length / 2, v.y + v.width / 2 - v.width * 0.3 - 2, 3, v.width * 0.3);
  }

  renderParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta;

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
      this.ctx.globalAlpha = 1.0;

      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  renderFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.dy;
      ft.alpha -= 0.025;

      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = "bold 13px Segoe UI, sans-serif";
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.globalAlpha = 1.0;

      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }
}

// ==========================================
// 10. MAIN ROGUELIKE GAME ENGINE
// ==========================================
class RoguelikeEngine {
  constructor() {
    this.sound = new SoundFX();
    this.bank = 100;
    this.lifetimeBank = 100;
    this.urbanGrants = 0;
    this.currentAnte = 1;
    this.stageInAnte = 0;
    this.gameState = "PLANNING";

    this.highway = new Highway("Metro Turnpike");
    this.activeTrafficLaws = [];
    this.maxTrafficLaws = 5;
    this.currentDraftChoices = [];
    this.draftRerollsUsed = 0;

    // Gantry Speed Upgrades (Upgradeable Auto-Toll Speed)
    this.autoTollSpeedLevel = 1;

    // Game Simulation Speed (1x, 2x, 3x)
    this.gameSpeed = 1;

    // Billboard & Passive Ad Income
    this.billboards = 0;
    this.maxBillboards = 4;
    this.adContracts = {};
    this.roundAdRevenue = 0;

    this.selectedSector = "earth";
    this.sectors = [
      { id: "earth", name: "Earth Metroway", theme: "earth", cost: 0, unlocked: true },
      { id: "mars", name: "Mars Frontier Turnpike", theme: "mars", cost: 4, unlocked: false },
      { id: "cyber", name: "Cyber City 2099 Skyway", theme: "cyber", cost: 10, unlocked: false }
    ];

    this.metaUpgrades = {
      starting_capital: 0,
      starter_lane: 0,
      starter_auto_speed: 0,
      radar_precision: 0,
      law_pocket: 0,
      starter_billboard: 0
    };

    // 24-Hour Commuter Target Quotas (1:00 AM to 12:00 Midnight)
    this.targetCommutersInStage = 45;
    this.commutersServedThisRound = 0;
    this.commuteProgress = 0.0;
    this.commuteDurationSec = 85; // Slower day speed (~85s for full 24h at 1x)

    this.surgeActive = false;
    this.surgeTimer = 0;
    this.surgeCooldown = 0;

    // Round earnings
    this.roundTollsCollected = 0;
    this.roundFinesCollected = 0;

    this.modifiers = {};
    this.currentBossBlind = null;

    this.stats = {
      totalRuns: 0,
      bestAnte: 1,
      totalCommutesCleared: 0,
      bossesDefeated: 0,
      carsServed: 0,
      speedersCaught: 0,
      ragersHandled: 0,
      wildlifeHandled: 0,
      sleepyWoken: 0,
      totalRevenue: 0,
      totalAdRevenue: 0
    };

    this.unlockedAchievements = {};
    this.renderer = null;
    this.newsTicker = null;
    this.lastTickTime = Date.now();
  }

  init() {
    this.loadSave();
    this.newsTicker = new NewsTicker();
    this.newsTicker.start();
    this.renderer = new TrafficRenderer("highwayCanvas");

    this.applyMetaStarterBuffs();
    this.setupStageForecast();
    this.bindUIEvents();
    this.updateUI();

    if (!this.starterDraftCompleted && this.currentAnte === 1 && this.stageInAnte === 0 && this.stats.carsServed === 0) {
      this.generateStarterPool();
      setTimeout(() => this.openStarterModal(), 300);
    }

    setInterval(() => this.saveGame(), 5000);
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  hasTrafficLaw(id) {
    return this.activeTrafficLaws.some(l => l.id === id);
  }

  hasMetaUpgrade(id) {
    return (this.metaUpgrades[id] || 0) > 0;
  }

  applyMetaStarterBuffs() {
    if (this.hasMetaUpgrade("starting_capital")) {
      const extra = this.metaUpgrades.starting_capital * 30;
      this.bank += extra;
    }
    if (this.hasMetaUpgrade("starter_lane") && this.highway.lanes.length === 1) {
      this.highway.addLane("standard");
    }
    if (this.hasMetaUpgrade("starter_auto_speed")) {
      this.autoTollSpeedLevel = Math.min(5, 1 + this.metaUpgrades.starter_auto_speed);
    }
    if (this.hasMetaUpgrade("starter_billboard") && this.billboards === 0) {
      this.billboards = 1;
    }
    if (this.hasMetaUpgrade("law_pocket")) {
      this.maxTrafficLaws = 5 + this.metaUpgrades.law_pocket;
    }
  }

  getGlobalMultiplier() {
    const surgeMult = this.surgeActive ? 1.5 : 1.0;
    return surgeMult;
  }

  getSpeederFine() {
    const baseFine = 5; // $5 base speeder fine
    const precisionBonus = (this.metaUpgrades.radar_precision || 0) * 5;
    return Math.round((baseFine + precisionBonus) * this.getGlobalMultiplier());
  }

  getGantryDelay() {
    const tier = TOLL_SPEED_TIERS[Math.min(TOLL_SPEED_TIERS.length - 1, this.autoTollSpeedLevel - 1)];
    let delay = tier ? tier.delay : 1.8;
    if (this.modifiers.gantryDelayPenalty) {
      delay += this.modifiers.gantryDelayPenalty;
    }
    return Math.max(0, delay);
  }

  getGantrySpeedCost() {
    const nextTier = TOLL_SPEED_TIERS[this.autoTollSpeedLevel];
    return nextTier ? nextTier.cost : 999;
  }

  upgradeAutoTollSpeed() {
    if (this.autoTollSpeedLevel >= 5) {
      NotificationSystem.show("Auto-Toll Gantry already at Maximum Quantum Speed (Level 5)!", "warning");
      return;
    }
    const cost = this.getGantrySpeedCost();
    if (this.bank >= cost) {
      this.bank -= cost;
      this.autoTollSpeedLevel++;
      this.sound.playCashChime();
      const currentTier = TOLL_SPEED_TIERS[this.autoTollSpeedLevel - 1];
      NotificationSystem.show(`⚡ Upgraded Auto-Toll to ${currentTier.name} (${currentTier.delay}s delay)!`, "success");
      this.updateUI();
      this.checkAchievements();
    } else {
      NotificationSystem.show("Not enough budget to upgrade auto-toll speed!", "danger");
    }
  }

  cycleGameSpeed() {
    if (this.gameSpeed === 1) this.gameSpeed = 2;
    else if (this.gameSpeed === 2) this.gameSpeed = 3;
    else this.gameSpeed = 1;
    
    NotificationSystem.show(`⏩ Day Simulation Speed: ${this.gameSpeed}x`, "info");
    this.updateUI();
  }

  getTrafficPatternName() {
    const h = Formatter.getHour24(this.commuteProgress);
    if (h < 5.0) return "🌙 Graveyard Shift (1am-5am)";
    if (h < 7.0) return "🌅 Early Dawn Flow (5am-7am)";
    if (h < 9.5) return "🚗 Morning Inbound Surge (7am-9:30am)";
    if (h < 15.5) return "☀️ Commercial Flow (9:30am-3:30pm)";
    if (h < 19.5) return "🌆 Evening Commute Peak (3:30pm-7:30pm)";
    if (h < 22.0) return "🌇 Dusk & Night Owls (7:30pm-10pm)";
    return "🦉 Late Night Freight (10pm-Midnight)";
  }

  setupStageForecast() {
    this.modifiers = {};
    this.currentBossBlind = null;

    const baseAnteTarget = 35 + this.currentAnte * 14;
    if (this.stageInAnte === 0) {
      this.targetCommutersInStage = baseAnteTarget;
    } else if (this.stageInAnte === 1) {
      this.targetCommutersInStage = Math.round(baseAnteTarget * 1.4);
    } else {
      this.targetCommutersInStage = Math.round(baseAnteTarget * 1.9);
      
      const builtLaneTypes = [...new Set(this.highway.lanes.map(l => l.laneType))];
      const matchingDebuffBosses = BOSS_BLINDS.filter(b => b.debuffedLaneType && builtLaneTypes.includes(b.debuffedLaneType));
      
      if (matchingDebuffBosses.length > 0 && Math.random() < 0.65) {
        const chosen = matchingDebuffBosses[Math.floor(Math.random() * matchingDebuffBosses.length)];
        this.currentBossBlind = chosen;
      } else {
        const blindIndex = (this.currentAnte - 1) % BOSS_BLINDS.length;
        this.currentBossBlind = BOSS_BLINDS[blindIndex];
      }
      this.currentBossBlind.apply(this);
    }

    this.commutersServedThisRound = 0;
    this.commuteProgress = 0.0;
    this.roundTollsCollected = 0;
    this.roundFinesCollected = 0;
    this.roundAdRevenue = 0;
    this.draftRerollsUsed = 0;
  }

  startCommuteRush() {
    this.gameState = "COMMUTE";
    this.commuteProgress = 0.0;
    if (this.renderer) {
      this.renderer.lastCheckedHour = -1;
    }
    this.sound.playSurge();
    NotificationSystem.show("🚦 24-HOUR COMMUTE COMMENCED! Target: " + this.targetCommutersInStage + " Commuters!", "info");
    this.updateUI();
  }

  collectAutoToll(laneIndex, vehicleMult = 1.0, vehicle = null) {
    const lane = this.highway.lanes[laneIndex];
    if (!lane) return 0;

    // Autobahn is free ($0); Debuffed lanes also yield $0!
    if (this.highway.isLaneDebuffed(lane) || lane.laneType === "autobahn") {
      return 0;
    }

    let toll = lane.getTollValue(this.getGlobalMultiplier()) * vehicleMult;

    if (this.modifiers.regularTollMultiplier && !lane.isExpress) {
      toll *= this.modifiers.regularTollMultiplier;
    }

    this.activeTrafficLaws.forEach((law) => {
      if (law.onToll && vehicle) {
        toll = law.onToll(toll, vehicle, this);
      }
    });

    toll = Math.max(1, Math.round(toll));
    this.bank += toll;
    this.lifetimeBank += toll;
    this.roundTollsCollected += toll;
    this.stats.totalRevenue += toll;

    this.updateUIHeader();
    return toll;
  }

  getAdIncomePerCar() {
    let perCar = this.billboards * 1.0;

    if (this.hasTrafficLaw("billboard_deregulation")) {
      perCar *= 2.0;
    }

    AD_CONTRACTS.forEach((contract) => {
      if (this.adContracts[contract.id]) {
        perCar += contract.perCarBonus;
      }
    });

    return perCar;
  }

  collectAdRevenue(vehicle) {
    let adEarned = this.getAdIncomePerCar();
    if (vehicle.vType === "ev" && this.adContracts.supercar_dealership) {
      adEarned += 5;
    }

    adEarned = Math.round(adEarned);
    if (adEarned > 0) {
      this.bank += adEarned;
      this.lifetimeBank += adEarned;
      this.roundAdRevenue += adEarned;
      this.stats.totalAdRevenue += adEarned;
      this.updateUIHeader();
      this.checkAchievements();
    }
    return adEarned;
  }

  getBillboardCost() {
    return Math.floor(65 * Math.pow(1.6, this.billboards));
  }

  buyBillboard() {
    if (this.billboards >= this.maxBillboards) {
      NotificationSystem.show(`Max Billboards reached (${this.maxBillboards})!`, "warning");
      return;
    }
    const cost = this.getBillboardCost();
    if (this.bank >= cost) {
      this.bank -= cost;
      this.billboards++;
      this.sound.playCashChime();
      NotificationSystem.show(`Erected Roadside Billboard #${this.billboards}!`, "ad");
      this.updateUI();
      this.checkAchievements();
    } else {
      NotificationSystem.show("Not enough budget to erect billboard!", "danger");
    }
  }

  buyAdContract(contractId) {
    const contract = AD_CONTRACTS.find(c => c.id === contractId);
    if (!contract || this.adContracts[contractId]) return;

    if (this.bank >= contract.cost) {
      this.bank -= contract.cost;
      this.adContracts[contractId] = true;
      this.sound.playCashChime();
      NotificationSystem.show(`Signed ${contract.name}!`, "ad");
      this.updateUI();
      this.checkAchievements();
    } else {
      NotificationSystem.show("Not enough budget for this ad contract!", "danger");
    }
  }

  // ==========================================
  // LANE BUILD MODAL (PERMANENT TYPE SELECTION)
  // ==========================================
  openBuildLaneModal() {
    this.updateBuildLaneModalUI();
    document.getElementById("buildLaneModal").classList.add("is-active");
  }

  closeBuildLaneModal() {
    document.getElementById("buildLaneModal").classList.remove("is-active");
  }

  updateBuildLaneModalUI() {
    const grid = document.getElementById("buildLaneOptionsGrid");
    if (!grid) return;

    grid.innerHTML = "";
    Object.keys(LANE_TYPES).forEach((typeKey) => {
      const typeDef = LANE_TYPES[typeKey];
      const cost = this.highway.getLaneTypeCost(typeKey);
      const canAfford = this.bank >= cost;

      const card = document.createElement("div");
      card.className = `lane-build-card type-${typeKey}`;
      card.innerHTML = `
        <div>
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-1">
            <span class="is-size-5">${typeDef.icon}</span>
            <span class="tag ${typeDef.tagClass}">${typeDef.name}</span>
          </div>
          <p class="is-size-7 text-muted mb-3" style="min-height: 40px;">${typeDef.desc}</p>
        </div>
        <button class="button is-small ${canAfford ? 'is-highway' : 'is-dark'} is-fullwidth" onclick="game.confirmBuildLane('${typeKey}')">
          Build for $${cost}
        </button>
      `;
      grid.appendChild(card);
    });
  }

  confirmBuildLane(laneType) {
    const cost = this.highway.getLaneTypeCost(laneType);
    if (this.bank >= cost) {
      this.bank -= cost;
      if (this.hasTrafficLaw("bogo_permit")) {
        this.bank += Math.floor(cost * 0.35);
      }
      const newLane = this.highway.addLane(laneType);
      this.sound.playCashChime();
      NotificationSystem.show(`Constructed Permanent ${LANE_TYPES[laneType].name} (Lane #${newLane.id}) with Auto-Toll!`, "success");
      this.closeBuildLaneModal();
      this.updateUI();
      this.checkAchievements();
    } else {
      NotificationSystem.show("Not enough budget to construct this lane type!", "danger");
    }
  }

  triggerRushHourSurge() {
    if (this.surgeActive || this.surgeCooldown > 0) return;
    this.surgeActive = true;
    const duration = 15;
    this.surgeTimer = duration;
    this.surgeCooldown = 35;
    this.sound.playSurge();
    NotificationSystem.show("⚡ RUSH HOUR SURGE ACTIVATED! 1.5x Flow Speed!", "warning");
    this.updateUI();
  }

  dispatchEmergencyTow() {
    let cleared = 0;
    this.highway.lanes.forEach((l) => {
      if (l.hasBreakdown || l.hasPothole) {
        l.hasBreakdown = false;
        l.hasPothole = false;
        cleared++;
      }
    });

    if (cleared > 0) {
      const bonus = cleared * 50 * this.getGlobalMultiplier();
      this.bank += bonus;
      this.roundFinesCollected += bonus;
      this.sound.playSirenChirp();
      NotificationSystem.show(`🚨 Emergency Tow Squad cleared ${cleared} hazard(s)! +$${bonus}`, "success");
      this.updateUI();
    } else {
      NotificationSystem.show("No active road hazards to clear!", "info");
    }
  }

  triggerRadarSweep() {
    let speedersHit = 0;
    this.renderer.vehicles.forEach((v) => {
      if (v.isSpeeding || v.isRaging || v.isSleepy) {
        v.isSpeeding = false;
        v.isRaging = false;
        v.isSleepy = false;
        v.patience = 100;
        v.maxSpeed /= 1.4;
        speedersHit++;
      }
    });

    if (speedersHit > 0) {
      const totalFine = speedersHit * this.getSpeederFine();
      this.bank += totalFine;
      this.roundFinesCollected += totalFine;
      this.stats.speedersCaught += speedersHit;
      this.sound.playRadarSnap();
      NotificationSystem.show(`📸 Radar Sweep ticketed / alerted ${speedersHit} vehicles! +$${totalFine}`, "warning");
      this.updateUI();
      this.checkAchievements();
    } else {
      NotificationSystem.show("No active violators or sleepy drivers on the highway!", "info");
    }
  }

  // ==========================================
  // HARD LIMIT EVALUATION AT 12:00 MIDNIGHT
  // ==========================================
  evaluateDayEnd() {
    if (this.commutersServedThisRound >= this.targetCommutersInStage) {
      this.completeCommuteStage();
    } else {
      this.triggerGameOver();
    }
  }

  completeCommuteStage() {
    this.gameState = "DEBRIEF";
    this.stats.totalCommutesCleared++;

    const extra = this.commutersServedThisRound - this.targetCommutersInStage;
    let grade = "A+";
    let gradeClass = "grade-s";
    let gradeDesc = `Outstanding! Exceeded target by +${extra} commuters!`;

    if (extra === 0) {
      grade = "B"; gradeClass = "grade-b"; gradeDesc = "Target satisfied right at Midnight cutoff!";
    } else if (extra < 5) {
      grade = "A"; gradeClass = "grade-a"; gradeDesc = "Clean 24-hour volume clearance!";
    }

    const interest = Math.min(10, Math.floor(this.bank / 5));
    this.bank += interest;

    let bossBonus = 0;
    let grantAward = 0;
    if (this.stageInAnte === 2) {
      bossBonus = 100 + this.currentAnte * 25;
      grantAward = 1;
      this.bank += bossBonus;
      this.urbanGrants += grantAward;
      this.stats.bossesDefeated++;
      this.sound.playVictoryFanfare();
    } else {
      this.sound.playCashChime();
    }

    const totalRoundCash = this.roundTollsCollected + this.roundAdRevenue + this.roundFinesCollected + interest + bossBonus;

    document.getElementById("debriefGradeDisplay").className = `summary-grade-badge ${gradeClass}`;
    document.getElementById("debriefGradeDisplay").innerText = grade;
    document.getElementById("debriefGradeText").innerText = gradeDesc;

    document.getElementById("debriefCarsCount").innerText = `${this.commutersServedThisRound} / ${this.targetCommutersInStage} Target`;
    document.getElementById("debriefTollsVal").innerText = `+$${this.roundTollsCollected}`;
    document.getElementById("debriefAdsVal").innerText = `+$${this.roundAdRevenue}`;
    document.getElementById("debriefFinesVal").innerText = `+$${this.roundFinesCollected}`;
    document.getElementById("debriefInterestVal").innerText = `+$${interest}`;

    const bossRow = document.getElementById("debriefBossBonusRow");
    if (bossBonus > 0) {
      bossRow.style.display = "flex";
      document.getElementById("debriefBossBonusVal").innerText = `+$${bossBonus} (+${grantAward} Grant)`;
    } else {
      bossRow.style.display = "none";
    }

    document.getElementById("debriefTotalVal").innerText = `+$${totalRoundCash}`;
    document.getElementById("debriefModal").classList.add("is-active");

    this.checkAchievements();
    this.saveGame();
  }

  advanceToShop() {
    document.getElementById("debriefModal").classList.remove("is-active");

    if (this.stageInAnte === 2) {
      if (this.currentAnte === 8) {
        this.triggerVictory();
        return;
      }
      this.currentAnte++;
      this.stageInAnte = 0;
      if (this.currentAnte > this.stats.bestAnte) {
        this.stats.bestAnte = this.currentAnte;
      }
      NotificationSystem.show(`🏆 ANTE ${this.currentAnte - 1} CLEARED! Welcome to Ante ${this.currentAnte}!`, "boss");
    } else {
      this.stageInAnte++;
    }

    this.gameState = "PLANNING";
    this.setupStageForecast();
    this.renderer.vehicles = [];
    this.renderer.wildlife = [];
    if (this.renderer) {
      this.renderer.lastCheckedHour = -1;
    }
    this.shopRerollsUsed = 0;
    this.generateShopInventory();
    this.updateUI();

    setTimeout(() => this.openShopModal(), 300);
  }

  triggerGameOver() {
    this.gameState = "GAMEOVER";
    this.sound.playGameOverDrone();

    const grantedTokens = Math.max(1, Math.floor(this.stats.carsServed / 60));
    this.urbanGrants += grantedTokens;

    document.getElementById("goAnteDisplay").innerText = `Ante ${this.currentAnte} • ${this.stageInAnte === 2 ? "Boss Commute" : (this.stageInAnte === 1 ? "Big Commute" : "Small Commute")}`;
    document.getElementById("goCarsDisplay").innerText = `${this.commutersServedThisRound} / ${this.targetCommutersInStage} Required`;
    document.getElementById("goGrantsDisplay").innerText = `+${grantedTokens} 🏛️`;

    document.getElementById("gameOverModal").classList.add("is-active");
    this.saveGame();
  }

  triggerVictory() {
    this.gameState = "VICTORY";
    this.sound.playVictoryFanfare();
    this.urbanGrants += 5;
    document.getElementById("victoryModal").classList.add("is-active");
    this.saveGame();
  }

  enterEndlessMode() {
    document.getElementById("victoryModal").classList.remove("is-active");
    this.currentAnte = 9;
    this.stageInAnte = 0;
    this.gameState = "PLANNING";
    this.setupStageForecast();
    this.renderer.vehicles = [];
    this.renderer.wildlife = [];
    this.shopRerollsUsed = 0;
    this.generateShopInventory();
    this.updateUI();
    NotificationSystem.show("♾️ ENTERED ENDLESS MODE! Survive as long as you can!", "warning");
    setTimeout(() => this.openShopModal(), 300);
  }

  startNewRun() {
    document.getElementById("gameOverModal").classList.remove("is-active");
    document.getElementById("victoryModal").classList.remove("is-active");

    this.currentAnte = 1;
    this.stageInAnte = 0;
    this.gameState = "PLANNING";
    this.bank = 100;
    this.autoTollSpeedLevel = 1;
    this.gameSpeed = 1;
    this.activeTrafficLaws = [];
    this.billboards = 0;
    this.adContracts = {};
    this.highway = new Highway("Metro Turnpike");
    this.renderer.vehicles = [];
    this.renderer.wildlife = [];
    if (this.renderer) {
      this.renderer.lastCheckedHour = -1;
    }

    this.applyMetaStarterBuffs();
    this.setupStageForecast();
    this.starterDraftCompleted = false;
    this.shopRerollsUsed = 0;
    this.generateStarterPool();
    this.updateUI();
    NotificationSystem.show("New Run Started! Select 2 Starter Perks to begin!", "info");
    setTimeout(() => this.openStarterModal(), 250);
  }

  // ==========================================
  // STARTER PROCUREMENT SYSTEM (PICK 2 OF 6 AT START)
  // ==========================================
  generateStarterPool() {
    this.selectedStarterIds = [];

    // 1. Category: 2 Traffic Laws
    const unownedLaws = TRAFFIC_LAWS_CATALOG.filter(l => !this.hasTrafficLaw(l.id));
    const shuffledLaws = [...unownedLaws].sort(() => 0.5 - Math.random());
    const selectedLaws = shuffledLaws.slice(0, 2);

    const lawCards = selectedLaws.map(law => ({
      id: `law_${law.id}`,
      category: "law",
      name: law.name,
      icon: law.icon,
      tag: `${law.rarity} Law`,
      desc: law.desc,
      apply: () => {
        if (!this.hasTrafficLaw(law.id)) {
          this.activeTrafficLaws.push(law);
        }
      }
    }));

    // 2. Category: 2 Lane Upgrades / Auto-Toll Upgrades
    const laneInfraPool = [
      {
        id: "starter_express_lane",
        category: "infra",
        name: "⚡ Pre-Paved Express Lane",
        icon: "⚡",
        tag: "Highway Lane",
        desc: "Adds an immediate 2nd Express HOV 3x Lane with auto-toll ($3 toll value)!",
        apply: () => { this.highway.addLane("express"); }
      },
      {
        id: "starter_freight_lane",
        category: "infra",
        name: "🚚 Heavy Freight Bypass",
        icon: "🚚",
        tag: "Highway Lane",
        desc: "Adds an immediate 2nd Freight Corridor Lane ($2 base, 5x trucks)!",
        apply: () => { this.highway.addLane("freight"); }
      },
      {
        id: "starter_ev_lane",
        category: "infra",
        name: "🔋 EV Fast-Track Lane",
        icon: "🔋",
        tag: "Highway Lane",
        desc: "Adds an immediate 2nd EV Fast-Track Lane with +50% induction speed coils!",
        apply: () => { this.highway.addLane("ev"); }
      },
      {
        id: "starter_autobahn_lane",
        category: "infra",
        name: "🏎️ Unrestricted Autobahn",
        icon: "🏎️",
        tag: "Highway Lane",
        desc: "Adds an immediate 2nd Autobahn Lane (2.0x flow speed, $0 tolls) for max commuter throughput!",
        apply: () => { this.highway.addLane("autobahn"); }
      },
      {
        id: "starter_auto_gantry",
        category: "infra",
        name: "⚡ RFID Gantry Upgrade",
        icon: "⚡",
        tag: "Gantry Speed",
        desc: "Instantly upgrades Auto-Toll Gantry to Level 2 (cuts gate stop delay to 1.1s)!",
        apply: () => { this.autoTollSpeedLevel = Math.max(this.autoTollSpeedLevel, 2); }
      },
      {
        id: "starter_asphalt_boost",
        category: "infra",
        name: "🏁 Performance Asphalt",
        icon: "🏁",
        tag: "Highway Perk",
        desc: "Permanent +20% vehicle flow speed across all lanes for this run!",
        apply: () => { this.modifiers.permanentSpeedBoost = 1.20; }
      }
    ];
    const shuffledLaneInfra = [...laneInfraPool].sort(() => 0.5 - Math.random());
    const selectedInfra = shuffledLaneInfra.slice(0, 2);

    // 3. Category: 2 Billboard / Ad Options
    const adPool = [
      {
        id: "starter_free_billboard",
        category: "ads",
        name: "📢 Free Roadside Billboard",
        icon: "📢",
        tag: "Billboard",
        desc: "Erects an active roadside billboard on Day 1 for passive ad income per passing car!",
        apply: () => { this.billboards = Math.min(this.maxBillboards, this.billboards + 1); }
      },
      {
        id: "starter_diner_contract",
        category: "ads",
        name: "☕ Bob's 24h Diner Ad",
        icon: "☕",
        tag: "Ad Contract",
        desc: "Signed sponsorship contract: +$1.00/car and cuts sleepy drivers on road by 80%!",
        apply: () => { this.adContracts.local_diner = true; }
      },
      {
        id: "starter_anger_contract",
        category: "ads",
        name: "🧘 Zen Anger Management Ad",
        icon: "🧘",
        tag: "Ad Contract",
        desc: "Signed sponsorship contract: +$1.00/car and instantly calms 60% of road raging cars!",
        apply: () => { this.adContracts.anger_management = true; }
      },
      {
        id: "starter_lawyer_contract",
        category: "ads",
        name: "⚖️ Injury Lawyer Ad",
        icon: "⚖️",
        tag: "Ad Contract",
        desc: "Signed contract: +$2.00/car and +$10 bonus bounty on every ticketed speeder!",
        apply: () => { this.adContracts.injury_lawyer = true; }
      }
    ];
    const shuffledAds = [...adPool].sort(() => 0.5 - Math.random());
    const selectedAds = shuffledAds.slice(0, 2);

    this.starterCards = {
      laws: lawCards,
      infra: selectedInfra,
      ads: selectedAds
    };
  }

  openStarterModal() {
    if (!this.starterCards || !this.starterCards.laws || this.starterCards.laws.length === 0) {
      this.generateStarterPool();
    }
    this.renderStarterModalUI();
    document.getElementById("starterModal").classList.add("is-active");
  }

  closeStarterModal() {
    document.getElementById("starterModal").classList.remove("is-active");
  }

  toggleStarterCard(cardId) {
    const idx = this.selectedStarterIds.indexOf(cardId);
    if (idx !== -1) {
      this.selectedStarterIds.splice(idx, 1);
    } else {
      if (this.selectedStarterIds.length >= 2) {
        this.selectedStarterIds.shift(); // Remove oldest to keep 2 selected
      }
      this.selectedStarterIds.push(cardId);
    }

    this.sound.playDraftSelect();
    this.renderStarterModalUI();
  }

  confirmStarterSelection() {
    if (this.selectedStarterIds.length !== 2) return;

    const allCards = [
      ...this.starterCards.laws,
      ...this.starterCards.infra,
      ...this.starterCards.ads
    ];

    this.selectedStarterIds.forEach(id => {
      const card = allCards.find(c => c.id === id);
      if (card && typeof card.apply === "function") {
        card.apply();
      }
    });

    this.starterDraftCompleted = true;
    this.sound.playCashChime();
    NotificationSystem.show("Starter Package Enacted! Launch Ante 1 when ready!", "success");
    this.closeStarterModal();
    this.updateUI();
    this.saveGame();
  }

  renderStarterModalUI() {
    const badge = document.getElementById("starterSelectionBadge");
    const confirmBtn = document.getElementById("confirmStarterBtn");
    const hint = document.getElementById("starterFooterHint");

    const lawsList = document.getElementById("starterLawsList");
    const infraList = document.getElementById("starterInfraList");
    const adsList = document.getElementById("starterAdsList");

    const count = this.selectedStarterIds.length;
    if (badge) {
      badge.innerText = `Selected: ${count} / 2`;
      badge.className = count === 2 ? "tag is-success is-medium has-text-weight-bold" : "tag is-warning is-medium has-text-weight-bold";
    }

    if (confirmBtn) {
      confirmBtn.disabled = count !== 2;
      confirmBtn.innerText = `🚦 Confirm Starter Package (${count}/2)`;
    }

    if (hint) {
      hint.innerText = count === 2 ? "✓ 2 perks selected! Ready to launch transit run." : `Please pick ${2 - count} more perk${count === 1 ? "" : "s"} to begin.`;
    }

    const renderCategory = (container, cards) => {
      if (!container) return;
      container.innerHTML = "";
      cards.forEach(card => {
        const isSelected = this.selectedStarterIds.includes(card.id);
        const el = document.createElement("div");
        el.className = `starter-card ${isSelected ? "is-selected" : ""}`;
        el.onclick = () => this.toggleStarterCard(card.id);
        el.innerHTML = `
          <div class="select-badge">${isSelected ? "✓" : "+"}</div>
          <div>
            <span class="tag is-dark is-small mb-1">${card.tag || "Perk"}</span>
            <div class="starter-icon">${card.icon}</div>
            <div class="starter-title">${card.name}</div>
            <div class="starter-desc">${card.desc}</div>
          </div>
        `;
        container.appendChild(el);
      });
    };

    if (this.starterCards) {
      renderCategory(lawsList, this.starterCards.laws || []);
      renderCategory(infraList, this.starterCards.infra || []);
      renderCategory(adsList, this.starterCards.ads || []);
    }
  }

  // ==========================================
  // BALATRO-STYLE TRANSIT SHOP SYSTEM
  // ==========================================
  getLawPrice(rarity) {
    switch (rarity) {
      case "common": return 6;
      case "uncommon": return 10;
      case "rare": return 15;
      case "legendary": return 25;
      default: return 8;
    }
  }

  getShopRerollCost() {
    return 5 + (this.shopRerollsUsed || 0) * 2;
  }

  generateShopInventory() {
    // 1. Generate 2 Traffic Laws
    const unownedLaws = TRAFFIC_LAWS_CATALOG.filter(l => !this.hasTrafficLaw(l.id));
    const shuffledLaws = [...unownedLaws].sort(() => 0.5 - Math.random());
    const selectedLaws = shuffledLaws.slice(0, 2);

    const lawItems = selectedLaws.map(law => ({
      law: law,
      cost: this.getLawPrice(law.rarity),
      bought: false
    }));

    // 2. Generate 2 Infrastructure / Upgrade Options
    const infraPool = [];

    // Option A: Auto-Toll Gantry Upgrade
    if (this.autoTollSpeedLevel < 5) {
      const nextTier = TOLL_SPEED_TIERS[this.autoTollSpeedLevel];
      if (nextTier) {
        infraPool.push({
          id: `toll_speed_${this.autoTollSpeedLevel + 1}`,
          type: "gantry",
          cardClass: "infra-card",
          name: `⚡ Gantry Speed Lvl ${this.autoTollSpeedLevel + 1}`,
          tag: "Auto-Toll Gantry",
          icon: "⚡",
          desc: `${nextTier.name}: Reduces gate stop delay to ${nextTier.delay}s!`,
          cost: nextTier.cost,
          bought: false,
          onBuy: () => this.upgradeAutoTollSpeed()
        });
      }
    }

    // Option B: Roadside Billboard
    if (this.billboards < this.maxBillboards) {
      const bCost = this.getBillboardCost();
      infraPool.push({
        id: `billboard_${this.billboards + 1}`,
        type: "billboard",
        cardClass: "infra-card",
        name: `📢 Roadside Billboard #${this.billboards + 1}`,
        tag: "Advertising Structure",
        icon: "📢",
        desc: `Erects billboard #${this.billboards + 1} earning passive ad revenue per car!`,
        cost: bCost,
        bought: false,
        onBuy: () => this.buyBillboard()
      });
    }

    // Option C: Unsigned Corporate Ad Contracts
    const unsignedContracts = AD_CONTRACTS.filter(c => !this.adContracts[c.id]);
    unsignedContracts.forEach(contract => {
      infraPool.push({
        id: `ad_${contract.id}`,
        type: "contract",
        cardClass: "contract-card",
        name: contract.name,
        tag: "Ad Contract",
        icon: contract.icon,
        desc: contract.desc,
        cost: contract.cost,
        bought: false,
        onBuy: () => this.buyAdContract(contract.id)
      });
    });

    // Option D: Specialized Highway Boosters & Consumables
    infraPool.push({
      id: "nitro_asphalt",
      type: "booster",
      cardClass: "infra-card",
      name: "🏎️ Nitro Asphalt Coating",
      tag: "Highway Booster",
      icon: "🏎️",
      desc: "+25% Speed Boost across all lanes for the next commute!",
      cost: 20,
      bought: false,
      onBuy: () => {
        this.modifiers.nitroBoost = 1.25;
        NotificationSystem.show("🏎️ Applied Nitro Asphalt for the upcoming commute!", "success");
      }
    });

    infraPool.push({
      id: "gold_transponders",
      type: "booster",
      cardClass: "infra-card",
      name: "💎 Golden Toll Transponder",
      tag: "Revenue Booster",
      icon: "💎",
      desc: "+50% Toll Revenue multiplier on all lanes for the next commute!",
      cost: 25,
      bought: false,
      onBuy: () => {
        this.modifiers.regularTollMultiplier = (this.modifiers.regularTollMultiplier || 1.0) * 1.5;
        NotificationSystem.show("💎 Golden Transponders active for next commute!", "success");
      }
    });

    infraPool.push({
      id: "polymer_pavement",
      type: "booster",
      cardClass: "infra-card",
      name: "🛡️ Polymer Pavement Armor",
      tag: "Highway Armor",
      icon: "🛡️",
      desc: "Instantly repairs all hazards and prevents potholes for the next commute!",
      cost: 16,
      bought: false,
      onBuy: () => {
        this.dispatchEmergencyTow();
        NotificationSystem.show("🛡️ Highway armored with Polymer Pavement!", "success");
      }
    });

    infraPool.push({
      id: "grant_voucher",
      type: "grant",
      cardClass: "infra-card",
      name: "🏛️ Federal Transit Voucher",
      tag: "Planning Token",
      icon: "🏛️",
      desc: "Grants +1 permanent Urban Planning Grant token for the Bureau!",
      cost: 45,
      bought: false,
      onBuy: () => {
        this.urbanGrants += 1;
        NotificationSystem.show("🏛️ Acquired +1 Urban Planning Grant!", "success");
      }
    });

    // Pick 2 random items from infraPool
    const shuffledInfra = [...infraPool].sort(() => 0.5 - Math.random());
    const selectedInfra = shuffledInfra.slice(0, 2);

    this.shopInventory = {
      laws: lawItems,
      infra: selectedInfra
    };
  }

  openShopModal() {
    if (!this.shopInventory || !this.shopInventory.laws) {
      this.generateShopInventory();
    }
    this.renderShopModalUI();
    document.getElementById("shopModal").classList.add("is-active");
  }

  closeShopModal() {
    document.getElementById("shopModal").classList.remove("is-active");
    this.updateUI();
  }

  rerollShop() {
    const cost = this.getShopRerollCost();
    if (this.bank >= cost) {
      this.bank -= cost;
      this.shopRerollsUsed = (this.shopRerollsUsed || 0) + 1;
      this.generateShopInventory();
      this.sound.playDraftSelect();
      NotificationSystem.show(`Rerolled Transit Shop for $${cost}!`, "info");
      this.renderShopModalUI();
      this.updateUI();
    } else {
      NotificationSystem.show("Not enough budget to reroll shop!", "danger");
    }
  }

  buyShopLaw(slotIndex) {
    const item = this.shopInventory.laws[slotIndex];
    if (!item || item.bought) return;

    if (this.activeTrafficLaws.length >= this.maxTrafficLaws) {
      NotificationSystem.show(`Max Traffic Laws reached (${this.maxTrafficLaws})!`, "warning");
      return;
    }

    if (this.bank >= item.cost) {
      this.bank -= item.cost;
      item.bought = true;
      this.activeTrafficLaws.push(item.law);
      this.sound.playCashChime();
      NotificationSystem.show(`Purchased & Enacted: ${item.law.name}!`, "success");
      this.renderShopModalUI();
      this.updateUI();
    } else {
      NotificationSystem.show("Not enough budget to purchase this Traffic Law!", "danger");
    }
  }

  buyShopInfra(slotIndex) {
    const item = this.shopInventory.infra[slotIndex];
    if (!item || item.bought) return;

    if (this.bank >= item.cost) {
      this.bank -= item.cost;
      item.bought = true;
      if (typeof item.onBuy === "function") {
        item.onBuy();
      }
      this.sound.playCashChime();
      this.renderShopModalUI();
      this.updateUI();
    } else {
      NotificationSystem.show("Not enough budget to purchase this infrastructure!", "danger");
    }
  }

  renderShopModalUI() {
    const bankDisp = document.getElementById("shopBankDisplay");
    const lawsCountDisp = document.getElementById("shopLawsCount");
    const rerollTag = document.getElementById("shopRerollTag");
    const rerollCostDisp = document.getElementById("shopRerollCostDisplay");
    const laneCostDisp = document.getElementById("shopLaneCostDisplay");
    const lawsGrid = document.getElementById("shopLawsGrid");
    const infraGrid = document.getElementById("shopInfraGrid");

    const rerollCost = this.getShopRerollCost();
    if (bankDisp) bankDisp.innerText = `$${Formatter.formatNumber(this.bank)}`;
    if (lawsCountDisp) lawsCountDisp.innerText = `${this.activeTrafficLaws.length}/${this.maxTrafficLaws}`;
    if (rerollTag) rerollTag.innerText = `Reroll: $${rerollCost}`;
    if (rerollCostDisp) rerollCostDisp.innerText = rerollCost;
    if (laneCostDisp) laneCostDisp.innerText = Formatter.formatNumber(this.highway.getBaseNewLaneCost());

    // 1. Render Traffic Laws Grid (2 items)
    if (lawsGrid) {
      lawsGrid.innerHTML = "";
      if (this.shopInventory && this.shopInventory.laws) {
        this.shopInventory.laws.forEach((item, idx) => {
          const law = item.law;
          const canAfford = this.bank >= item.cost && this.activeTrafficLaws.length < this.maxTrafficLaws;
          const card = document.createElement("div");
          card.className = `shop-item-card ${law.rarity} ${item.bought ? "is-sold" : ""}`;
          card.innerHTML = `
            <div>
              <div class="item-header">
                <span class="item-tag tag is-dark ${law.rarity}">${law.rarity}</span>
                <span class="item-price">$${item.cost}</span>
              </div>
              <div class="item-icon">${law.icon}</div>
              <div class="item-name">${law.name}</div>
              <div class="item-desc">${law.desc}</div>
            </div>
            <button class="button is-small ${item.bought ? 'is-dark' : (canAfford ? 'is-warning' : 'is-dark')} is-fullwidth has-text-weight-bold" 
                    ${item.bought || !canAfford ? 'disabled' : ''} 
                    onclick="game.buyShopLaw(${idx})">
              ${item.bought ? 'SOLD ✓' : `Buy ($${item.cost})`}
            </button>
          `;
          lawsGrid.appendChild(card);
        });
      }
    }

    // 2. Render Infrastructure & Upgrades Grid (2 items)
    if (infraGrid) {
      infraGrid.innerHTML = "";
      if (this.shopInventory && this.shopInventory.infra) {
        this.shopInventory.infra.forEach((item, idx) => {
          const canAfford = this.bank >= item.cost;
          const card = document.createElement("div");
          card.className = `shop-item-card ${item.cardClass || "infra-card"} ${item.bought ? "is-sold" : ""}`;
          card.innerHTML = `
            <div>
              <div class="item-header">
                <span class="item-tag tag is-info">${item.tag || "Upgrade"}</span>
                <span class="item-price">$${item.cost}</span>
              </div>
              <div class="item-icon">${item.icon || "⚡"}</div>
              <div class="item-name">${item.name}</div>
              <div class="item-desc">${item.desc}</div>
            </div>
            <button class="button is-small ${item.bought ? 'is-dark' : (canAfford ? 'is-info' : 'is-dark')} is-fullwidth has-text-weight-bold" 
                    ${item.bought || !canAfford ? 'disabled' : ''} 
                    onclick="game.buyShopInfra(${idx})">
              ${item.bought ? 'SOLD ✓' : `Buy ($${item.cost})`}
            </button>
          `;
          infraGrid.appendChild(card);
        });
      }
    }
  }

  buyMetaUpgrade(upgKey, cost) {
    if (this.urbanGrants >= cost) {
      this.urbanGrants -= cost;
      this.metaUpgrades[upgKey] = (this.metaUpgrades[upgKey] || 0) + 1;
      this.sound.playDraftSelect();
      NotificationSystem.show("Permanent City License Unlocked!", "success");
      this.updateUI();
      this.saveGame();
    } else {
      NotificationSystem.show(`Requires ${cost} Urban Planning Grants!`, "danger");
    }
  }

  toggleAudio() {
    this.sound.muted = !this.sound.muted;
    const btn = document.getElementById("soundToggleBtn");
    if (btn) {
      btn.innerText = this.sound.muted ? "🔇 Muted" : "🔊 Sound";
      btn.className = this.sound.muted ? "button is-small is-danger" : "button is-small is-dark";
    }
  }

  checkAchievements() {
    ACHIEVEMENTS_DEF.forEach((ach) => {
      if (!this.unlockedAchievements[ach.id] && ach.req(this)) {
        this.unlockedAchievements[ach.id] = true;
        NotificationSystem.show(`🏆 Achievement: ${ach.title}!`, "success");
        this.sound.playDraftSelect();
        this.updateUIAchievements();
      }
    });
  }

  bindUIEvents() {
    const tabNavs = document.querySelectorAll(".game-tab-nav");
    tabNavs.forEach((nav) => {
      nav.addEventListener("click", () => {
        tabNavs.forEach(n => n.classList.remove("is-active"));
        const targetTabId = nav.dataset.tab;
        nav.classList.add("is-active");

        document.querySelectorAll(".game-tab-content").forEach((c) => {
          c.style.display = c.id === targetTabId ? "block" : "none";
        });
      });
    });
  }

  openBureauTab() {
    document.getElementById("gameOverModal").classList.remove("is-active");
    const bureauTabNav = document.querySelector('[data-tab="tab-bureau"]');
    if (bureauTabNav) bureauTabNav.click();
  }

  updateUI() {
    this.updateUIHeader();
    this.updateUITrafficLaws();
    this.updateUILanes();
    this.updateUIGantrySpeed();
    this.updateUIBillboards();
    this.updateUIMetaBureau();
    this.updateUIAchievements();
    this.updateCommuterHUD();
  }

  updateUIHeader() {
    const bankEl = document.getElementById("bankDisplay");
    const anteEl = document.getElementById("anteDisplay");
    const grantsEl = document.getElementById("grantsDisplay");
    const subtextEl = document.getElementById("stageSubtext");
    const adRateEl = document.getElementById("adRateDisplay");
    const patternEl = document.getElementById("patternDisplay");
    const speedBtn = document.getElementById("speedToggleBtn");

    if (bankEl) bankEl.innerText = `$${Formatter.formatNumber(this.bank)}`;
    if (anteEl) anteEl.innerText = `${this.currentAnte} / 8`;
    if (grantsEl) grantsEl.innerText = `${Formatter.formatNumber(this.urbanGrants)} 🏛️`;
    if (adRateEl) adRateEl.innerText = `+$${Formatter.formatNumber(this.getAdIncomePerCar())}/car`;
    if (patternEl) patternEl.innerText = this.getTrafficPatternName();

    if (speedBtn) {
      speedBtn.innerText = `⏩ ${this.gameSpeed}x Speed`;
      speedBtn.className = this.gameSpeed > 1 ? "button is-small is-warning has-text-weight-bold" : "button is-small is-dark";
    }

    const b1 = document.getElementById("badgeStage1");
    const b2 = document.getElementById("badgeStage2");
    const b3 = document.getElementById("badgeStage3");

    if (b1 && b2 && b3) {
      b1.className = `stage-badge ${this.stageInAnte === 0 ? "active" : (this.stageInAnte > 0 ? "cleared" : "")}`;
      b2.className = `stage-badge ${this.stageInAnte === 1 ? "active" : (this.stageInAnte > 1 ? "cleared" : "")}`;
      b3.className = `stage-badge boss-badge ${this.stageInAnte === 2 ? "active" : ""}`;
      b3.innerText = this.stageInAnte === 2 && this.currentBossBlind ? `3. ⚠️ Boss: ${this.currentBossBlind.name}` : "3. ⚠️ Boss Commute";
    }

    if (subtextEl) {
      if (this.gameState === "COMMUTE") {
        subtextEl.innerText = `24-Hour Cycle Live • Target: ${this.commutersServedThisRound}/${this.targetCommutersInStage} Commuters`;
      } else {
        subtextEl.innerText = `Morning Planning: Stage ${this.stageInAnte + 1}/3 • Target: ${this.targetCommutersInStage} Commuters by Midnight`;
      }
    }

    const planBox = document.getElementById("planningActionContent");
    const rushBox = document.getElementById("rushActionContent");
    if (planBox && rushBox) {
      planBox.style.display = this.gameState === "PLANNING" ? "block" : "none";
      rushBox.style.display = this.gameState === "COMMUTE" ? "block" : "none";
    }

    const liveControlPanel = document.getElementById("liveTrafficControlPanel");
    const planControlPanel = document.getElementById("planningControlPanel");
    if (liveControlPanel && planControlPanel) {
      liveControlPanel.style.display = this.gameState === "COMMUTE" ? "block" : "none";
      planControlPanel.style.display = this.gameState === "PLANNING" ? "block" : "none";
    }

    const forecastTitle = document.getElementById("forecastTitle");
    const forecastDesc = document.getElementById("forecastDesc");
    if (forecastTitle && forecastDesc) {
      const stageName = this.stageInAnte === 0 ? "Small Commute" : (this.stageInAnte === 1 ? "Big Commute" : `Boss Commute: ${this.currentBossBlind ? this.currentBossBlind.name : ""}`);
      forecastTitle.innerText = `Stage Target: Ante ${this.currentAnte} • ${stageName}`;
      forecastDesc.innerText = `Target: ${this.targetCommutersInStage} Commuters by 12:00 Midnight • Weather: ${this.modifiers.weather === "rain" ? "Flash Monsoon 🌧️" : "Clear Skies ☀️"}`;
    }

    const bossHud = document.getElementById("bossHudPill");
    const bossNameDisp = document.getElementById("bossNameDisplay");
    if (bossHud && bossNameDisp) {
      if (this.currentBossBlind && this.stageInAnte === 2) {
        bossHud.style.display = "flex";
        bossNameDisp.innerText = `⚠️ BOSS: ${this.currentBossBlind.name} (${this.currentBossBlind.desc})`;
      } else {
        bossHud.style.display = "none";
      }
    }

    const adHudPill = document.getElementById("adHudPill");
    const adIncomeHud = document.getElementById("adIncomeHud");
    if (adHudPill && adIncomeHud) {
      adIncomeHud.innerText = `$${Formatter.formatNumber(this.roundAdRevenue)} Ad Rev`;
    }

    const surgeBtn = document.getElementById("rushHourBtn");
    if (surgeBtn) {
      if (this.surgeActive) {
        surgeBtn.innerText = `🔥 SURGE ACTIVE (${Math.ceil(this.surgeTimer)}s)`;
        surgeBtn.className = "button is-rush-hour is-active-skill is-fullwidth";
      } else if (this.surgeCooldown > 0) {
        surgeBtn.innerText = `⏱️ Surge Cooldown (${Math.ceil(this.surgeCooldown)}s)`;
        surgeBtn.className = "button is-dark is-fullwidth";
      } else {
        surgeBtn.innerText = "⚡ RUSH HOUR SURGE (1.5x Flow)";
        surgeBtn.className = "button is-rush-hour is-fullwidth";
      }
    }
  }

  updateUITrafficLaws() {
    const container = document.getElementById("lawsList");
    const countEl = document.getElementById("lawCount");
    if (!container) return;

    if (countEl) countEl.innerText = this.activeTrafficLaws.length;

    if (this.activeTrafficLaws.length === 0) {
      container.innerHTML = `<div class="is-size-7 text-muted" style="padding-top: 18px;">No Traffic Laws enacted yet. Pass an ordinance before each commute!</div>`;
      return;
    }

    container.innerHTML = "";
    this.activeTrafficLaws.forEach((law) => {
      const badge = document.createElement("div");
      badge.className = `law-badge ${law.rarity}`;
      badge.title = law.desc;
      badge.innerHTML = `
        <div class="law-title">${law.icon} ${law.name}</div>
        <div class="law-desc">${law.desc}</div>
      `;
      container.appendChild(badge);
    });
  }

  updateUIGantrySpeed() {
    const curTier = TOLL_SPEED_TIERS[Math.min(TOLL_SPEED_TIERS.length - 1, this.autoTollSpeedLevel - 1)];
    const nextTier = TOLL_SPEED_TIERS[this.autoTollSpeedLevel];

    const titleEl = document.getElementById("gantryTierTitle");
    const descEl = document.getElementById("gantryTierDesc");
    const delayTag = document.getElementById("gantryDelayTag");
    const nextText = document.getElementById("gantryNextTierText");
    const liveGantryTier = document.getElementById("liveGantryTierDisplay");

    if (titleEl) titleEl.innerText = `Toll Gantry Speed: Level ${this.autoTollSpeedLevel} (${curTier.name})`;
    if (descEl) descEl.innerText = curTier.desc;
    if (delayTag) delayTag.innerText = `${curTier.delay}s Gate Delay`;

    if (liveGantryTier) {
      liveGantryTier.innerText = `⚡ ${curTier.name} (${curTier.delay}s)`;
    }

    if (nextText) {
      if (nextTier) {
        nextText.innerText = `Next: ${nextTier.name} (${nextTier.delay}s delay)`;
      } else {
        nextText.innerText = "⭐ Max Quantum Speed Reached (0.0s Fly-Through)!";
      }
    }
  }

  updateUIBillboards() {
    const totalTag = document.getElementById("totalBillboardTag");
    const countDisp = document.getElementById("billboardCountDisplay");
    const maxDisp = document.getElementById("billboardMaxDisplay");
    const perCarDisp = document.getElementById("billboardIncomePerCarDisplay");

    if (totalTag) totalTag.innerText = `${this.billboards} Billboards Active`;
    if (countDisp) countDisp.innerText = this.billboards;
    if (maxDisp) maxDisp.innerText = this.maxBillboards;
    if (perCarDisp) perCarDisp.innerText = `$${this.getAdIncomePerCar()}`;

    const contractsContainer = document.getElementById("adContractsList");
    if (!contractsContainer) return;

    contractsContainer.innerHTML = "";
    AD_CONTRACTS.forEach((contract) => {
      const isSigned = !!this.adContracts[contract.id];
      const card = document.createElement("div");
      card.className = "shop-card ad-contract";
      card.innerHTML = `
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-1">
          <div>
            <span class="is-size-4 mr-2">${contract.icon}</span>
            <strong class="is-size-6 text-white">${contract.name}</strong>
          </div>
          ${isSigned ? '<span class="tag is-success">✓ Active Contract</span>' : `<span class="tag is-dark is-small text-muted">🛒 In Shop ($${contract.cost})</span>`}
        </div>
        <p class="is-size-7 text-muted">${contract.desc}</p>
      `;
      contractsContainer.appendChild(card);
    });
  }

  updateUILanes() {
    const container = document.getElementById("lanesList");
    if (!container) return;

    const newLaneCostEl = document.getElementById("newLaneCostDisplay");
    if (newLaneCostEl) newLaneCostEl.innerText = Formatter.formatNumber(this.highway.getBaseNewLaneCost());

    container.innerHTML = "";
    this.highway.lanes.forEach((lane) => {
      const tollVal = lane.getTollValue(this.getGlobalMultiplier());
      const typeDef = LANE_TYPES[lane.laneType] || LANE_TYPES.standard;
      const isDebuffed = this.highway.isLaneDebuffed(lane);
      const isAutobahn = lane.laneType === "autobahn";

      const card = document.createElement("div");
      card.className = `lane-card lane-type-${lane.laneType} ${isDebuffed ? "is-debuffed" : ""} ${lane.hasBreakdown ? "breakdown" : ""}`;
      card.innerHTML = `
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-1">
          <div>
            <span class="title is-6 text-white mb-0">Lane #${lane.id}</span>
            <span class="tag ${typeDef.tagClass} ml-2">${typeDef.icon} ${typeDef.name}</span>
            ${isDebuffed ? '<span class="tag is-debuffed-tag ml-1">🚫 DEBUFFED BY BOSS</span>' : ''}
          </div>
          <span class="tag ${isDebuffed ? 'is-danger' : (isAutobahn ? 'is-info' : 'is-success')}">
            ${isDebuffed ? '$0 (Debuffed)' : (isAutobahn ? 'FREE Throughput ($0)' : `+$${Formatter.formatNumber(tollVal)} / car`)}
          </span>
        </div>

        <p class="is-size-7 text-muted mb-2">${isDebuffed ? `⚠️ WARNING: Boss Blind debuffs this lane type! Speed & tolls heavily penalized!` : typeDef.desc}</p>

        <div class="is-flex is-justify-content-space-between is-align-items-center">
          <span class="tag is-info is-light">⚡ Auto-Toll Active (Speed Lvl ${this.autoTollSpeedLevel})</span>
          <span class="is-size-7 text-muted">Permanent Specialization</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  updateLiveControlStatus() {
    const container = document.getElementById("liveLaneStatusList");
    if (!container) return;

    container.innerHTML = "";
    this.highway.lanes.forEach((lane, idx) => {
      const typeDef = LANE_TYPES[lane.laneType] || LANE_TYPES.standard;
      const isDebuffed = this.highway.isLaneDebuffed(lane);
      const isAutobahn = lane.laneType === "autobahn";
      const waitingCount = this.renderer.vehicles.filter(v => (v.isChangingLane ? v.targetLaneIndex : v.laneIndex) === idx && v.isWaitingAtToll).length;

      const row = document.createElement("div");
      row.className = "summary-stat-row";
      row.innerHTML = `
        <span class="text-white">
          <strong class="tag ${typeDef.tagClass} is-small mr-1">#${lane.id}</strong> ${typeDef.name}
          ${isDebuffed ? '<strong class="tag is-debuffed-tag is-small ml-1">🚫 DEBUFFED</strong>' : ''}
        </span>
        <span>
          ${isDebuffed ? '<span class="tag is-danger is-small">$0 Tolls</span>' : (isAutobahn ? '<span class="tag is-cyan is-small">FREE Flow 🏎️</span>' : (waitingCount > 0 ? `<span class="tag is-warning is-small">Scanning Auto-Toll (${waitingCount} in queue)</span>` : '<span class="tag is-success is-small">Flowing ⚡</span>'))}
        </span>
      `;
      container.appendChild(row);
    });
  }

  updateUIMetaBureau() {
    const container = document.getElementById("metaUpgradesList");
    const grantsDisp = document.getElementById("bureauGrantsDisplay");
    if (!container) return;

    if (grantsDisp) grantsDisp.innerText = `${this.urbanGrants} Grants Available`;

    const META_UPGRADES_DEF = [
      { key: "starting_capital", name: "Initial Seed Capital", desc: "+$30 Starting Budget per level on every new run.", cost: 1 },
      { key: "starter_lane", name: "Pre-Paved Asphalt", desc: "Start new runs with 2 Highway Lanes unlocked.", cost: 2 },
      { key: "starter_auto_speed", name: "High-Speed Transponder License", desc: "Start new runs with +1 Auto-Toll Gantry Speed Level.", cost: 3 },
      { key: "starter_billboard", name: "Municipal Advertising Permit", desc: "Start new runs with 1 active Roadside Billboard.", cost: 2 },
      { key: "radar_precision", name: "Surveillance Precision", desc: "+$5 bonus fine revenue per level from ticketed speeders.", cost: 2 },
      { key: "law_pocket", name: "Legislative Expansion Binder", desc: "+1 Max Active Traffic Law capacity.", cost: 4 }
    ];

    container.innerHTML = "";
    META_UPGRADES_DEF.forEach((meta) => {
      const currentLevel = this.metaUpgrades[meta.key] || 0;
      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-1">
          <strong class="is-size-6 text-white">${meta.name}</strong>
          <span class="tag is-purple">Lvl ${currentLevel}</span>
        </div>
        <p class="is-size-7 text-muted mb-2">${meta.desc}</p>
        <button class="button is-small is-purple" onclick="game.buyMetaUpgrade('${meta.key}', ${meta.cost})">
          Unlock Permanent License (${meta.cost} 🏛️ Grants)
        </button>
      `;
      container.appendChild(card);
    });
  }

  updateUIAchievements() {
    const container = document.getElementById("achievementsList");
    if (!container) return;

    container.innerHTML = "";
    ACHIEVEMENTS_DEF.forEach((ach) => {
      const isUnlocked = !!this.unlockedAchievements[ach.id];
      const card = document.createElement("div");
      card.className = "shop-card";
      card.style.opacity = isUnlocked ? "1.0" : "0.45";
      card.innerHTML = `
        <div class="is-flex is-align-items-center">
          <span class="is-size-4 mr-3">${isUnlocked ? "🏆" : "🔒"}</span>
          <div>
            <strong class="text-white is-size-7">${ach.title}</strong>
            <p class="is-size-7 text-muted" style="font-size: 0.7rem;">${ach.desc}</p>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    const runsEl = document.getElementById("statRunsDisplay");
    const bestAnteEl = document.getElementById("statBestAnteDisplay");
    const commutersEl = document.getElementById("statCommutersDisplay");
    const adRevEl = document.getElementById("statAdRevDisplay");
    const wildlifeEl = document.getElementById("statWildlifeDisplay");
    const sleepyEl = document.getElementById("statSleepyDisplay");
    const ragersEl = document.getElementById("statRagersDisplay");
    const speedersEl = document.getElementById("statSpeedersDisplay");
    const revEl = document.getElementById("statRevenueDisplay");

    if (runsEl) runsEl.innerText = this.stats.totalRuns;
    if (bestAnteEl) bestAnteEl.innerText = `Ante ${this.stats.bestAnte}`;
    if (commutersEl) commutersEl.innerText = this.stats.carsServed;
    if (adRevEl) adRevEl.innerText = `$${Formatter.formatNumber(this.stats.totalAdRevenue)}`;
    if (wildlifeEl) wildlifeEl.innerText = this.stats.wildlifeHandled;
    if (sleepyEl) sleepyEl.innerText = this.stats.sleepyWoken;
    if (ragersEl) ragersEl.innerText = this.stats.ragersHandled;
    if (speedersEl) speedersEl.innerText = this.stats.speedersCaught;
    if (revEl) revEl.innerText = `$${Formatter.formatNumber(this.stats.totalRevenue)}`;
  }

  updateCommuterHUD() {
    const clockEl = document.getElementById("clockDisplay");
    const commutersEl = document.getElementById("commutersHud");
    const bar = document.getElementById("targetProgressBar");
    const statusBadge = document.getElementById("targetStatusBadge");
    const remainingDisp = document.getElementById("quotaRemainingDisplay");
    const patternEl = document.getElementById("patternDisplay");

    if (clockEl) {
      clockEl.innerText = Formatter.formatTimeOfDay(this.commuteProgress);
    }
    if (patternEl) {
      patternEl.innerText = this.getTrafficPatternName();
    }
    if (commutersEl) {
      commutersEl.innerText = `${this.commutersServedThisRound} / ${this.targetCommutersInStage} Commuters`;
    }

    if (bar && statusBadge && remainingDisp) {
      const pct = Math.min(100, Math.round((this.commutersServedThisRound / this.targetCommutersInStage) * 100));
      bar.style.width = `${pct}%`;

      const isQuotaMet = this.commutersServedThisRound >= this.targetCommutersInStage;
      if (isQuotaMet) {
        bar.classList.add("quota-met");
        statusBadge.className = "tag is-success has-text-weight-bold";
        const extra = this.commutersServedThisRound - this.targetCommutersInStage;
        statusBadge.innerText = `TARGET MET! 🎯 (${this.commutersServedThisRound} / ${this.targetCommutersInStage} • +${extra} Overtime)`;
        remainingDisp.className = "is-size-7 has-text-weight-bold text-success";
        remainingDisp.innerText = "✓ Target satisfied! Surplus commuters generate bonus income!";
      } else {
        bar.classList.remove("quota-met");
        statusBadge.className = "tag is-warning has-text-weight-bold";
        statusBadge.innerText = `Target: ${this.commutersServedThisRound} / ${this.targetCommutersInStage} Commuters`;
        const diff = this.targetCommutersInStage - this.commutersServedThisRound;
        remainingDisp.className = "is-size-7 has-text-weight-bold text-cyan";
        remainingDisp.innerText = `${diff} more commuter${diff > 1 ? "s" : ""} required by Midnight`;
      }
    }
  }

  updateRageHUD(ragingCount) {
    const rageHud = document.getElementById("rageHudPill");
    const rageCountDisp = document.getElementById("rageCountDisplay");
    if (rageHud && rageCountDisp) {
      if (ragingCount > 0) {
        rageHud.style.display = "flex";
        rageCountDisp.innerText = `${ragingCount} Driver${ragingCount > 1 ? "s" : ""} Raging!`;
      } else {
        rageHud.style.display = "none";
      }
    }
  }

  saveGame() {
    const data = {
      bank: this.bank,
      lifetimeBank: this.lifetimeBank,
      urbanGrants: this.urbanGrants,
      currentAnte: this.currentAnte,
      stageInAnte: this.stageInAnte,
      autoTollSpeedLevel: this.autoTollSpeedLevel,
      billboards: this.billboards,
      adContracts: this.adContracts,
      stats: this.stats,
      metaUpgrades: this.metaUpgrades,
      unlockedAchievements: this.unlockedAchievements,
      activeTrafficLaws: this.activeTrafficLaws.map(l => l.id),
      selectedSector: this.selectedSector,
      starterDraftCompleted: this.starterDraftCompleted,
      highwayLanes: this.highway.lanes.map(l => ({ id: l.id, laneType: l.laneType, autoToll: l.autoToll }))
    };
    localStorage.setItem("one_more_lane_roguelike_save", JSON.stringify(data));
  }

  loadSave() {
    try {
      const raw = localStorage.getItem("one_more_lane_roguelike_save");
      if (!raw) return;
      const data = JSON.parse(raw);

      this.bank = data.bank || 100;
      this.lifetimeBank = data.lifetimeBank || this.bank;
      this.urbanGrants = data.urbanGrants || 0;
      this.currentAnte = data.currentAnte || 1;
      this.stageInAnte = data.stageInAnte || 0;
      this.autoTollSpeedLevel = data.autoTollSpeedLevel || 1;
      this.billboards = data.billboards || 0;
      this.adContracts = data.adContracts || {};
      this.stats = data.stats || this.stats;
      this.metaUpgrades = data.metaUpgrades || this.metaUpgrades;
      this.unlockedAchievements = data.unlockedAchievements || {};
      this.selectedSector = data.selectedSector || "earth";
      this.starterDraftCompleted = !!data.starterDraftCompleted;

      if (data.highwayLanes && Array.isArray(data.highwayLanes)) {
        this.highway.lanes = data.highwayLanes.map(l => {
          const newL = new Lane(l.id, l.laneType);
          newL.autoToll = true;
          return newL;
        });
      }

      if (data.activeTrafficLaws && Array.isArray(data.activeTrafficLaws)) {
        this.activeTrafficLaws = data.activeTrafficLaws
          .map(id => TRAFFIC_LAWS_CATALOG.find(l => l.id === id))
          .filter(Boolean);
      }
    } catch (e) {
      console.error("Save load error:", e);
    }
  }

  hardReset() {
    if (confirm("Are you sure you want to reset all game and career progress?")) {
      localStorage.removeItem("one_more_lane_roguelike_save");
      window.location.reload();
    }
  }

  exportSave() {
    const raw = localStorage.getItem("one_more_lane_roguelike_save") || "";
    navigator.clipboard.writeText(raw);
    NotificationSystem.show("Career save copied to clipboard!", "success");
  }

  importSave() {
    const input = prompt("Paste your export code below:");
    if (input) {
      try {
        JSON.parse(input);
        localStorage.setItem("one_more_lane_roguelike_save", input);
        window.location.reload();
      } catch (e) {
        NotificationSystem.show("Invalid save code format!", "danger");
      }
    }
  }

  gameLoop(timestamp) {
    const now = Date.now();
    const rawDelta = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    const delta = rawDelta * this.gameSpeed;

    if (this.surgeActive) {
      this.surgeTimer -= delta;
      if (this.surgeTimer <= 0) {
        this.surgeActive = false;
        NotificationSystem.show("Rush Hour Surge ended.", "info");
      }
      this.updateUIHeader();
    } else if (this.surgeCooldown > 0) {
      this.surgeCooldown -= delta;
      this.updateUIHeader();
    }

    if (this.gameState === "COMMUTE") {
      this.commuteProgress = Math.min(1.0, this.commuteProgress + delta / this.commuteDurationSec);
      this.updateCommuterHUD();

      if (this.commuteProgress >= 1.0) {
        this.evaluateDayEnd();
      }
    }

    if (this.renderer) {
      this.renderer.render(this.highway, delta);
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

let game;

function pageSetup() {
  game = new RoguelikeEngine();
  game.init();
}
