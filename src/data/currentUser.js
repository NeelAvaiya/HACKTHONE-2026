// Who is signed in on the client side. One definition, because the same person
// was previously spelled three different ways: the chat created tickets as
// "Nexara Tech", bookings fell back to a hardcoded string on the server, and
// nothing on screen ever told the client who they were logged in as.
//
// A real product would read this from the session. Here it is fixed data —
// but it is fixed in ONE place, so the name in the chat header, on the booking,
// and on the ticket are guaranteed to be the same person.
export const currentUser = {
  name: 'Rohit Verma',
  company: 'FinEdge Solutions',
  role: 'HR Head',
  // The form stored on an appointment: "Rohit Verma (FinEdge Solutions)"
  get label() {
    return `${this.name} (${this.company})`
  },
}
