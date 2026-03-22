export const team = {
  name: "Remparts",
  fullName: "Remparts du Québec",
  season: "2025-26",
  record: { w: 32, l: 24, otl: 5, sol: 1 },
  points: 70,
  goalsFor: 207,
  goalsAgainst: 186,
  streak: "1L",
  home: { w: 15, l: 14, otl: 3, sol: 1 },
  away: { w: 17, l: 10, otl: 2, sol: 0 },
};

const photo = id => `https://assets.leaguestat.com/lhjmq/240x240/${id}.jpg`;

export const skaters = [
  // — Full 2025-26 regular season stats (official LHJMQ) —
  { num: 29, name: "Nathan Quinn",           pos: "F", gp: 57, g: 34, a: 39, pts: 73, photo: photo(20188) },
  { num: 26, name: "Maddox Dagenais",        pos: "F", gp: 61, g: 30, a: 32, pts: 62, photo: photo(21279) },
  { num: 88, name: "Cal Uens",               pos: "D", gp: 62, g: 13, a: 36, pts: 49, photo: photo(23949) },
  { num: 25, name: "Nikita Ovcharov",        pos: "F", gp: 62, g: 17, a: 27, pts: 44, photo: photo(23752) },
  { num: 9,  name: "Xavier Lebel",           pos: "F", gp: 61, g: 15, a: 17, pts: 32, photo: photo(20285) },
  { num: 15, name: "Andreas Straka",         pos: "F", gp: 45, g: 10, a: 21, pts: 31, photo: photo(21600) },
  { num: 63, name: "Mavrick Rousseau-Hamel", pos: "F", gp: 56, g: 9,  a: 18, pts: 27, photo: photo(19671) },
  { num: 37, name: "Antoine Dorion",         pos: "F", gp: 40, g: 9,  a: 14, pts: 23, photo: photo(20548) },
  { num: 16, name: "Mathias Loiselle",       pos: "F", gp: 35, g: 8,  a: 15, pts: 23, photo: photo(20471) },
  { num: 6,  name: "Egan Beveridge",         pos: "F", gp: 52, g: 13, a: 9,  pts: 22, photo: photo(20193) },
  { num: 21, name: "Ryan Howard",            pos: "F", gp: 60, g: 9,  a: 11, pts: 20, photo: photo(21300) },
  { num: 91, name: "Alex Desruisseaux",      pos: "F", gp: 59, g: 7,  a: 13, pts: 20, photo: photo(23354) },
  { num: 55, name: "Étienne Desjardins",     pos: "D", gp: 62, g: 3,  a: 16, pts: 19, photo: photo(19561) },
  { num: 24, name: "Charles-Antoine Dubé",   pos: "F", gp: 61, g: 8,  a: 10, pts: 18, photo: photo(21364) },
  { num: 77, name: "Alexandre Taillefer",    pos: "D", gp: 28, g: 2,  a: 15, pts: 17, photo: photo(21392) },
  { num: 14, name: "Freddy Meyer",           pos: "D", gp: 56, g: 2,  a: 15, pts: 17, photo: photo(23607) },
  { num: 27, name: "Charlie Morrison",       pos: "D", gp: 39, g: 3,  a: 9,  pts: 12, photo: photo(21306) },
  { num: 71, name: "Thomas Charbonneau",     pos: "D", gp: 46, g: 2,  a: 9,  pts: 11, photo: photo(23332) },
  { num: 5,  name: "Logan Brennan",          pos: "D", gp: 46, g: 3,  a: 5,  pts: 8,  photo: photo(23842) },
  { num: 86, name: "Nishaan Parmar",         pos: "F", gp: 14, g: 1,  a: 5,  pts: 6,  photo: photo(24112) },
  { num: 19, name: "Joshua Brady",           pos: "D", gp: 22, g: 2,  a: 3,  pts: 5,  photo: photo(24111) },
  { num: 13, name: "Vladimir Karabaev",      pos: "F", gp: 16, g: 1,  a: 3,  pts: 4,  photo: photo(23753) },
];

