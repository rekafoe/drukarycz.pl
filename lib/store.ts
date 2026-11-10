import { randomBytes } from "crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { isEmail, normalizeEmail } from "@/lib/auth/email";
import { hashPassword, isPassword, passwordMatches } from "@/lib/auth/password";
import { listPrintFiles, removePrints, writePrintFile } from "@/lib/print-files";
import {
  initialWork,
  phoneDigits,
  samePages,
  sanitizeWork,
  workIsMeaningful,
  type PrintAreaId,
  type WorkSnapshot,
} from "@/lib/work";

export type OauthPending = {
  state: string;
  nonce: string;
  returnTo: string;
  expiresAt: number;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  phoneDigits: string;
  phoneLabel: string;
  googleId: string | null;
  passwordHash: string | null;
};

export type DesignRecord = {
  id: string;
  ownerId: string;
  updatedAt: string;
  work: WorkSnapshot;
};

export type SessionRecord = {
  id: string;
  userId: string | null;
  designId: string | null;
  work: WorkSnapshot;
  oauth: OauthPending | null;
  updatedAt: number;
};

type Store = {
  users: UserRecord[];
  designs: DesignRecord[];
  sessions: SessionRecord[];
};

function storePath() {
  return process.env.MERCH_STORE || path.join(process.cwd(), "data", "merch-store.json");
}

function emptyStore(): Store {
  return { users: [], designs: [], sessions: [] };
}

function readUser(raw: unknown): UserRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;
  const email = typeof row.email === "string" ? normalizeEmail(row.email) : "";
  const name = typeof row.name === "string" ? row.name : "";
  const phoneLabel = typeof row.phoneLabel === "string" ? row.phoneLabel : "";
  const digits = typeof row.phoneDigits === "string" ? row.phoneDigits : phoneDigits(phoneLabel);
  const googleId = typeof row.googleId === "string" && row.googleId ? row.googleId : null;
  const passwordHash =
    typeof row.passwordHash === "string" && row.passwordHash.includes(":") ? row.passwordHash : null;
  return { id, email, name, phoneDigits: digits, phoneLabel, googleId, passwordHash };
}

function readSession(raw: unknown): SessionRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;
  const oauth = readOauth(row.oauth);
  return {
    id,
    userId: typeof row.userId === "string" ? row.userId : null,
    designId: typeof row.designId === "string" ? row.designId : null,
    work: row.work && typeof row.work === "object" ? (row.work as WorkSnapshot) : initialWork(),
    oauth,
    updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : Date.now(),
  };
}

function readOauth(raw: unknown): OauthPending | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const state = typeof row.state === "string" ? row.state : "";
  const nonce = typeof row.nonce === "string" ? row.nonce : "";
  const returnTo = typeof row.returnTo === "string" ? row.returnTo : "/";
  const expiresAt = typeof row.expiresAt === "number" ? row.expiresAt : 0;
  if (!state) return null;
  return { state, nonce, returnTo, expiresAt };
}

function readStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(storePath(), "utf8")) as Partial<Store>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users.map(readUser).filter((item): item is UserRecord => Boolean(item)) : [],
      designs: Array.isArray(parsed.designs) ? parsed.designs : [],
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions.map(readSession).filter((item): item is SessionRecord => Boolean(item))
        : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
  const filePath = storePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, JSON.stringify(store));
  renameSync(tmp, filePath);
}

let chain: Promise<unknown> = Promise.resolve();

