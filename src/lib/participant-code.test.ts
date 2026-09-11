import { describe, expect, it } from "vitest";
import {
  PARTICIPANT_CODE_LENGTH,
  formatParticipantCode,
  generateParticipantCode,
  hashParticipantCode,
  normalizeParticipantCode,
} from "./participant-code";

describe("participant code", () => {
  it("혼동 문자를 제외한 10자리 코드를 만든다", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateParticipantCode();
      expect(code).toHaveLength(PARTICIPANT_CODE_LENGTH);
      expect(code).toMatch(/^[2-9A-HJKMNP-Z]{10}$/);
    }
  });

  it("공백과 하이픈을 제거하고 대문자로 정규화한다", () => {
    expect(normalizeParticipantCode("ab234-cd567")).toBe("AB234CD567");
    expect(formatParticipantCode("ab234cd567")).toBe("AB234-CD567");
  });

  it("같은 코드는 같은 SHA-256 해시를 만든다", () => {
    expect(hashParticipantCode("AB234-CD567")).toBe(hashParticipantCode("ab234cd567"));
    expect(hashParticipantCode("AB234-CD567")).toMatch(/^[a-f0-9]{64}$/);
  });
});
