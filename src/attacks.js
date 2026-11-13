"use strict";

window.PS = window.PS || {};

// Attack schema:
// id, kind (draw style), label/labelPool, color, category, telegraph (ms),
// window (ms), weight, weird, minAct, behavior (standard|delayed|lobbed|wobble|fake),
// hits + hitGap for multi-hit, parryPool/missPool for attack-specific jokes.
PS.ATTACKS = [
  {
    id: "sword", kind: "blade", label: "SWORD", color: "#ff5252",
    category: "normal", telegraph: 1100, window: 190, weight: 3, weird: false, minAct: 1
  },
  {
    id: "arrow", kind: "arrow", label: "ARROW", color: "#ffd24d",
    category: "normal", telegraph: 950, window: 170, weight: 3, weird: false, minAct: 1
  },
  {
    id: "bullet", kind: "bullet", label: "BULLET", color: "#59c2ff",
    category: "normal", telegraph: 760, window: 140, weight: 2, weird: false, minAct: 1
  },
  {
    id: "fireball", kind: "orb", label: "FIREBALL", color: "#ff9933",
    category: "normal", telegraph: 900, window: 170, weight: 2, weird: false, minAct: 1
  },
  {
    id: "insult", kind: "bubble", label: "INSULT", color: "#ff66d9",
    category: "emotional", telegraph: 1200, window: 220, weight: 2, weird: true, minAct: 1,
    labelPool: ["YOUR GAME IS MID", "PARRY IS OVERRATED", "THIS IS A PHASE", "SKILL ISSUE", "NOBODY ASKED"],
    parryPool: ["NO U", "BLOCKED EMOTIONALLY", "WORDS PARRIED"]
  },
  {
    id: "popup", kind: "card", label: "POP-UP", color: "#7dff7d",
    category: "internet", telegraph: 1300, window: 230, weight: 2, weird: true, minAct: 1,
    labelPool: ["COOKIE PREFERENCES", "ACCEPT ALL", "FREE PARRY SKIN", "UPDATE REQUIRED", "ARE YOU HUMAN?"],
    parryPool: ["POP-UP PARRIED", "AD BLOCKED", "UNSUBSCRIBED"]
  },
  {
    id: "tax", kind: "card", label: "TAX AUDIT", color: "#a3ff6b",
    category: "responsibility", telegraph: 1300, window: 240, weight: 1, weird: true, minAct: 1,
    labelPool: ["TAX AUDIT", "RENT", "STUDENT LOANS", "JURY DUTY"],
    parryPool: ["AUDIT DEFLECTED", "NOT TODAY", "FINANCIALLY PARRIED"],
    missPool: ["FINANCIALLY HIT"]
  },
  {
    id: "ui", kind: "widget", label: "UI ELEMENT", color: "#f5f5f5",
    category: "meta", telegraph: 1400, window: 250, weight: 1, weird: true, minAct: 1,
    labelPool: ["HEALTH BAR", "COMBO COUNTER", "PAUSE BUTTON", "TUTORIAL"],
    parryPool: ["INTERFACE DENIED", "UI PARRIED", "ACCESS REVOKED"]
  }
];

PS.ATTACK_BY_ID = {};
for (const def of PS.ATTACKS) PS.ATTACK_BY_ID[def.id] = def;

PS.TEXTS = {
  parry: ["PARRY!", "NICE.", "OKAY.", "CLEAN.", "DENIED.", "NO.", "RETURNED.", "PARRIED.", "GOOD.", "SURE."],
  perfect: ["PERFECT PARRY", "CLEAN PARRY", "CERTIFIED PARRY MOMENT", "FRAME PERFECT", "DISGUSTINGLY CLEAN", "PARRY SUPREME"],
  early: ["TOO EARLY", "CALM DOWN", "NOT YET", "PATIENCE", "EAGER."],
  whiff: ["WHIFF", "NOTHING THERE", "PARRIED AIR", "THE AIR WINS", "SWING AND A MISS"],
  miss: ["YOU FAILED TO PARRY", "UNPARRIED SLOP", "THAT WAS PARRYABLE", "OW.", "TIMING IS A SKILL", "YOU SAW IT COMING"],
  weirdReact: ["WHAT?", "STOP.", "OKAY.", "NO U.", "TOO FAR.", "CERTIFIED SLOP.", "WHY.", "LEGAL?", "ALLOWED."],
  fakeParry: ["THAT WAS HARMLESS", "WHY WOULD YOU PARRY THAT", "IT DID NOTHING", "UNNECESSARY VIOLENCE"],
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
  const pool = PS.ATTACKS.filter((def) => def.minAct <= act);
  return PS.weightedPick(pool, (def) => def.weight);
};
