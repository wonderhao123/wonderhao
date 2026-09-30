import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const compile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const dataUrl = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const content = dataUrl(compile("../lib/world/content.ts"));
const {
  createPass,
  collectDiveKit,
  parsePass,
  stampPass,
  cleanNickname,
  parseSettings,
  passNumber,
  emblemSeed,
} = await import(
  dataUrl(
    compile("../lib/world/pass.ts").replace(
      /(["'])\.\/content\1/,
      JSON.stringify(content),
    ),
  )
);
test("a new pass has a durable identity without personal information", () => {
  const a = createPass(),
    b = createPass();
  assert.notEqual(a.id, b.id);
  assert.equal(a.nickname, "");
  assert.equal(a.entered, false);
  assert.deepEqual(a.stamps, []);
  assert.deepEqual(parsePass(JSON.stringify(a)), a);
  assert.equal(passNumber(parsePass(JSON.stringify(a))), passNumber(a));
  assert.equal(emblemSeed(parsePass(JSON.stringify(a))), emblemSeed(a));
});
test("corrupt and incompatible storage never produces a broken pass", () => {
  for (const input of [
    null,
    "undefined",
    "{",
    "[]",
    "42",
    "null",
    JSON.stringify({ ...createPass(), version: 2 }),
    JSON.stringify({ ...createPass(), issuedAt: "no date" }),
    JSON.stringify({ ...createPass(), id: "broken" }),
    JSON.stringify({ ...createPass(), stamps: {} }),
  ])
    assert.equal(parsePass(input), null);
});
test("stamps are idempotent and unknown destinations are filtered at the boundary", () => {
  const p = createPass();
  const one = stampPass(p, "arrival");
  assert.equal(stampPass(one, "arrival"), one);
  const two = stampPass(one, "works");
  assert.deepEqual(two.stamps, ["arrival", "works"]);
  assert.deepEqual(p.stamps, []);
  assert.deepEqual(
    parsePass(
      JSON.stringify({
        ...two,
        stamps: ["arrival", "unknown", "arrival", {}, "works"],
      }),
    ).stamps,
    ["arrival", "works"],
  );
});
test("nickname handles Unicode and control characters without splitting code points", () => {
  assert.equal(cleanNickname("  Mira\n\u0000\u202e  "), "Mira");
  assert.equal(Array.from(cleanNickname("🌿".repeat(40))).length, 24);
  assert.equal(cleanNickname("李 小岛"), "李 小岛");
});
test("malformed settings use safe defaults and preserve explicit preferences", () => {
  assert.deepEqual(parseSettings("{"), {
    quality: "auto",
    dusk: false,
    reducedMotion: false,
    weather: "sunny",
  });
  assert.deepEqual(parseSettings("null"), {
    quality: "auto",
    dusk: false,
    reducedMotion: false,
    weather: "sunny",
  });
  assert.deepEqual(parseSettings('{"quality":"ultra","dusk":"true"}'), {
    quality: "auto",
    dusk: false,
    reducedMotion: false,
    weather: "sunny",
  });
  assert.deepEqual(
    parseSettings('{"quality":"low","dusk":true,"reducedMotion":true}'),
    { quality: "low", dusk: true, reducedMotion: true, weather:"sunny" },
  );
});

test("dive kit collection is idempotent and old passes keep their identity",()=>{
 const old=createPass(),collected=collectDiveKit(old);assert.equal(collected.id,old.id);assert.equal(collectDiveKit(collected),collected);assert.equal(parsePass(JSON.stringify(collected)).diveKit,collected.diveKit);assert.equal(parsePass(JSON.stringify({...collected,diveKit:"bad"})).diveKit,undefined);
});
