// Appointments store a client as "Rohit Verma (FinEdge Solutions)" — one string,
// because that is what the booking API writes. Three separate files had each
// grown their own `client.split(' (')[0]`, so a change to the format would have
// had to be found in all of them.

/** "Rohit Verma (FinEdge Solutions)" -> "Rohit Verma" */
export const personName = (client = '') => String(client).split(' (')[0].trim()

/** "Rohit Verma (FinEdge Solutions)" -> "FinEdge Solutions"; '' when there is no company */
export function personCompany(client = '') {
  const m = /\(([^)]+)\)/.exec(String(client))
  return m ? m[1].trim() : ''
}

/** "Rohit Verma (FinEdge Solutions)" -> "RV". Initials of the person, never the company. */
export const initialsOf = (client = '') =>
  personName(client)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
