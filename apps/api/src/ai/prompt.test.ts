import test from "node:test";
import assert from "node:assert/strict";
import { buildSuggestionPrompt, nonMedicalNotice } from "./prompt.js";

test("prompt includes non-medical notice and JSON contract", () => {
  const prompt = buildSuggestionPrompt(
    {
      energy: 4,
      notes: "Felt overloaded"
    },
    []
  );

  assert.match(prompt, /Output JSON only/);
  assert.match(prompt, /non-medical support/);
  assert.match(prompt, /Current input/);
  assert.equal(
    nonMedicalNotice(),
    "This app is non-medical support built from lived experience. It is not medical advice, diagnosis, or treatment."
  );
});
