import assert from "node:assert/strict";
import test from "node:test";
import { accentById, defaultAccent } from "../components/variants/accents.ts";

test("акцент плаката по умолчанию — кобальт #2F5BFF, не индиго", () => {
  assert.equal(defaultAccent, "kobalt");
  const kobalt = accentById("kobalt");
  assert.equal(kobalt.cta, "#2F5BFF");
  assert.equal(kobalt.ctaDark, "#2F5BFF");
  assert.notEqual(kobalt.cta.toLowerCase(), "#4f46e5");
  assert.notEqual(kobalt.cta.toLowerCase(), "#e23b2f");
});
