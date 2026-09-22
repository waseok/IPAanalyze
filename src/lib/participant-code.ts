import { createHash, randomInt } from "node:crypto";

/** 참여코드: 숫자 6자리만 (입력·안내 단순화) */
export const PARTICIPANT_CODE_LENGTH = 6;

export function normalizeParticipantCode(value: string) {
  return value.replace(/\D/g, "").slice(0, PARTICIPANT_CODE_LENGTH);
}

export function generateParticipantCode() {
  return String(randomInt(0, 1_000_000)).padStart(PARTICIPANT_CODE_LENGTH, "0");
}

export function hashParticipantCode(code: string) {
  return createHash("sha256").update(normalizeParticipantCode(code), "utf8").digest("hex");
}

export function formatParticipantCode(code: string) {
  return normalizeParticipantCode(code);
}
