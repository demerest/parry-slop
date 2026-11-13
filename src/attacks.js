"use strict";

window.PS = window.PS || {};

// Attack schema:
// id, kind (draw style), label/labelPool, color, category, telegraph (ms),
// window (ms), weight, weird, minAct, behavior (standard|delayed|lobbed|wobble|fake),
// hits + hitGap for multi-hit, rare, fake, parryPool/missPool for attack-specific jokes.
PS.ATTACKS = [
  // --- normal: teach the mechanic ---
  { id: "sword", kind: "blade", label: "SWORD", color: "#ff5252", category: "normal", telegraph: 1100, window: 190, weight: 3, minAct: 1 },
  { id: "arrow", kind: "arrow", label: "ARROW", color: "#ffd24d", category: "normal", telegraph: 950, window: 170, weight: 3, minAct: 1 },
  { id: "bullet", kind: "bullet", label: "BULLET", color: "#59c2ff", category: "normal", telegraph: 760, window: 140, weight: 2, minAct: 1 },
  { id: "fireball", kind: "orb", label: "FIREBALL", color: "#ff9933", category: "normal", telegraph: 900, window: 170, weight: 2, minAct: 1 },
  { id: "axe", kind: "blade", label: "AXE", color: "#ff5252", category: "normal", telegraph: 1050, window: 185, weight: 2, minAct: 2 },
  { id: "spear", kind: "blade", label: "SPEAR", color: "#ff5252", category: "normal", telegraph: 1000, window: 175, weight: 2, minAct: 2 },
  { id: "knife", kind: "blade", label: "THROWN KNIFE", color: "#ff8080", category: "normal", telegraph: 700, window: 135, weight: 2, minAct: 2 },
  { id: "triple", kind: "blade", label: "TRIPLE SLASH", color: "#ff5252", category: "normal", telegraph: 1000, window: 180, weight: 1, minAct: 3, hits: 3, hitGap: 400,
    parryPool: ["SLASH ONE", "SLASH TWO", "SLASH THREE"] },

  // --- absurd physical ---
  { id: "boomerang", kind: "spin", label: "BOOMERANG", color: "#ffd24d", category: "absurd", telegraph: 1000, window: 180, weight: 1, weird: true, minAct: 2, behavior: "wobble",
    parryPool: ["IT CAME BACK. PARRIED.", "RETURN TO SENDER"] },
  { id: "piano", kind: "crate", label: "FALLING PIANO", color: "#ffd24d", category: "absurd", telegraph: 1250, window: 210, weight: 1, weird: true, minAct: 2, behavior: "lobbed",
    parryPool: ["OUT OF TUNE. OUT OF HERE.", "FORTISSIMO DENIED"] },
  { id: "anvil", kind: "crate", label: "ANVIL", color: "#ffd24d", category: "absurd", telegraph: 1200, window: 200, weight: 1, weird: true, minAct: 2, behavior: "lobbed",
    parryPool: ["CARTOON PHYSICS PARRIED", "HEAVY. NO."] },
  { id: "fish", kind: "crate", label: "WET FISH", color: "#7ddfff", category: "absurd", telegraph: 950, window: 180, weight: 1, weird: true, minAct: 2, behavior: "wobble",
    parryPool: ["SLAPPED AWAY", "SMELLY PARRY"] },
  { id: "microwave", kind: "crate", label: "MICROWAVE", color: "#ffd24d", category: "absurd", telegraph: 1150, window: 200, weight: 1, weird: true, minAct: 2,
    parryPool: ["BEEP. PARRIED.", "LEFTOVERS DENIED"] },
  { id: "grenade", kind: "orb", label: "GRENADE", color: "#ff9933", category: "absurd", telegraph: 1150, window: 190, weight: 1, weird: true, minAct: 2, behavior: "lobbed",
    parryPool: ["PIN REINSERTED", "EXPLOSION CANCELLED"] },

  // --- ranged ---
  { id: "laser", kind: "bullet", label: "LASER", color: "#ffd24d", category: "ranged", telegraph: 620, window: 120, weight: 2, minAct: 2 },
  { id: "sniper", kind: "bullet", label: "SNIPER SHOT", color: "#ff5252", category: "ranged", telegraph: 1400, window: 110, weight: 1, minAct: 3,
    parryPool: ["SCOPE DENIED", "COUNTER-SNIPED"] },
  { id: "shotgun", kind: "bullet", label: "SHOTGUN SPREAD", color: "#ffd24d", category: "ranged", telegraph: 900, window: 160, weight: 1, minAct: 3, hits: 3, hitGap: 240,
    parryPool: ["PELLET ONE", "PELLET TWO", "PELLET THREE"] },
  { id: "homing", kind: "bullet", label: "HOMING BULLET", color: "#59c2ff", category: "ranged", telegraph: 1100, window: 170, weight: 1, minAct: 3, behavior: "homing",
    parryPool: ["GPS DENIED", "IT LOST LOCK"] },
  { id: "paperplane", kind: "arrow", label: "PAPER AIRPLANE", color: "#f5f5f5", category: "ranged", telegraph: 1000, window: 180, weight: 1, minAct: 2, behavior: "wobble" },
  { id: "email", kind: "card", label: "ANGRY EMAIL", color: "#ff9933", category: "ranged", telegraph: 1150, window: 210, weight: 1, weird: true, minAct: 2,
    labelPool: ["ANGRY EMAIL", "RE: RE: RE: URGENT", "PER MY LAST EMAIL"],
    parryPool: ["MARKED AS SPAM", "UNSUBSCRIBED", "REPLY ALL DENIED"] },

  // --- emotional ---
  { id: "insult", kind: "bubble", label: "INSULT", color: "#ff66d9", category: "emotional", telegraph: 1200, window: 220, weight: 2, weird: true, minAct: 1,
    labelPool: ["YOUR GAME IS MID", "PARRY IS OVERRATED", "THIS IS A PHASE", "SKILL ISSUE", "NOBODY ASKED"],
    parryPool: ["NO U", "BLOCKED EMOTIONALLY", "WORDS PARRIED"] },
  { id: "rejection", kind: "bubble", label: "REJECTION", color: "#ff66d9", category: "emotional", telegraph: 1200, window: 220, weight: 1, weird: true, minAct: 2,
    labelPool: ["IT'S NOT YOU, IT'S ME", "LET'S JUST BE FRIENDS", "NEW PHONE WHO DIS"],
    parryPool: ["REJECTION REJECTED", "SELF-ESTEEM PARRIED"] },
  { id: "talk", kind: "bubble", label: "WE NEED TO TALK", color: "#ff66d9", category: "emotional", telegraph: 1300, window: 230, weight: 1, weird: true, minAct: 2,
    parryPool: ["CONVERSATION DEFLECTED", "NOT TODAY, CHAT"] },
  { id: "regret", kind: "word", label: "REGRET", color: "#ff66d9", category: "emotional", telegraph: 1250, window: 220, weight: 1, weird: true, minAct: 3,
    parryPool: ["NO REGRETS. NONE.", "PARRIED THE PAST"] },
  { id: "dread", kind: "word", label: "EXISTENTIAL DREAD", color: "#ff66d9", category: "emotional", telegraph: 1350, window: 230, weight: 1, weird: true, minAct: 3,
    parryPool: ["MEANING RESTORED", "DREAD DEFLECTED"] },
  { id: "silence", kind: "word", label: "AWKWARD SILENCE", color: "#ff66d9", category: "emotional", telegraph: 1400, window: 240, weight: 1, weird: true, minAct: 3,
    parryPool: ["SILENCE BROKEN", "COMFORTABLE NOW"] },

  // --- internet ---
  { id: "popup", kind: "card", label: "POP-UP", color: "#7dff7d", category: "internet", telegraph: 1300, window: 230, weight: 2, weird: true, minAct: 2,
    labelPool: ["COOKIE PREFERENCES", "ACCEPT ALL", "FREE PARRY SKIN", "UPDATE REQUIRED", "ARE YOU HUMAN?"],
    parryPool: ["POP-UP PARRIED", "AD BLOCKED", "UNSUBSCRIBED"] },
  { id: "cookie", kind: "card", label: "COOKIE BANNER", color: "#7dff7d", category: "internet", telegraph: 1350, window: 240, weight: 1, weird: true, minAct: 3,
    labelPool: ["WE VALUE YOUR PRIVACY", "ACCEPT ALL COOKIES", "MANAGE PREFERENCES"],
    parryPool: ["CONSENT DENIED", "COOKIES PARRIED"] },
  { id: "fakeclose", kind: "widget", label: "FAKE CLOSE BUTTON", color: "#7dff7d", category: "internet", telegraph: 1200, window: 220, weight: 1, weird: true, minAct: 3,
    labelPool: ["[X] CLOSE", "DOWNLOAD NOW", "CLAIM YOUR PRIZE"],
    parryPool: ["THE REAL CLOSE", "TRAP PARRIED"] },
  { id: "notifications", kind: "card", label: "NOTIFICATION SPAM", color: "#7dff7d", category: "internet", telegraph: 1100, window: 200, weight: 1, weird: true, minAct: 3, hits: 4, hitGap: 360,
    parryPool: ["MUTED", "MUTED", "MUTED", "DO NOT DISTURB"] },
  { id: "sponsored", kind: "card", label: "SPONSORED POST", color: "#7dff7d", category: "internet", telegraph: 1250, window: 220, weight: 1, weird: true, minAct: 3,
    labelPool: ["SPONSORED", "PROMOTED", "YOU MAY ALSO LIKE"],
    parryPool: ["SCROLLED PAST", "NOT INTERESTED"] },
  { id: "comments", kind: "bubble", label: "COMMENT SECTION", color: "#7dff7d", category: "internet", telegraph: 1300, window: 230, weight: 1, weird: true, minAct: 3,
    labelPool: ["FIRST!", "ACTUALLY...", "RATIO", "SOURCE?", "WHO ASKED"],
    parryPool: ["COMMENTS DISABLED", "RATIO REVERSED"] },

  // --- adult responsibility ---
  { id: "tax", kind: "card", label: "TAX AUDIT", color: "#a3ff6b", category: "responsibility", telegraph: 1300, window: 240, weight: 1, weird: true, minAct: 2,
    labelPool: ["TAX AUDIT", "IRS NOTICE", "FINAL NOTICE"],
    parryPool: ["AUDIT DEFLECTED", "NOT TODAY", "FINANCIALLY PARRIED"],
    missPool: ["FINANCIALLY HIT"] },
  { id: "rent", kind: "card", label: "RENT", color: "#a3ff6b", category: "responsibility", telegraph: 1250, window: 230, weight: 1, weird: true, minAct: 2,
    parryPool: ["DUE DATE DENIED", "LANDLORD PARRIED"],
    missPool: ["SECURITY DEPOSIT GONE"] },
  { id: "invoice", kind: "card", label: "INVOICE", color: "#a3ff6b", category: "responsibility", telegraph: 1250, window: 230, weight: 1, weird: true, minAct: 3,
    parryPool: ["NET 30? NET NEVER.", "PAID IN PARRIES"] },
  { id: "jury", kind: "card", label: "JURY DUTY", color: "#a3ff6b", category: "responsibility", telegraph: 1350, window: 240, weight: 1, weird: true, minAct: 3,
    parryPool: ["DISMISSED", "OBJECTION SUSTAINED"] },
  { id: "parking", kind: "card", label: "PARKING TICKET", color: "#a3ff6b", category: "responsibility", telegraph: 1200, window: 220, weight: 1, weird: true, minAct: 3,
    parryPool: ["TICKET PARRIED", "APPEAL: PARRY"] },
  { id: "loan", kind: "word", label: "STUDENT LOAN", color: "#a3ff6b", category: "responsibility", telegraph: 1400, window: 240, weight: 1, weird: true, minAct: 3,
    parryPool: ["INTEREST PARRIED", "DEBT DEFLECTED"],
    missPool: ["COMPOUNDING INTEREST"] },

  // --- meta: the interface is hostile ---
  { id: "healthbar", kind: "widget", label: "HEALTH BAR", color: "#f5f5f5", category: "meta", telegraph: 1400, window: 250, weight: 1, weird: true, minAct: 3,
    parryPool: ["HP IS A CONSTRUCT", "BAR PARRIED"] },
  { id: "combocounter", kind: "widget", label: "COMBO COUNTER", color: "#f5f5f5", category: "meta", telegraph: 1350, window: 240, weight: 1, weird: true, minAct: 4,
    parryPool: ["COUNTED. THEN PARRIED.", "NUMBERS DENIED"] },
  { id: "pausebtn", kind: "widget", label: "PAUSE BUTTON", color: "#f5f5f5", category: "meta", telegraph: 1350, window: 240, weight: 1, weird: true, minAct: 4,
    parryPool: ["CANNOT PAUSE THE PARRY", "RESUME DENIED"] },
  { id: "settingsmenu", kind: "widget", label: "SETTINGS MENU", color: "#f5f5f5", category: "meta", telegraph: 1400, window: 250, weight: 1, weird: true, minAct: 4,
    parryPool: ["OPTIONS PARRIED", "CONFIG DENIED"] },
  { id: "tutorial", kind: "widget", label: "TUTORIAL TEXT", color: "#f5f5f5", category: "meta", telegraph: 1400, window: 250, weight: 1, weird: true, minAct: 4,
    labelPool: ["PRESS PARRY TO PARRY", "TIP: PARRY", "TUTORIAL: SKIP?"],
    parryPool: ["TUTORIAL COMPLETED", "LEARNED. THEN PARRIED."] },
  { id: "loading", kind: "widget", label: "LOADING SCREEN", color: "#f5f5f5", category: "meta", telegraph: 1450, window: 250, weight: 1, weird: true, minAct: 4,
    labelPool: ["LOADING... 99%", "PLEASE WAIT", "BUFFERING"],
    parryPool: ["LOADED. PARRIED.", "SKIPPED"] },
  { id: "error", kind: "card", label: "ERROR MESSAGE", color: "#f5f5f5", category: "meta", telegraph: 1300, window: 230, weight: 1, weird: true, minAct: 4,
    labelPool: ["TASK FAILED SUCCESSFULLY", "ERROR 418: TEAPOT", "UNEXPECTED PARRY"],
    parryPool: ["ERROR HANDLED", "STACK TRACE PARRIED"] },
  { id: "gameovercard", kind: "card", label: "YOU DIED?", color: "#f5f5f5", category: "meta", telegraph: 1300, window: 230, weight: 1, weird: true, minAct: 4,
    parryPool: ["NOT TODAY, SCREEN", "FAKE DEATH PARRIED"] },
  { id: "restartbtn", kind: "widget", label: "RESTART?", color: "#f5f5f5", category: "meta", telegraph: 1250, window: 230, weight: 1, weird: true, minAct: 4,
    parryPool: ["NO RESTART. ONLY PARRY.", "BUTTON PARRIED"] },
  { id: "parryword", kind: "word", label: "PARRY", color: "#ffffff", category: "meta", telegraph: 1200, window: 220, weight: 1, weird: true, minAct: 4, rare: true,
    parryPool: ["YOU PARRIED THE PARRY", "PARRYCEPTION"] },

  // --- conceptual rare ---
  { id: "monday", kind: "word", label: "MONDAY", color: "#ff66d9", category: "concept", telegraph: 1400, window: 240, weight: 1, weird: true, minAct: 3, rare: true,
    parryPool: ["WEEKEND RESTORED", "MONDAY CANCELLED"],
    missPool: ["IT IS MONDAY NOW"] },

  // --- fakes: dashed ring, do not parry ---
  { id: "duck", kind: "critter", label: "DUCK", color: "#ffd24d", category: "fake", telegraph: 1500, window: 260, weight: 1, minAct: 2, fake: true, behavior: "fake" },
  { id: "flower", kind: "critter", label: "FLOWER", color: "#ff66d9", category: "fake", telegraph: 1500, window: 260, weight: 1, minAct: 2, fake: true, behavior: "fake" }
];

