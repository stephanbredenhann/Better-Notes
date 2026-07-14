export const colors = {
  primary: '#1cb0f6',
  softWash: '#d6f1fc',
  charcoal: '#4b4b4b',
  pencilGray: '#777777',
  fadedGray: '#afafaf',
  paperWhite: '#ffffff',
  nightInk: '#000437',
  successSoft: '#e8f9ef',
  danger: '#ff4b4b',
} as const;

export const spacing = {
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
} as const;

export const radii = {
  control: 12,
  sheet: 20,
  fab: 28,
} as const;

export const typography = {
  caption: { fontSize: 13, lineHeight: 16 },
  navLabel: { fontSize: 15, lineHeight: 20, letterSpacing: 0.8 },
  body: { fontSize: 17, lineHeight: 22 },
  subheading: { fontSize: 19, lineHeight: 26 },
  headingSm: { fontSize: 28, lineHeight: 34 },
  heading: { fontSize: 36, lineHeight: 42 },
} as const;
