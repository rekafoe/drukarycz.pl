/** E-mail konta: małe litery, bez spacji. Ten sam wzorzec co w koszyku. */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isEmail(value: string) {
  const email = normalizeEmail(value);
  return email.length > 2 && email.length <= 120 && emailPattern.test(email);
}