function updateStore<T>(mutate: (store: Store) => T): Promise<T> {
  const run = chain.then(() => {
    const store = readStore();
    const result = mutate(store);
    writeStore(store);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function newId() {
  return randomBytes(9).toString("base64url");
}

function freshSession(): SessionRecord {
  return {
    id: newId(),
    userId: null,
    designId: null,
    work: initialWork(),
    oauth: null,
    updatedAt: Date.now(),
  };
}

function pruneSessions(store: Store, currentId: string) {
  const sorted = [...store.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const keep = sorted.slice(0, 200);
  if (!keep.some((item) => item.id === currentId)) {
    const current = store.sessions.find((item) => item.id === currentId);
    if (current) keep.push(current);
  }
  for (const item of store.sessions) {
    if (!keep.some((kept) => kept.id === item.id)) removePrints(item.id);
  }
  store.sessions = keep;
}

function publicUser(user: UserRecord) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phoneLabel };
}

export function viewSession(session: SessionRecord, store: Store) {
  const user = session.userId ? store.users.find((item) => item.id === session.userId) : undefined;
  session.work = sanitizeWork(session.work, Boolean(session.userId), session.work);
  session.work.printFiles = listPrintFiles(session.id);
  return {
    user: user ? publicUser(user) : null,
    work: session.work,
    designId: session.designId,
    devCode: null,
  };
}

function ownDesign(store: Store, session: SessionRecord) {
  if (!session.userId) return undefined;
  if (session.designId) {
    const linked = store.designs.find((item) => item.id === session.designId && item.ownerId === session.userId);
    if (linked) return linked;
  }
  return store.designs.find((item) => item.ownerId === session.userId);
}

function touchDesign(store: Store, session: SessionRecord) {
  if (!session.userId) {
    session.designId = null;
    return null;
  }
  let design = ownDesign(store, session);
  if (!design) {
    design = {
      id: newId(),
      ownerId: session.userId,
      updatedAt: new Date().toISOString(),
      work: session.work,
    };
    store.designs.push(design);
  } else {
    design.work = session.work;
    design.updatedAt = new Date().toISOString();
  }
  session.designId = design.id;
  return design.id;
}

export function ensureSession(existingId: string | null) {
  return updateStore((store) => {
    let session = existingId ? store.sessions.find((item) => item.id === existingId) : undefined;
    const isNew = !session;
    if (!session) {
      session = freshSession();
      store.sessions.push(session);
    }
    session.updatedAt = Date.now();
    pruneSessions(store, session.id);
    const view = viewSession(session, store);
    const design = ownDesign(store, session);
    if (design) design.work = session.work;
    return { id: session.id, isNew, view: structuredClone(view) };
  });
}

/** Только чтение для серверной отрисовки страницы: новую сессию не заводит и файл не пишет. */
export function peekSession(sessionId: string) {
  const store = readStore();
  const session = store.sessions.find((item) => item.id === sessionId);
  if (!session) return null;
  return structuredClone(viewSession(session, store));
}

export function saveWork(sessionId: string, input: unknown) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const previous = session.work;
    session.work = sanitizeWork(input, Boolean(session.userId), previous);
    if (!samePages(previous.pages, session.work.pages)) removePrints(session.id);
    session.work.printFiles = listPrintFiles(session.id);
    session.updatedAt = Date.now();
    if (session.userId) touchDesign(store, session);
    else session.designId = null;
    return structuredClone(viewSession(session, store));
  });
}

function findUser(
  store: Store,
  query: { email?: string; googleId?: string },
): UserRecord | undefined {
  if (query.googleId) {
    const byGoogle = store.users.find((item) => item.googleId === query.googleId);
    if (byGoogle) return byGoogle;
  }
  if (query.email) {
    return store.users.find((item) => item.email && item.email === query.email);
  }
  return undefined;
}

function ensureUser(
  store: Store,
  input: { email: string; name: string; googleId?: string | null },
): UserRecord {
  const email = normalizeEmail(input.email);
  let user = findUser(store, { googleId: input.googleId ?? undefined, email });
  if (!user) {
    user = {
      id: newId(),
      email,
      name: input.name,
      phoneDigits: "",
      phoneLabel: "",
      googleId: input.googleId ?? null,
      passwordHash: null,
    };
    store.users.push(user);
    return user;
  }
  if (input.name) user.name = input.name;
  if (email && !user.email) user.email = email;
  if (input.googleId) user.googleId = input.googleId;
  return user;
}

