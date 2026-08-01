// Pure function: text -> 'en' | 'hi' | 'hinglish' | null
//
// "hi" here means Hindi written in Latin script ("mujhe chhutti ka status
// dekhna hai"), not Devanagari — that is how people actually type in this
// product. Devanagari is still accepted and treated as Hindi.
//
// The Hindi/Hinglish split: Hindi words with NO English words mixed in reads as
// Hindi; Hindi words WITH English words mixed in reads as Hinglish. Product
// nouns are excluded from that count, because everybody says "payslip" and
// "login" in English no matter which language they are speaking.
//
// null means "no language signal" — the caller keeps whatever language the
// conversation was already in. This matters: after a Hindi question the client
// answers "9" to pick a slot or taps a "Payroll" chip, and neither carries a
// Hindi signal. Treating those as English would flip the conversation exactly
// when the booking is being confirmed.

const DEVANAGARI = /[ऀ-ॿ]/

// Romanised Hindi, matched on WORD BOUNDARIES. Substring matching would read
// "Karnataka" and "market" as Hindi because they contain "kar".
// Words that are also ordinary English ("the", "salary", "mat", "so") are
// deliberately absent — one of them would misread most English sentences.
const HINDI_WORDS = new Set([
  'hai', 'hain', 'hoon', 'hu', 'ho', 'tha', 'thi', 'hua', 'hui', 'hoga', 'hogi',
  'kya', 'kyu', 'kyun', 'kaise', 'kaisi', 'kaun', 'kab', 'kahan', 'kitna', 'kitne', 'kaha',
  'nahi', 'nahin', 'nai', 'bina', 'bilkul', 'zaroor', 'jaroor',
  'mujhe', 'mera', 'meri', 'mere', 'main', 'hume', 'humein', 'hamara', 'hamari',
  'aap', 'aapka', 'aapki', 'aapko', 'aapse', 'tum', 'tumhara', 'uska', 'iska', 'ye', 'wo', 'yeh', 'vah',
  'kar', 'karo', 'karna', 'karni', 'karke', 'kiya', 'karenge', 'karunga', 'karta', 'karti',
  'chahiye', 'chaiye', 'raha', 'rahi', 'rhi', 'rha', 'rahe', 'gaya', 'gayi', 'gaye',
  'dekh', 'dekhna', 'dekhiye', 'batao', 'bataye', 'bataiye', 'batana', 'chalta', 'chal',
  'mil', 'milna', 'milta', 'milti', 'milega', 'milegi', 'baat', 'baate', 'jankari', 'jaankari',
  'karte', 'karti', 'kare', 'karein', 'kariye', 'hota', 'hoti', 'hote', 'hona', 'hone',
  'sakta', 'sakti', 'sakte', 'wala', 'wali', 'wale', 'koi', 'kuch', 'sab', 'har', 'jab', 'agar',
  'dena', 'dijiye', 'lena', 'lijiye', 'chahta', 'chahti', 'padta', 'padti', 'lagta', 'lagti',
  'baje', 'bje', 'kal', 'aaj', 'abhi', 'parso', 'subah', 'shaam', 'raat', 'din', 'samay', 'waqt',
  'thik', 'theek', 'accha', 'acha', 'sahi', 'galat', 'bahut', 'bohot', 'thoda', 'zyada', 'kam',
  'yaar', 'bhai', 'ji', 'na', 'toh', 'bhi', 'phir', 'lekin', 'magar', 'aur', 'ya', 'se', 'ko', 'ka', 'ki', 'ke', 'me', 'mein',
  'namaste', 'namaskar', 'dhanyavaad', 'shukriya', 'maaf', 'kripya',
  'chhutti', 'chutti', 'haazri', 'hazri', 'vetan', 'tankhwah', 'paisa', 'kaam', 'dikkat', 'samasya', 'sawaal',
])

// Said in English by everyone, so they don't make a sentence "Hinglish"
const PRODUCT_NOUNS = new Set([
  'payroll', 'payslip', 'payslips', 'hrms', 'pms', 'login', 'logout', 'app', 'sso', 'pf', 'hr',
  'attendance', 'leave', 'salary', 'ticket', 'report', 'admin', 'export', 'pdf', 'email', 'link',
  'superworks', 'ai', 'helpsense', 'demo', 'slot', 'ok', 'okay',
])

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9ऀ-ॿ]+/)
    .filter(Boolean)

export function detectLanguage(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  if (DEVANAGARI.test(raw)) return 'hi'

  const tokens = tokenize(raw)
  const words = tokens.filter((t) => /[a-z]/.test(t))
  if (!words.length) return null

  const hindi = words.filter((w) => HINDI_WORDS.has(w))
  if (hindi.length) {
    // Hindi words present: is anything English mixed in with them?
    const english = words.filter((w) => !HINDI_WORDS.has(w) && !PRODUCT_NOUNS.has(w) && w.length > 2)
    return english.length ? 'hinglish' : 'hi'
  }

  // No Hindi at all. A short reply ("9", "ok", "Payroll") carries no signal.
  return words.length >= 3 ? 'en' : null
}

/** Current language + new message -> language to reply in. */
export const resolveLanguage = (current, text) => detectLanguage(text) || current || 'en'