export const goalies = [
  { num: 33, name: "Patrick Déniger",       pos: "G", gp: 29, min: 1689, ga: 67, saves: 665, shots: 732, gaa: 2.38, svPct: 90.8, photo: photo(21311) },
  { num: 73, name: "Benjamin Lelièvre",     pos: "G", gp: 21, min: 1048, ga: 60, saves: 401, shots: 461, gaa: 3.43, svPct: 87.0, photo: photo(20224) },
  { num: 31, name: "Louis-Antoine Denault", pos: "G", gp: 17, min:  954, ga: 43, saves: 442, shots: 485, gaa: 2.70, svPct: 91.1, photo: photo(20480) },
];

// tz = IANA timezone of the venue (not the viewer's browser)
// America/Toronto  = Eastern (QC, ON)
// America/Halifax  = Atlantic (NS, NB, PEI)
// America/St_Johns = Newfoundland (NL) — UTC-3:30/−2:30
export const schedule = [
  { id: 1,  date: "2026-02-06", time: "19:00", tz: "America/Toronto",  opponent: "Huskies",    home: true,  gf: 3, ga: 1, result: "W"        },
  { id: 2,  date: "2026-02-07", time: "16:00", tz: "America/Toronto",  opponent: "Océanic",    home: true,  gf: 5, ga: 3, result: "W"        },
  { id: 3,  date: "2026-02-13", time: "19:00", tz: "America/Toronto",  opponent: "Océanic",    home: false, gf: 8, ga: 3, result: "W"        },
  { id: 4,  date: "2026-02-15", time: "16:00", tz: "America/Toronto",  opponent: "Voltigeurs", home: false, gf: 2, ga: 3, result: "L"        },
  { id: 5,  date: "2026-02-17", time: "19:00", tz: "America/Toronto",  opponent: "Voltigeurs", home: true,  gf: 2, ga: 4, result: "L"        },
  { id: 6,  date: "2026-02-19", time: "19:00", tz: "America/Toronto",  opponent: "Drakkar",    home: false, gf: 6, ga: 1, result: "W"        },
  { id: 7,  date: "2026-02-20", time: "19:00", tz: "America/Toronto",  opponent: "Drakkar",    home: false, gf: 6, ga: 0, result: "W"        },
  { id: 8,  date: "2026-02-26", time: "19:00", tz: "America/Halifax",  opponent: "Eagles",     home: false, gf: 3, ga: 4, result: "L"        },
  { id: 9,  date: "2026-02-27", time: "19:00", tz: "America/Halifax",  opponent: "Eagles",     home: false, gf: 4, ga: 0, result: "W"        },
  { id: 10, date: "2026-03-01", time: "15:00", tz: "America/Halifax",  opponent: "Mooseheads", home: false, gf: 4, ga: 5, result: "OTL"      },
  { id: 11, date: "2026-03-04", time: "19:00", tz: "America/Toronto",  opponent: "Tigres",     home: true,  gf: 3, ga: 5, result: "L"        },
  { id: 12, date: "2026-03-07", time: "16:00", tz: "America/Toronto",  opponent: "Cataractes", home: true,  gf: 4, ga: 1, result: "W"        },
  { id: 13, date: "2026-03-08", time: "15:00", tz: "America/Toronto",  opponent: "Islanders",  home: true,  gf: 2, ga: 3, result: "OTL"      },
  { id: 14, date: "2026-03-12", time: "19:00", tz: "America/Toronto",  opponent: "Tigres",     home: false, gf: 4, ga: 1, result: "W"        },
  { id: 15, date: "2026-03-13", time: "19:00", tz: "America/Toronto",  opponent: "Olympiques", home: false, gf: 3, ga: 1, result: "W"        },
  { id: 16, date: "2026-03-15", time: "15:00", tz: "America/Toronto",  opponent: "Phoenix",    home: true,  gf: 1, ga: 4, result: "L"        },
  { id: 17, date: "2026-03-20", time: "19:00", tz: "America/Toronto",  opponent: "Saguenéens", home: true,  gf: 0, ga: 1, result: "OTL",
    scratches: [
      { num: 19, reason: 'HS' },   // Brady — Healthy Scratch
      { num: 13, reason: 'IR' },   // Karabaev — Injured
      { num: 73, reason: 'IR' },   // Lelièvre — Injured
      { num: 63, reason: 'SUS' },  // Rousseau-Hamel — Suspended (1/1)
      { num: 77, reason: 'IR' },   // Taillefer — Injured
    ]
  },
  { id: 18, date: "2026-03-21", time: "16:00", tz: "America/Toronto",  opponent: "Saguenéens", home: false, gf: null, ga: null, result: "upcoming" },
];