function attachUser(store: Store, session: SessionRecord, user: UserRecord) {
  const guestWork = session.work;
  session.userId = user.id;
  session.oauth = null;
  if (workIsMeaningful(guestWork)) {
    session.work = guestWork;
    touchDesign(store, session);
  } else {
    const saved = store.designs.find((item) => item.ownerId === user.id);
    if (saved) {
      session.work = saved.work;
      session.designId = saved.id;
    } else {
      session.work = initialWork();
      touchDesign(store, session);
    }
  }
  if (user.email && !session.work.order.email) {
    session.work = { ...session.work, order: { ...session.work.order, email: user.email } };
  }
  session.updatedAt = Date.now();
}

export async function loginWithPassword(
  sessionId: string,
  input: { email: string; emailConfirm: string; password: string; passwordConfirm: string },
) {
  const email = normalizeEmail(input.email);
  const emailConfirm = normalizeEmail(input.emailConfirm);
  if (!isEmail(input.email) || !isEmail(input.emailConfirm)) {
    return { error: "Podaj e-mail" as const };
  }
  if (email !== emailConfirm) {
    return { error: "E-maile nie są takie same" as const };
  }
  if (input.password !== input.passwordConfirm) {
    return { error: "Hasła nie są takie same" as const };
  }
  if (!isPassword(input.password)) {
    return { error: "Hasło: od 8 do 128 znaków" as const };
  }

  const snapshot = readStore();
  const known = findUser(snapshot, { email });
  if (known && !known.passwordHash) {
    return { error: "To konto działa przez Google. Wejdź przyciskiem Google." as const };
  }
  if (known?.passwordHash) {
    const ok = await passwordMatches(input.password, known.passwordHash);
    if (!ok) return { error: "E-mail albo hasło nie pasuje" as const };
    return updateStore((store) => {
      const session = store.sessions.find((item) => item.id === sessionId);
      const user = findUser(store, { email });
      if (!session || !user) return { error: "Nie znaleziono sesji" as const };
      attachUser(store, session, user);
      return { view: viewSession(session, store) };
    });
  }

  const passwordHash = await hashPassword(input.password);
  const name = email.split("@")[0] || "Gość";
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return { error: "Nie znaleziono sesji" as const };
    let user = findUser(store, { email });
    if (user && !user.passwordHash) {
      return { error: "To konto działa przez Google. Wejdź przyciskiem Google." as const };
    }
    if (user?.passwordHash) {
      return { error: "Spróbuj jeszcze raz" as const };
    }
    user = {
      id: newId(),
      email,
      name,
      phoneDigits: "",
      phoneLabel: "",
      googleId: null,
      passwordHash,
    };
    store.users.push(user);
    attachUser(store, session, user);
    return { view: viewSession(session, store) };
  });
}

export function loginGoogleProfile(
  sessionId: string,
  profile: { googleId: string; email: string; name: string },
) {
  if (!isEmail(profile.email) || !profile.googleId.trim()) {
    return Promise.resolve({ error: "Konto Google bez e-maila" as const });
  }
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return { error: "Nie znaleziono sesji" as const };
    const user = ensureUser(store, {
      email: profile.email,
      name: profile.name.trim() || profile.email.split("@")[0] || "Gość",
      googleId: profile.googleId,
    });
    attachUser(store, session, user);
    return { view: viewSession(session, store) };
  });
}

export function beginGoogleOauth(
  sessionId: string,
  pending: Omit<OauthPending, "expiresAt">,
) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return { error: "Nie znaleziono sesji" as const };
    session.oauth = { ...pending, expiresAt: Date.now() + 10 * 60 * 1000 };
    session.updatedAt = Date.now();
    return { oauth: session.oauth };
  });
}

export function takeGoogleOauth(sessionId: string, state: string) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session?.oauth) return { error: "Sesja Google wygasła" as const };
    const pending = session.oauth;
    session.oauth = null;
    session.updatedAt = Date.now();
    if (pending.expiresAt <= Date.now()) return { error: "Sesja Google wygasła" as const };
    if (pending.state !== state) return { error: "Sesja Google nie pasuje" as const };
    return { oauth: pending };
  });
}

