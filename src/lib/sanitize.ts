const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function sanitizeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] || ch);
}

export function sanitizeInput(input: string, maxLength = 500): string {
  return sanitizeHtml(input.trim().slice(0, maxLength));
}

export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!re.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop() || "";
  return tld.length >= 2;
}

const BANNED_WORDS = [
  "fuck", "shit", "ass ", "bitch", "nigger", "faggot", "retard",
  "kill yourself", "kys", "die",
];

export function containsHarmfulContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((w) => lower.includes(w));
}

export function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