// Per-game scoring log: { gameId, num (jersey), g, a }
export const gameLog = [
  // Game 1 — Feb 6 vs Huskies 3-1 W
  {gameId:1,num:6,g:0,a:0},{gameId:1,num:9,g:0,a:0},{gameId:1,num:13,g:0,a:1},
  {gameId:1,num:14,g:1,a:0},{gameId:1,num:19,g:0,a:0},{gameId:1,num:21,g:0,a:0},
  {gameId:1,num:24,g:0,a:0},{gameId:1,num:25,g:0,a:1},{gameId:1,num:26,g:1,a:0},
  {gameId:1,num:27,g:0,a:0},{gameId:1,num:29,g:0,a:1},{gameId:1,num:37,g:1,a:0},
  {gameId:1,num:55,g:0,a:0},{gameId:1,num:63,g:0,a:1},{gameId:1,num:71,g:0,a:0},
  {gameId:1,num:86,g:0,a:0},{gameId:1,num:88,g:0,a:2},{gameId:1,num:91,g:0,a:0},
  // Game 2 — Feb 7 vs Océanic 5-3 W
  {gameId:2,num:6,g:1,a:1},{gameId:2,num:9,g:0,a:1},{gameId:2,num:13,g:0,a:0},
  {gameId:2,num:14,g:0,a:0},{gameId:2,num:19,g:0,a:0},{gameId:2,num:21,g:0,a:0},
  {gameId:2,num:24,g:0,a:0},{gameId:2,num:25,g:1,a:2},{gameId:2,num:26,g:0,a:1},
  {gameId:2,num:27,g:0,a:0},{gameId:2,num:29,g:2,a:0},{gameId:2,num:37,g:0,a:1},
  {gameId:2,num:55,g:0,a:1},{gameId:2,num:63,g:1,a:0},{gameId:2,num:71,g:0,a:0},
  {gameId:2,num:86,g:0,a:1},{gameId:2,num:88,g:0,a:1},{gameId:2,num:91,g:0,a:0},
  // Game 3 — Feb 13 @ Océanic 8-3 W
  {gameId:3,num:6,g:1,a:1},{gameId:3,num:9,g:1,a:0},{gameId:3,num:13,g:0,a:1},
  {gameId:3,num:14,g:0,a:1},{gameId:3,num:16,g:0,a:1},{gameId:3,num:19,g:0,a:0},
  {gameId:3,num:21,g:1,a:1},{gameId:3,num:24,g:1,a:0},{gameId:3,num:25,g:0,a:1},
  {gameId:3,num:26,g:1,a:0},{gameId:3,num:27,g:0,a:0},{gameId:3,num:29,g:1,a:2},
  {gameId:3,num:37,g:0,a:0},{gameId:3,num:55,g:0,a:2},{gameId:3,num:63,g:1,a:0},
  {gameId:3,num:71,g:0,a:1},{gameId:3,num:88,g:1,a:1},{gameId:3,num:91,g:0,a:2},
  // Game 4 — Feb 15 @ Voltigeurs 2-3 L
  {gameId:4,num:6,g:1,a:0},{gameId:4,num:9,g:0,a:0},{gameId:4,num:13,g:0,a:0},
  {gameId:4,num:14,g:0,a:0},{gameId:4,num:16,g:0,a:0},{gameId:4,num:19,g:0,a:0},
  {gameId:4,num:21,g:0,a:0},{gameId:4,num:24,g:1,a:0},{gameId:4,num:25,g:0,a:0},
  {gameId:4,num:26,g:0,a:2},{gameId:4,num:27,g:0,a:0},{gameId:4,num:29,g:0,a:1},
  {gameId:4,num:37,g:0,a:0},{gameId:4,num:55,g:0,a:0},{gameId:4,num:63,g:0,a:0},
  {gameId:4,num:71,g:0,a:0},{gameId:4,num:88,g:0,a:1},{gameId:4,num:91,g:0,a:0},
  // Game 5 — Feb 17 vs Voltigeurs 2-4 L
  {gameId:5,num:6,g:0,a:0},{gameId:5,num:9,g:0,a:0},{gameId:5,num:13,g:0,a:0},
  {gameId:5,num:14,g:0,a:0},{gameId:5,num:16,g:0,a:0},{gameId:5,num:19,g:0,a:0},
  {gameId:5,num:21,g:0,a:0},{gameId:5,num:24,g:0,a:0},{gameId:5,num:25,g:0,a:0},
  {gameId:5,num:26,g:0,a:2},{gameId:5,num:27,g:0,a:0},{gameId:5,num:29,g:1,a:1},
  {gameId:5,num:37,g:0,a:0},{gameId:5,num:55,g:0,a:0},{gameId:5,num:63,g:0,a:0},
  {gameId:5,num:71,g:0,a:0},{gameId:5,num:88,g:1,a:1},{gameId:5,num:91,g:0,a:0},
  // Game 6 — Feb 19 @ Drakkar 6-1 W
  {gameId:6,num:6,g:0,a:0},{gameId:6,num:9,g:0,a:1},{gameId:6,num:14,g:0,a:0},
  {gameId:6,num:15,g:1,a:2},{gameId:6,num:16,g:1,a:1},{gameId:6,num:19,g:0,a:0},
  {gameId:6,num:21,g:0,a:0},{gameId:6,num:24,g:0,a:0},{gameId:6,num:25,g:1,a:1},
  {gameId:6,num:26,g:0,a:0},{gameId:6,num:27,g:1,a:1},{gameId:6,num:29,g:0,a:0},
  {gameId:6,num:37,g:1,a:0},{gameId:6,num:55,g:0,a:0},{gameId:6,num:63,g:1,a:2},
  {gameId:6,num:71,g:0,a:1},{gameId:6,num:88,g:0,a:1},{gameId:6,num:91,g:0,a:0},
  // Game 7 — Feb 20 @ Drakkar 6-0 W
  {gameId:7,num:9,g:0,a:0},{gameId:7,num:13,g:0,a:1},{gameId:7,num:14,g:0,a:2},
  {gameId:7,num:15,g:0,a:1},{gameId:7,num:16,g:0,a:0},{gameId:7,num:19,g:1,a:0},
  {gameId:7,num:21,g:0,a:0},{gameId:7,num:24,g:0,a:1},{gameId:7,num:25,g:0,a:2},
  {gameId:7,num:26,g:3,a:1},{gameId:7,num:27,g:0,a:1},{gameId:7,num:29,g:1,a:1},
  {gameId:7,num:37,g:1,a:0},{gameId:7,num:55,g:0,a:0},{gameId:7,num:63,g:0,a:1},
  {gameId:7,num:88,g:0,a:0},{gameId:7,num:91,g:0,a:0},
  // Game 8 — Feb 26 @ Eagles 3-4 L
  {gameId:8,num:6,g:0,a:0},{gameId:8,num:9,g:1,a:0},{gameId:8,num:14,g:0,a:3},
  {gameId:8,num:15,g:1,a:0},{gameId:8,num:16,g:0,a:0},{gameId:8,num:19,g:0,a:0},
  {gameId:8,num:21,g:0,a:0},{gameId:8,num:24,g:0,a:0},{gameId:8,num:25,g:0,a:0},
  {gameId:8,num:26,g:1,a:1},{gameId:8,num:27,g:0,a:0},{gameId:8,num:29,g:0,a:1},
  {gameId:8,num:37,g:0,a:0},{gameId:8,num:55,g:0,a:0},{gameId:8,num:63,g:0,a:0},
  {gameId:8,num:71,g:0,a:0},{gameId:8,num:88,g:0,a:1},{gameId:8,num:91,g:0,a:0},
  // Game 9 — Feb 27 @ Eagles 4-0 W
  {gameId:9,num:6,g:0,a:1},{gameId:9,num:9,g:1,a:0},{gameId:9,num:14,g:0,a:0},
  {gameId:9,num:15,g:1,a:0},{gameId:9,num:16,g:0,a:0},{gameId:9,num:19,g:0,a:1},
  {gameId:9,num:21,g:1,a:0},{gameId:9,num:25,g:0,a:1},{gameId:9,num:26,g:1,a:0},
  {gameId:9,num:27,g:0,a:1},{gameId:9,num:29,g:0,a:1},{gameId:9,num:37,g:0,a:0},
  {gameId:9,num:55,g:0,a:1},{gameId:9,num:63,g:0,a:0},{gameId:9,num:71,g:0,a:1},
  {gameId:9,num:86,g:0,a:0},{gameId:9,num:88,g:0,a:0},{gameId:9,num:91,g:0,a:0},
  // Game 10 — Mar 1 @ Mooseheads 4-5 OTL
  {gameId:10,num:6,g:1,a:0},{gameId:10,num:9,g:0,a:0},{gameId:10,num:13,g:0,a:0},
  {gameId:10,num:14,g:0,a:1},{gameId:10,num:15,g:0,a:1},{gameId:10,num:16,g:0,a:0},
  {gameId:10,num:21,g:0,a:0},{gameId:10,num:24,g:0,a:0},{gameId:10,num:25,g:1,a:1},
  {gameId:10,num:26,g:0,a:2},{gameId:10,num:27,g:0,a:1},{gameId:10,num:29,g:0,a:1},
  {gameId:10,num:37,g:1,a:1},{gameId:10,num:55,g:0,a:0},{gameId:10,num:63,g:0,a:0},
  {gameId:10,num:71,g:1,a:0},{gameId:10,num:88,g:0,a:0},
  // Game 11 — Mar 4 vs Tigres 3-5 L
  {gameId:11,num:6,g:0,a:0},{gameId:11,num:9,g:0,a:0},{gameId:11,num:14,g:0,a:0},
  {gameId:11,num:15,g:0,a:0},{gameId:11,num:16,g:0,a:0},{gameId:11,num:19,g:0,a:0},
  {gameId:11,num:21,g:1,a:0},{gameId:11,num:24,g:1,a:0},{gameId:11,num:25,g:0,a:0},
  {gameId:11,num:26,g:0,a:2},{gameId:11,num:29,g:1,a:1},{gameId:11,num:37,g:0,a:0},
  {gameId:11,num:55,g:0,a:0},{gameId:11,num:63,g:0,a:0},{gameId:11,num:71,g:0,a:0},
  {gameId:11,num:88,g:0,a:0},{gameId:11,num:91,g:0,a:0},
  // Game 12 — Mar 7 vs Cataractes 4-1 W
  {gameId:12,num:6,g:0,a:0},{gameId:12,num:9,g:0,a:0},{gameId:12,num:14,g:0,a:0},
  {gameId:12,num:15,g:0,a:0},{gameId:12,num:16,g:1,a:0},{gameId:12,num:19,g:0,a:0},
  {gameId:12,num:24,g:0,a:1},{gameId:12,num:25,g:1,a:0},{gameId:12,num:26,g:0,a:0},
  {gameId:12,num:29,g:0,a:0},{gameId:12,num:37,g:1,a:0},{gameId:12,num:55,g:0,a:0},
  {gameId:12,num:63,g:0,a:1},{gameId:12,num:71,g:0,a:0},{gameId:12,num:86,g:0,a:1},
  {gameId:12,num:88,g:0,a:2},{gameId:12,num:91,g:1,a:1},
  // Game 13 — Mar 8 vs Islanders 2-3 OTL
  {gameId:13,num:5,g:0,a:0},{gameId:13,num:6,g:0,a:0},{gameId:13,num:9,g:0,a:1},
  {gameId:13,num:13,g:0,a:0},{gameId:13,num:14,g:0,a:0},{gameId:13,num:15,g:0,a:0},
  {gameId:13,num:16,g:0,a:0},{gameId:13,num:19,g:0,a:0},{gameId:13,num:24,g:0,a:0},
  {gameId:13,num:25,g:0,a:0},{gameId:13,num:26,g:0,a:1},{gameId:13,num:29,g:1,a:0},
  {gameId:13,num:37,g:0,a:0},{gameId:13,num:55,g:0,a:0},{gameId:13,num:63,g:1,a:0},
  {gameId:13,num:71,g:0,a:0},{gameId:13,num:88,g:0,a:1},{gameId:13,num:91,g:0,a:1},
  // Game 14 — Mar 12 @ Tigres 4-1 W
  {gameId:14,num:5,g:0,a:0},{gameId:14,num:9,g:1,a:0},{gameId:14,num:14,g:0,a:0},
  {gameId:14,num:15,g:0,a:0},{gameId:14,num:16,g:0,a:1},{gameId:14,num:21,g:0,a:0},
  {gameId:14,num:24,g:0,a:0},{gameId:14,num:25,g:0,a:0},{gameId:14,num:26,g:1,a:1},
  {gameId:14,num:27,g:0,a:0},{gameId:14,num:29,g:1,a:1},{gameId:14,num:37,g:0,a:1},
  {gameId:14,num:55,g:0,a:0},{gameId:14,num:63,g:0,a:0},{gameId:14,num:71,g:0,a:0},
  {gameId:14,num:86,g:1,a:1},{gameId:14,num:88,g:0,a:0},{gameId:14,num:91,g:0,a:1},
  // Game 15 — Mar 13 @ Olympiques 3-1 W
  {gameId:15,num:5,g:0,a:0},{gameId:15,num:9,g:1,a:0},{gameId:15,num:13,g:1,a:0},
  {gameId:15,num:14,g:0,a:0},{gameId:15,num:15,g:0,a:1},{gameId:15,num:16,g:0,a:1},
  {gameId:15,num:21,g:0,a:1},{gameId:15,num:24,g:0,a:0},{gameId:15,num:25,g:0,a:0},
  {gameId:15,num:26,g:0,a:0},{gameId:15,num:27,g:0,a:1},{gameId:15,num:29,g:1,a:0},
  {gameId:15,num:37,g:0,a:0},{gameId:15,num:55,g:0,a:0},{gameId:15,num:63,g:0,a:1},
  {gameId:15,num:71,g:0,a:0},{gameId:15,num:86,g:0,a:0},{gameId:15,num:88,g:0,a:1},
  // Game 16 — Mar 15 vs Phoenix 1-4 L
  {gameId:16,num:5,g:0,a:0},{gameId:16,num:9,g:0,a:0},{gameId:16,num:14,g:0,a:1},
  {gameId:16,num:15,g:0,a:0},{gameId:16,num:16,g:0,a:0},{gameId:16,num:21,g:0,a:0},
  {gameId:16,num:24,g:0,a:0},{gameId:16,num:25,g:0,a:0},{gameId:16,num:26,g:1,a:0},
  {gameId:16,num:27,g:0,a:0},{gameId:16,num:29,g:0,a:1},{gameId:16,num:37,g:0,a:0},
  {gameId:16,num:55,g:0,a:0},{gameId:16,num:63,g:0,a:0},{gameId:16,num:71,g:0,a:0},
  {gameId:16,num:86,g:0,a:0},{gameId:16,num:88,g:0,a:0},{gameId:16,num:91,g:0,a:0},
  // Game 17 — Mar 20 vs Saguenéens 0-1 OTL (shutout — all skaters 0G 0A)
  // Scratches: 13 (IR), 19 (HS), 63 (SUS), 73 (IR), 77 (IR)
  {gameId:17,num:5,g:0,a:0},{gameId:17,num:6,g:0,a:0},{gameId:17,num:9,g:0,a:0},
  {gameId:17,num:14,g:0,a:0},{gameId:17,num:15,g:0,a:0},{gameId:17,num:16,g:0,a:0},
  {gameId:17,num:21,g:0,a:0},{gameId:17,num:24,g:0,a:0},{gameId:17,num:25,g:0,a:0},
  {gameId:17,num:26,g:0,a:0},{gameId:17,num:27,g:0,a:0},{gameId:17,num:29,g:0,a:0},
  {gameId:17,num:37,g:0,a:0},{gameId:17,num:55,g:0,a:0},{gameId:17,num:71,g:0,a:0},
  {gameId:17,num:86,g:0,a:0},{gameId:17,num:88,g:0,a:0},{gameId:17,num:91,g:0,a:0},
];

// ─── PLAYOFFS ───────────────────────────────────────────────────────────────
// Playoff schedule — same format as regular season. IDs start at 101.
// Add each game as it is played (opponent = Charlottetown for R1 4v5 series).
export const playoffSchedule = [
  // { id: 101, date: "2026-03-26", opponent: "Islanders", home: true, gf: null, ga: null, result: "upcoming" },
];

// Playoff per-game scoring log — same format as gameLog: { gameId, num, g, a }
// gameId matches an id in playoffSchedule above.
export const playoffGameLog = [
];

// Goalie per-game log — separate from skater gameLog because scoring categories differ.
// Fields: gameId (matches schedule id), num (jersey), ga, saves, win, shutout
// Scoring: saves×0.2 + win?5:0 + shutout?4:0 − ga
export const goalieLog = [
  { gameId: 17, num: 33, date: '2026-03-20', opponent: 'Saguenéens', result: 'OTL', ga: 1, saves: 24, win: false, shutout: false },
];
