import React from 'react';

/**
 * ManilaSkylineOutline
 * Theme-conforming, transparent vector architectural outline of iconic City of Manila landmarks:
 * - Elevated viaduct pillars (LRT Line 1)
 * - Rizal Monument (Luneta / Bagumbayan)
 * - Intramuros historic gate (Puerta Real / Fort Santiago)
 * - Manila Cathedral dome and towers
 * - San Agustin Baroque pediment
 * - High-rise city silhouette
 * - Manila City Hall iconic Clock Tower
 * - Andres Bonifacio Monument (with upraised bolo)
 * - Official Republic of the Philippines / City of Manila civic crest
 *
 * Conforms 100% to the active theme color via currentColor or custom accent variable.
 */
export default function ManilaSkylineOutline({
  className = '',
  height = 36,
  style = {},
  showSeal = true,
  opacity = 0.9,
  glow = true,
}) {
  return (
    <div
      className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        background: 'transparent',
        ...style,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1600 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full text-[var(--accent-cyan)] transition-colors duration-300"
        style={{
          opacity,
          filter: glow ? 'drop-shadow(0 0 4px var(--accent-cyan))' : 'none',
        }}
      >
        {/* Top & Bottom Baseline Guides */}
        <line x1="0" y1="2" x2="1600" y2="2" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="0" y1="68" x2="1600" y2="68" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* LEFT SECTION (0 to 650) */}

        {/* Viaduct Column 1 */}
        <path
          d="M 2 2 L 2 24 L 28 24 L 28 68 M 28 24 L 54 24 L 54 2"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* Rizal Monument 1 (Luneta / Bagumbayan) */}
        {/* Plinth */}
        <path
          d="M 68 68 L 74 58 L 86 58 L 92 68 M 76 58 L 76 34 L 80 18 L 84 34 L 84 58"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {/* Statue silhouette on plinth */}
        <circle cx="80" cy="14" r="2" stroke="currentColor" strokeWidth="1" />
        <path d="M 78 16 L 82 16 L 82 20 L 78 20 Z" stroke="currentColor" strokeWidth="1" />

        {/* San Agustin Church Facade */}
        <path
          d="M 112 68 L 112 38 L 122 38 L 122 28 L 134 22 L 146 28 L 146 38 L 156 38 L 156 68"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {/* Cross on roof */}
        <path d="M 134 16 L 134 22 M 131 18 L 137 18" stroke="currentColor" strokeWidth="1.2" />
        {/* Church Arched Portal & Windows */}
        <path d="M 130 68 L 130 52 C 130 48 138 48 138 52 L 138 68" stroke="currentColor" strokeWidth="1" />
        <circle cx="134" cy="38" r="4" stroke="currentColor" strokeWidth="1" />
        <path d="M 116 46 L 118 46 M 150 46 L 152 46" stroke="currentColor" strokeWidth="1" />

        {/* Manila Cathedral Dome and Grand Facade */}
        <path
          d="M 172 68 L 172 40 L 180 40 L 180 28 L 194 28 L 194 18 C 194 10 214 10 214 18 L 214 28 L 228 28 L 228 40 L 236 40 L 236 68"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Dome cross */}
        <path d="M 204 6 L 204 12 M 201 8 L 207 8" stroke="currentColor" strokeWidth="1.2" />
        {/* Cathedral Cupola Lantern & Ribs */}
        <line x1="204" y1="12" x2="204" y2="28" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" />
        {/* Romanesque portal arch */}
        <path d="M 196 68 L 196 48 C 196 42 212 42 212 48 L 212 68" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 182 46 L 190 46 M 218 46 L 226 46" stroke="currentColor" strokeWidth="1" />

        {/* Intramuros Puerta Real / Gate & City Skyline */}
        <path
          d="M 248 68 L 248 44 L 260 44 L 260 36 L 270 36 L 270 28 L 282 28 L 282 44 L 292 44 L 292 68"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {/* Arch opening */}
        <path d="M 256 68 L 256 54 C 256 50 264 50 264 54 L 264 68" stroke="currentColor" strokeWidth="1" />

        {/* Modern Skyline Buildings (Tondo & Binondo) */}
        <path
          d="M 302 68 L 302 38 L 314 38 L 314 68 M 314 42 L 326 42 L 326 68 M 326 34 L 338 34 L 338 68 M 346 68 L 346 30 L 358 30 L 358 68"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* Viaduct Pillar 2 */}
        <path
          d="M 374 2 L 374 24 L 398 24 L 398 68 M 398 24 L 422 24 L 422 2"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* Manila City Hall Iconic Clock Tower (Left Instance) */}
        <path
          d="M 438 68 L 442 54 L 442 36 L 446 36 L 446 22 L 452 14 L 458 14 L 464 22 L 464 36 L 468 36 L 468 54 L 472 68"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Clock Tower Cupola & Finial */}
        <path d="M 455 6 L 455 14 M 452 8 L 458 8" stroke="currentColor" strokeWidth="1.2" />
        {/* Large Round Clock Face */}
        <circle cx="455" cy="30" r="7" stroke="currentColor" strokeWidth="1.2" />
        <line x1="455" y1="30" x2="455" y2="26" stroke="currentColor" strokeWidth="1.2" />
        <line x1="455" y1="30" x2="459" y2="30" stroke="currentColor" strokeWidth="1.2" />

        {/* Andres Bonifacio Monument (Liwasang Bonifacio with bolo) */}
        <path
          d="M 494 68 L 500 60 L 518 60 L 524 68 M 504 60 L 504 46 L 514 46 L 514 60"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {/* Bonifacio Statue with bolo raised */}
        <circle cx="509" cy="38" r="2.5" stroke="currentColor" strokeWidth="1" />
        <path d="M 509 40 L 509 46 M 509 42 L 518 36 M 518 36 L 526 28" stroke="currentColor" strokeWidth="1.4" />

        {/* Additional Skyline Silhouette */}
        <path
          d="M 538 68 L 538 48 L 548 48 L 548 68 M 556 68 L 556 34 L 568 34 L 568 68 M 576 68 L 576 42 L 588 42 L 588 68"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* CENTER CIVIC CREST & EMBLEM (680 to 920) */}
        {showSeal && (
          <g transform="translate(690, 8)">
            {/* Outer Circular Seal Rim */}
            <circle cx="28" cy="27" r="24" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="28" cy="27" r="21" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />

            {/* City of Manila Castle / Sea Lion Silhouette */}
            <path
              d="M 22 24 L 22 18 L 26 18 L 26 21 L 30 21 L 30 18 L 34 18 L 34 24 Z"
              stroke="currentColor"
              strokeWidth="1"
            />
            {/* Waves representing Manila Bay & Pasig River */}
            <path
              d="M 18 32 Q 23 30 28 32 Q 33 34 38 32"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M 18 36 Q 23 34 28 36 Q 33 38 38 36"
              stroke="currentColor"
              strokeWidth="1"
            />

            {/* Stars on seal perimeter */}
            <circle cx="16" cy="18" r="1" fill="currentColor" />
            <circle cx="40" cy="18" r="1" fill="currentColor" />
            <circle cx="28" cy="45" r="1" fill="currentColor" />

            {/* Republic of the Philippines & CITY OF MANILA Inscription */}
            <text
              x="62"
              y="22"
              fill="currentColor"
              fontSize="9"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              Republic of the Philippines
            </text>
            <line x1="62" y1="26" x2="220" y2="26" stroke="currentColor" strokeWidth="1.2" />
            <text
              x="62"
              y="38"
              fill="currentColor"
              fontSize="12"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="800"
              letterSpacing="0.14em"
            >
              CITY OF MANILA
            </text>
            <text
              x="62"
              y="48"
              fill="currentColor"
              fontSize="7.5"
              fontFamily="var(--font-mono), monospace"
              letterSpacing="0.06em"
              opacity="0.8"
            >
              DEPT OF ENGINEERING & PUBLIC WORKS
            </text>
          </g>
        )}

        {/* RIGHT SECTION (930 to 1600) */}

        {/* Viaduct Column 3 */}
        <path
          d="M 940 2 L 940 24 L 964 24 L 964 68 M 964 24 L 988 24 L 988 2"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* San Agustin Church 2 */}
        <path
          d="M 1004 68 L 1004 38 L 1014 38 L 1014 28 L 1026 22 L 1038 28 L 1038 38 L 1048 38 L 1048 68"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path d="M 1026 16 L 1026 22 M 1023 18 L 1029 18" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 1022 68 L 1022 52 C 1022 48 1030 48 1030 52 L 1030 68" stroke="currentColor" strokeWidth="1" />
        <circle cx="1026" cy="38" r="4" stroke="currentColor" strokeWidth="1" />

        {/* Manila Cathedral 2 */}
        <path
          d="M 1064 68 L 1064 40 L 1072 40 L 1072 28 L 1086 28 L 1086 18 C 1086 10 1106 10 1106 18 L 1106 28 L 1120 28 L 1120 40 L 1128 40 L 1128 68"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M 1096 6 L 1096 12 M 1093 8 L 1099 8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 1088 68 L 1088 48 C 1088 42 1104 42 1104 48 L 1104 68" stroke="currentColor" strokeWidth="1.2" />

        {/* Intramuros Gate 2 */}
        <path
          d="M 1140 68 L 1140 44 L 1152 44 L 1152 36 L 1162 36 L 1162 28 L 1174 28 L 1174 44 L 1184 44 L 1184 68"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path d="M 1148 68 L 1148 54 C 1148 50 1156 50 1156 54 L 1156 68" stroke="currentColor" strokeWidth="1" />

        {/* Modern Skyline Buildings */}
        <path
          d="M 1196 68 L 1196 36 L 1208 36 L 1208 68 M 1208 42 L 1220 42 L 1220 68 M 1220 30 L 1232 30 L 1232 68 M 1240 68 L 1240 26 L 1252 26 L 1252 68"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* Bonifacio Monument 2 with upraised bolo */}
        <path
          d="M 1266 68 L 1272 60 L 1290 60 L 1296 68 M 1276 60 L 1276 46 L 1286 46 L 1286 60"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle cx="1281" cy="38" r="2.5" stroke="currentColor" strokeWidth="1" />
        <path d="M 1281 40 L 1281 46 M 1281 42 L 1294 34 M 1294 34 L 1308 24" stroke="currentColor" strokeWidth="1.5" />

        {/* Manila City Hall Clock Tower (Right Instance) */}
        <path
          d="M 1324 68 L 1328 54 L 1328 36 L 1332 36 L 1332 22 L 1338 14 L 1344 14 L 1350 22 L 1350 36 L 1354 36 L 1354 54 L 1358 68"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M 1341 6 L 1341 14 M 1338 8 L 1344 8" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="1341" cy="30" r="7" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1341" y1="30" x2="1341" y2="26" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1341" y1="30" x2="1345" y2="30" stroke="currentColor" strokeWidth="1.2" />

        {/* Rizal Monument 2 (Luneta) */}
        <path
          d="M 1374 68 L 1380 58 L 1392 58 L 1398 68 M 1382 58 L 1382 34 L 1386 18 L 1390 34 L 1390 58"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle cx="1386" cy="14" r="2" stroke="currentColor" strokeWidth="1" />

        {/* Viaduct Column 4 */}
        <path
          d="M 1412 2 L 1412 24 L 1436 24 L 1436 68 M 1436 24 L 1460 24 L 1460 2"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* Ending Skyline Silhouettes */}
        <path
          d="M 1474 68 L 1474 42 L 1486 42 L 1486 68 M 1494 68 L 1494 32 L 1508 32 L 1508 68 M 1516 68 L 1516 48 L 1528 48 L 1528 68 M 1538 68 L 1538 38 L 1552 38 L 1552 68 M 1564 68 L 1564 44 L 1580 44 L 1580 68"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}
