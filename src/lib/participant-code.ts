import { createHash, randomInt } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const PARTICIPANT_CODE_LENGTH = 10;

export function normalizeParticipantCode(value: string) {
  return value.toUpperCase().replace(/[^2-9A-HJKMNP-Z]/g, "").slice(0, PARTICIPANT_CODE_LENGTH);
}

export function generateParticipantCode() {
  let code = "";
  for (let i = 0; i < PARTICIPANT_CODE_LENGTH; i += 1) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

export function hashParticipantCode(code: string) {
  return createHash("sha256").update(normalizeParticipantCode(code), "utf8").digest("hex");
}

export function formatParticipantCode(code: string) {
  const normalized = normalizeParticipantCode(code);
  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
}