export function logoutSession(sessionId: string) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    session.userId = null;
    session.designId = null;
    session.work = initialWork();
    session.oauth = null;
    session.updatedAt = Date.now();
    return viewSession(session, store);
  });
}

export function renameUser(sessionId: string, name: string) {
  return updateProfile(sessionId, { name });
}

export function updateProfile(sessionId: string, input: { name?: string; phone?: string }) {
  const nextName = input.name !== undefined ? input.name.trim() : undefined;
  if (nextName !== undefined && (!nextName || nextName.length > 80)) {
    return Promise.resolve({ error: "Napisz, jak się do Ciebie zwracać" as const });
  }
  let phoneLabel: string | undefined;
  let digits = "";
  if (input.phone !== undefined) {
    phoneLabel = input.phone.trim();
    digits = phoneDigits(phoneLabel);
    if (phoneLabel && (digits.length < 9 || digits.length > 15)) {
      return Promise.resolve({ error: "Podaj telefon albo zostaw puste" as const });
    }
  }
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    const user = session?.userId ? store.users.find((item) => item.id === session.userId) : undefined;
    if (!session || !user) return { error: "Najpierw się zaloguj" as const };
    if (nextName !== undefined) user.name = nextName;
    if (phoneLabel !== undefined) {
      user.phoneLabel = phoneLabel;
      user.phoneDigits = digits;
    }
    session.updatedAt = Date.now();
    return { view: viewSession(session, store) };
  });
}

export function openOwnDesign(sessionId: string, designId: string) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session?.userId) return false;
    const design = store.designs.find((item) => item.id === designId && item.ownerId === session.userId);
    if (!design) return false;
    session.work = design.work;
    session.designId = design.id;
    session.updatedAt = Date.now();
    return true;
  });
}

const printAreas: readonly PrintAreaId[] = ["front", "back", "wrap"];

export function saveAreaPrint(sessionId: string, area: string, bytes: Buffer) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return { error: "Nie znaleziono sesji" as const };
    const allowed = session.work.product === "mug" ? ["wrap"] : ["front", "back"];
    if (!printAreas.includes(area as PrintAreaId) || !allowed.includes(area)) {
      return { error: "Zła strefa" as const };
    }
    writePrintFile(sessionId, area as PrintAreaId, bytes);
    session.work.printFiles = listPrintFiles(session.id);
    session.updatedAt = Date.now();
    if (session.userId) touchDesign(store, session);
    const file = session.work.printFiles[area as PrintAreaId];
    if (!file) return { error: "Nie zapisano pliku" as const };
    return { file };
  });
}

export function clearPrints(sessionId: string) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    removePrints(sessionId);
    session.work.printFiles = {};
    session.updatedAt = Date.now();
    if (session.userId) touchDesign(store, session);
    return viewSession(session, store);
  });
}

/** Серверная правка проекта в обход sanitizeWork: так ставится wzór из витрины. */
export function replaceWork(sessionId: string, build: (work: WorkSnapshot) => WorkSnapshot) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const previous = session.work;
    session.work = build(previous);
    if (!samePages(previous.pages, session.work.pages)) removePrints(session.id);
    session.work.printFiles = listPrintFiles(session.id);
    session.updatedAt = Date.now();
    if (session.userId) touchDesign(store, session);
    else session.designId = null;
    return structuredClone(viewSession(session, store));
  });
}

export function deleteAccount(sessionId: string) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session?.userId) return { error: "Najpierw się zaloguj" as const };
    const userId = session.userId;
    store.users = store.users.filter((item) => item.id !== userId);
    store.designs = store.designs.filter((item) => item.ownerId !== userId);
    for (const item of store.sessions) {
      if (item.userId !== userId) continue;
      removePrints(item.id);
      item.userId = null;
      item.designId = null;
      item.oauth = null;
      item.work = initialWork();
      item.updatedAt = Date.now();
    }
    return { view: viewSession(session, store) };
  });
}
