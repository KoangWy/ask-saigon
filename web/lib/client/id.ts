// An anonymous id kept in this browser so a traveller sees their own pending routes and rates a
// route once. It is never tied to a name or contact.
export function clientId(): string {
  try {
    let id = localStorage.getItem('ask-saigon-client');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('ask-saigon-client', id); }
    return id;
  } catch { return 'anonymous'; }
}
