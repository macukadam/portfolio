// Bytebeat track definitions
window.BytebeatTracks = [
  {
    title: "Galaxies Yet to be Forged",
    artist: "SthephanShi",
    sampleRate: 32000,
    gain: 0.12,
    durationMs: 152000,
    sample: (() => {
      const chordTable = [
        [0, 5, 8],
        [0, 5, 10],
        [5, 8, 12],
        [5, 8, 10],
        [0, 5, 8],
        [0, 3, 7],
        [5, 8, 12],
        [3, 8, 10],
      ];
      const melodyStr =
        "KC5HC5KC5HC5KCH5MC5HC1MD5JFAMFAJOC5KC5OC5KC5OCK5OC5KC5OCMDFJAFHJK81H81K85H81M8H5JA3FA3JA3F3AKJHMOC5KC5OC5KC5OCK5OC5KC5OCMDFJAFHJ";
      const padStr = "KMOOKJHJKMORMOHH";
      const { sin, random, pow } = Math;
      const normalize = (value) => {
        const wrapped = ((value % 256) + 256) % 256;
        return (wrapped - 128) / 128;
      };
      const c = (arr, mask, P = 2, t, B) =>
        arr
          .map((a) => (Number.isNaN(a) ? 0 : (((t / P) * pow(2, (a + (B > 3 ? 2 : -1)) / 12)) & mask)))
          .reduce((acc, v) => acc + v, 0);
      const Q = (char) => parseInt(char, 36) - 12;
      return (tIn) => {
        const t = tIn;
        const b = t >> 12;
        const bb = b >> 4;
        const B = bb >> 3;

        const m = (T) => {
          const note = Q(melodyStr[(T >> 12) & 127] ?? "0");
          const base = c([note], 32, 2, t, B);
          const envFactor = ((T >> 4) & 255) / 256;
          const envSelector = (T >> 19) & 3;
          const slope = envSelector === (B < 4 ? 3 : 1) ? 1 - ((T % (1 << 19)) / (1 << 19)) : 1;
          const env = 1 - envFactor * slope;
          return base * env * (16 / 7);
        };

        const C = c(chordTable[bb & 7], 32, 2, t, B) * (0.4 * (1 + sin(((t >> 8) - 64) / 40.74)) + 0.2);
        const M = m(t) + m(t - 1e4) / 2 + m(t - 2e4) / 4;

        const D1 = (1e5 / (t & 4095)) & 32;
        const D2 = (0 | random() * (1.8 - ((t / (1 << 12)) % 1))) * 32;
        const D = [D1, 0, (b & 31) === 30 ? D1 : D2, 0][b & 3];

        const l = (T) => {
          const gateMask = ((T >> 19) < 10 ? ~0 : (T >> 20) & 1 ? 0x5555d555 : 0xd75d5755) >> (T >> 11);
          if ((gateMask & 1) === 0) return 0;
          return c([Q(padStr[bb & 15])], 32, 1, t, B);
        };
        const L = l(t) + l(t - 1e4) / 2 + l(t - 2e4) / 4;

        const bigL = (t / (1 << 19)) % 1;
        const littleL = 1 - bigL;

        const mixOptions = [
          C,
          C + M * bigL,
          C + M + D * bigL,
          C + M + D,
          M,
          M,
          M + D,
          M + D + C * bigL,
          M + D + C * littleL,
          M + D * littleL + L * bigL,
          M + L + (D + C) * bigL / 2,
          M + L + (D + C) * (1 - littleL / 2),
        ];

        const mix = (mixOptions[B] ?? (M + D + C + L)) / 1.2;
        return normalize(mix);
      };
    })(),
  },
  {
    title: "THE HIT OF THE SEASON",
    artist: "Bytebeat",
    sampleRate: 8000,
    gain: 0.12,
    durationMs: 58000,
    sample: (t) => {
      let v = 0;
      if (t > 0 && t < 65535) {
        v = t % 32 > t / 10000 ? t >> 4 : t >> 6;
      } else if (t > 65535 && t < 65535 * 2) {
        v = t % 32 > t % 43 ? t >> 4 : t >> 6;
      } else if (t > 65535 * 2 && t < 65535 * 3) {
        v = t % 36 > t % 43 ? t >> 4 : t >> 6;
      } else if (t > 65535 * 3 && t < 65535 * 4) {
        v = t % 64 > t % 43 ? t >> 4 : t >> 6;
      } else if (t > 65535 * 4 && t < 65535 * 5) {
        v = t % 43 > 5 ? t << 3 : t >> 6;
      } else if (t > 65535 * 5 && t < 65535 * 6) {
        v = t % 27 > 5 ? t << 3 : t >> 6;
      } else if (t > 65535 * 6 && t < 65535 * 8) {
        v = t % 63 > 5 ? t << 3 : t >> 6;
      } else {
        v = 0;
      }
      const raw = (v & (t >> 4)) & 255;
      return (raw - 128) / 128;
    },
  },
  {
    title: "iloveeveryend26",
    artist: "SHCWAZERNECJLACE",
    sampleRate: 16000,
    gain: 0.16,
    durationMs: 25000,
    sample: (t) => {
      const seqA = [0, 0, -4, -4, 3, 3, -2, 3];
      const seqB = [-5, -5, -5, 3, 3, 3, 2, 2, 3, 3, 3, 3, 3, 3, 5, 5, 7, 7, 7, 3, 3, 3, 8, 8, 7, 7, 7, 7, 5, 5, 5, 5, 7, 7, 7, 3, 3, 3, 2, 2, 3, 3, 3, 3, 3, 3, 5, 5, 7, 7, 7, 3, 3, 3, 8, 8, 7, 7, 7, 7, 5, 5, 5, 5];
      const a = t * Math.pow(2, seqA[(t >> 13) & 7] / 12);
      const b = t * Math.pow(2, seqB[(t >> 11) & 63] / 12 + 2);
      const phaseMask = (t >> 6) & (256 / Number("1112"[(t >> 14) & 3])) - 1;
      const part1 = ((3 * a) ^ phaseMask | a) % 256;
      const part2 = (b ^ b * 2) % 256;
      const combined = (part1 * (2 / 3) + part2 / 3) % 256;
      return (combined - 128) / 128;
    },
  },
  {
    title: "Chiptune Remix",
    artist: "Two2Fall",
    sampleRate: 57000,
    gain: 0.14,
    durationMs: 25000,
    stereo: true,
    sample: (t) => {
      const melodyStr = "6968696DD6966984289 289 49B 49GD";
      const bassStr = "6666666622224449";

      const bass = (tt, a) => {
        const pitch = bassStr[(tt >> 14) & 15] - 0;
        return (tt * Math.pow(2, pitch / 12 - 2) * a) % 256 / 2.1 * (tt / 16384 % 2) * (1 - (tt % 8192) / 9000);
      };

      const voice = (tt, j) => {
        let t2 = tt;
        if (t2 < 0) return 0;
        t2 *= t2 > 0;
        const noteChar = melodyStr[(t2 >> 13) & 31];
        const noteVal = parseInt(noteChar, 36);
        const note = Number.isFinite(noteVal) ? noteVal : 0;
        const pitch = Math.pow(2, note / 12 - 5 / 12);
        const base = (t2 * j * pitch) % 128 + 40 + ((t2 >> 8) & 15);
        return (base & 128) % 256 * (1 - (t2 / 8192) % 1);
      };

      const leadVoice = (tt, j) => voice(tt, j) + voice(tt - 6144, j) / 2 + voice(tt - 12288, j) / 3 + voice(tt - 18432, j) / 4;
      const drums = (tt, j) => (bass(tt, 1) + bass(tt, j) + bass(tt, 2 * j)) * 7 / 9;
      const noise = (tt) => 230 * Math.random() * Math.pow(1 - (tt / 8192) % 1, 4);
      const arp = (tt) => ((tt * Math.sin(tt >> 2)) & 128) * Math.pow(1 - (tt / 32768) % 1, 5) * ((tt >> 15) & 1) / 1.3;
      const lead = (tt) => 80 * Math.tanh(3 * Math.sin(Math.pow(tt & 16383, 0.51))) * ((-tt >> 14) & 1);

      const mixFor = (jj) => {
        const main = leadVoice(t, jj) * 2 / 3 + drums(t, jj) + lead(t) + noise(t) + arp(t) - 144;
        const clamped = Math.max(-128, Math.min(127, main));
        return clamped / 128;
      };

      return [mixFor(1.006), mixFor(0.994)];
    },
  },
  {
    title: "Pleasure to Paso",
    artist: "Paso of Dyntec",
    sampleRate: 48000,
    gain: 0.13,
    durationMs: 50000,
    stereo: true,
    sample: (() => {
      const leadRatios = [
        0.425, 0.425, 0.85, 0.425, 0.425, 0.85, 0.425, 0.425, 0.85, 0.425, 0.425, 0.85, 0.425, 0.425, 0.375, 0.425, 0.425, 0.425, 0.85, 0.425, 0.425, 0.85, 0.425, 0.425, 0.85, 0.425, 0.425, 0.85, 0.425, 0.425, 0.375, 0.425, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.575, 0.575, 1.15, 0.575, 0.575, 1.15, 0.575, 0.575, 1.15, 0.575, 0.575, 1.15, 0.625, 1.25, 0.575, 1,
      ];
      const bassLine = [9, 9, 9, 9, , , 7, , 9, 12, , 9, 9, , 7, , 9, 9, 9, 9, , , 7, , 9, 12, 9, , 7, 9, 9, , 12, 12, 12, 12, , , 12, 12, 17, , 16, 16, 16, , , , 14, 14, 14, , 7, 7, 7, , 14, 14, 14, 17, , 16, 17];
      const { PI, sin, log2, round, pow } = Math;
      const normalize = (value) => {
        const wrapped = ((value % 256) + 256) % 256;
        return (wrapped - 128) / 128;
      };
      const bass = (c, speed) => {
        if (c <= 0) return 0;
        const pitch = bassLine[((c * speed) >> 12) & 63] ?? 0;
        const osc = ((3 * c) / 4) * pow(2, pitch / 12 - (sin(c / 2048 * PI) * 3) / c);
        return (osc % 128 + 16) & 128;
      };
      return (tIn) => {
        let t = tIn;
        t /= 1.48;
        const s = 0.9;
        const leadRatio = leadRatios[((t * s) >> 12) % 64];
        const a = (((t / 2) * pow(2, round(log2(leadRatio ?? 0) * 12) / 12)) % 128 + 48 + sin(t / 8192 * PI) * 7) & 128;
        const divider = (t * s) & 16383;
        const r = (t * sin(t >> 3) * (((t * s) >> 14) & 1) & (((~t) * s) >> 7) & 127) ^ (divider ? 1e5 / divider : 0);
        const voices = [a, (bass(t, s) + bass(t - 8192, s) / 3) | 0];
        return voices.map((voice) => normalize(voice ^ r));
      };
    })(),
  },
];
