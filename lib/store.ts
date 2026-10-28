import { randomBytes, randomInt } from "crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { initialWork, phoneDigits, sanitizeWork, workIsMeaningful, type WorkSnapshot } from "@/lib/work";

export type Challenge = {
  phoneDigits: string;
  phoneLabel: string;
  code: string;
  expiresAt: number;
  attempts: number;
};

export type UserRecord = {
  id: string;
  phoneDigits: string;
  phoneLabel: string;
  name: string;
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
  challenge: Challenge | null;
  updatedAt: number;
};

type Store = {
  users: UserRecord[];
  designs: DesignRecord[];
  sessions: SessionRecord[];
};

const filePath = path.join(process.cwd(), "data", "merch-store.json");

function emptyStore(): Store {
  return { users: [], designs: [], sessions: [] };
}

function readStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<Store>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      designs: Array.isArray(parsed.designs) ? parsed.designs : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
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
    challenge: null,
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
  store.sessions = keep;
}

function publicUser(user: UserRecord) {
  return { id: user.id, name: user.name, phone: user.phoneLabel };
}

function devCodeFor(session: SessionRecord) {
  if (process.env.NODE_ENV === "production") return null;
  if (!session.challenge || session.challenge.expiresAt <= Date.now()) return null;
  return session.challenge.code;
}

export function viewSession(session: SessionRecord, store: Store) {
  const user = session.userId ? store.users.find((item) => item.id === session.userId) : undefined;
  return {
    user: user ? publicUser(user) : null,
    work: session.work,
    designId: session.designId,
    devCode: devCodeFor(session),
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
    return { id: session.id, isNew, view: structuredClone(viewSession(session, store)) };
  });
}

export function saveWork(sessionId: string, input: unknown) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    session.work = sanitizeWork(input, Boolean(session.userId));
    session.updatedAt = Date.now();
    if (session.userId) touchDesign(store, session);
    else session.designId = null;
    return structuredClone(viewSession(session, store));
  });
}

export function requestCode(sessionId: string, phoneLabel: string) {
  const digits = phoneDigits(phoneLabel);
  if (digits.length < 9 || digits.length > 15) {
    return Promise.resolve({ error: "Podaj telefon" as const });
  }
  const code = randomInt(0, 10000).toString().padStart(4, "0");
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return { error: "Nie znaleziono sesji" as const };
    session.challenge = {
      phoneDigits: digits,
      phoneLabel: phoneLabel.trim(),
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
    session.updatedAt = Date.now();
    const known = store.users.find((item) => item.phoneDigits === digits);
    return {
      needsName: !known?.name,
      devCode: process.env.NODE_ENV === "production" ? null : code,
    };
  });
}

export function verifyCode(sessionId: string, phoneLabel: string, code: string, name: string) {
  const digits = phoneDigits(phoneLabel);
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session?.challenge) return { error: "Najpierw pobierz kod" as const };
    const challenge = session.challenge;
    if (challenge.expiresAt <= Date.now()) return { error: "Kod wygasł. Pobierz nowy" as const };
    if (challenge.phoneDigits !== digits) return { error: "Kod zamówiono na inny telefon" as const };
    challenge.attempts += 1;
    if (challenge.attempts > 5) return { error: "Za dużo prób. Pobierz nowy kod" as const };
    if (challenge.code !== code.trim()) return { error: "Kod nie pasuje" as const };

    let user = store.users.find((item) => item.phoneDigits === digits);
    const nextName = name.trim() || user?.name || "";
    if (!nextName) return { error: "Napisz, jak się do Ciebie zwracać" as const };
    if (!user) {
      user = { id: newId(), phoneDigits: digits, phoneLabel: challenge.phoneLabel, name: nextName };
      store.users.push(user);
    } else {
      user.name = nextName;
      user.phoneLabel = challenge.phoneLabel;
    }

    const guestWork = session.work;
    session.userId = user.id;
    session.challenge = null;
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
    session.updatedAt = Date.now();
    return { view: viewSession(session, store) };
  });
}

export function logoutSession(sessionId: string) {
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    session.userId = null;
    session.designId = null;
    session.work = initialWork();
    session.challenge = null;
    session.updatedAt = Date.now();
    return viewSession(session, store);
  });
}

export function renameUser(sessionId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) return Promise.resolve({ error: "Napisz, jak się do Ciebie zwracać" as const });
  return updateStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    const user = session?.userId ? store.users.find((item) => item.id === session.userId) : undefined;
    if (!session || !user) return { error: "Najpierw się zaloguj" as const };
    user.name = trimmed;
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