PS.ATTACK_BY_ID = {};
for (const def of PS.ATTACKS) PS.ATTACK_BY_ID[def.id] = def;

PS.ACTS = [
  { n: 1, at: 0, name: "ACT I", sub: "NORMAL GAME STUFF", color: "#f5f5f5" },
  { n: 2, at: 25, name: "ACT II", sub: "WHY IS THERE A TAX AUDIT?", color: "#ffd24d" },
  { n: 3, at: 55, name: "ACT III", sub: "THE INTERFACE IS HOSTILE", color: "#7dff7d" },
  { n: 4, at: 90, name: "ACT IV", sub: "PARRY GOD", color: "#ff66d9" }
];

PS.PATTERNS = [
  { minAct: 2, gap: 430, ids: ["sword", "sword", "arrow"] },
  { minAct: 2, gap: 400, ids: ["bullet", "bullet", "insult"] },
  { minAct: 3, gap: 450, ids: ["popup", "popup", "tax"] },
  { minAct: 3, gap: 380, ids: ["arrow", "arrow", "arrow", "fireball"] },
  { minAct: 4, gap: 360, ids: ["sword", "bullet", "insult", "tax", "healthbar"] }
];

PS.BOSSES = [
  {
    name: "THE ALGORITHM",
    taunt: "engagement is mandatory",
    downText: "feed cleared. touch grass.",
    ids: ["sponsored", "cookie", "notifications", "popup", "comments", "sponsored"]
  },
  {
    name: "SIR PARRYALOT",
    taunt: "honorable combat. etc.",
    downText: "honor: parried.",
    ids: ["sword", "axe", "sword", "triple", "axe", "sword"]
  },
  {
    name: "THE UI",
    taunt: "your settings have been revoked",
    downText: "interface restored. mostly.",
    ids: ["healthbar", "combocounter", "pausebtn", "tutorial", "loading", "error"]
  },
  {
    name: "THE PARRY BUTTON",
    taunt: "parry the parry",
    downText: "YOU PARRIED THE PARRY",
    ids: ["parryword", "gameovercard", "parryword", "restartbtn", "parryword"]
  }
];

