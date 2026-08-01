// Profile pictures keyed by display name.
// Default look is a generic silhouette placeholder (see Avatar.jsx) on the person's colour.
// `hair` picks the silhouette variant; `src` is optional — set it to a file in
// public/avatars/ (or any URL) to show a real picture for that person instead.
export const profiles = {
  'AI Syndicate': { color: '#00a884', hair: 'short' },
  'Superworks Support': { color: '#7c3aed', hair: 'short' },
  'HR Announcements': { color: '#f59e0b', hair: 'long' },
  'Priya Nair': { color: '#0ea5e9', hair: 'long' },
  'Amit Deshmukh': { color: '#ef4444', hair: 'short' },
  'Kavya Reddy': { color: '#a855f7', hair: 'long' },
  'Rohit Sharma': { color: '#14b8a6', hair: 'short' },
}

const palette = ['#0ea5e9', '#7c3aed', '#f59e0b', '#14b8a6', '#ef4444', '#db2777']

const hashOf = (name = '') => [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0)

export const avatarFor = (name = '') => profiles[name]?.src || ''

// Stable per-name colour so an avatar never changes between renders
export const colorFor = (name = '') => profiles[name]?.color || palette[hashOf(name) % palette.length]

export const hairFor = (name = '') => profiles[name]?.hair || (hashOf(name) % 2 ? 'long' : 'short')
