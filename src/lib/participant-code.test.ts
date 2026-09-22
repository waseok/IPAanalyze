import { describe, expect, it } from "vitest";
import {
  PARTICIPANT_CODE_LENGTH,
  formatParticipantCode,
  generateParticipantCode,
  hashParticipantCode,
  normalizeParticipantCode,
} from "./participant-code";

describe("participant code", () => {
  it("숫자 6자리 코드를 만든다", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateParticipantCode();
      expect(code).toHaveLength(PARTICIPANT_CODE_LENGTH);
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("공백·하이픈을 제거하고 숫자만 남긴다", () => {
    expect(normalizeParticipantCode("12-34 56")).toBe("123456");
    expect(formatParticipantCode("12-3456ab")).toBe("123456");
  });

  it("같은 코드는 같은 SHA-256 해시를 만든다", () => {
    expect(hashParticipantCode("123456")).toBe(hashParticipantCode("123-456"));
    expect(hashParticipantCode("123456")).toMatch(/^[a-f0-9]{64}$/);
  });
});