PS.TEXTS = {
  parry: ["PARRY!", "NICE.", "OKAY.", "CLEAN.", "DENIED.", "NO.", "RETURNED.", "PARRIED.", "GOOD.", "SURE."],
  perfect: ["PERFECT PARRY", "CLEAN PARRY", "CERTIFIED PARRY MOMENT", "FRAME PERFECT", "DISGUSTINGLY CLEAN", "PARRY SUPREME"],
  early: ["TOO EARLY", "CALM DOWN", "NOT YET", "PATIENCE", "EAGER."],
  whiff: ["WHIFF", "NOTHING THERE", "PARRIED AIR", "THE AIR WINS", "SWING AND A MISS"],
  miss: ["YOU FAILED TO PARRY", "UNPARRIED SLOP", "THAT WAS PARRYABLE", "OW.", "TIMING IS A SKILL", "YOU SAW IT COMING"],
  weirdReact: ["WHAT?", "STOP.", "OKAY.", "NO U.", "TOO FAR.", "CERTIFIED SLOP.", "WHY.", "LEGAL?", "ALLOWED."],
  fakeParry: ["THAT WAS A DUCK", "IT WAS A FLOWER", "THAT WAS HARMLESS", "WHY WOULD YOU PARRY THAT", "UNNECESSARY VIOLENCE"],
  fakePass: ["RESTRAINT.", "WISE.", "YOU LET IT LIVE.", "MERCY."],
  death: [
    "You failed to parry the floor.",
    "The attack was legally binding.",
    "You became slop.",
    "The parry button abandoned you.",
    "You thought about parrying too late.",
    "You parried in the wrong timeline.",
    "The pop-up ad got your credit card.",
    "Death: the one thing you cannot parry. Yet.",
    "Your parry was in another castle.",
    "The stickman remains calm. You do not.",
    "Skill issue, respectfully.",
    "You were hit by a concept."
  ],
  milestones: {
    5: "Okay.",
    10: "Pretty good.",
    25: "Stop showing off.",
    50: "Parry criminal.",
    100: "The developers are concerned.",
    200: "This is your identity now."
  }
};

PS.pickAttackDef = function (act) {
  const pool = PS.ATTACKS.filter((def) => def.minAct <= act && !def.rare);
  return PS.weightedPick(pool, (def) => def.weight);
};
