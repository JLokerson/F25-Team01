// extremely simple demo auth: stores email + lastName only
const KEY = 'app:user';

export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch { return null; }
}

export function setUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(KEY);
}

export async function demoLogin(email, passwordLastName) {
  // “demo rule”: last name must match the part after the first dot or at end
  // Example: john.smith@gmail.com -> password 'smith'
  if (!email || !passwordLastName) return { ok: false, msg: 'Missing email or password' };

  const last = (email.split('@')[0].split('.').pop() || '').toLowerCase();
  const ok = last && last === String(passwordLastName).toLowerCase();

  if (ok) {
    const user = { email, lastName: passwordLastName };
    setUser(user);
    return { ok: true, user };
  } else {
    return { ok: false, msg: 'Invalid credentials (demo rule failed)' };
  }
}
