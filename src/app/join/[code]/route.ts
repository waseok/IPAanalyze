import { NextResponse, type NextRequest } from "next/server";
import { getParticipantSurvey, PARTICIPANT_COOKIE } from "@/lib/campaign-survey";
import { normalizeParticipantCode } from "@/lib/participant-code";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const normalized = normalizeParticipantCode(code);
  const survey = await getParticipantSurvey(normalized);
  if (!survey) return NextResponse.redirect(new URL("/?error=invalid-code", request.url));

  const response = NextResponse.redirect(new URL(`/survey/${survey.campaignId}`, request.url));
  const maxAge = survey.closesAt
    ? Math.max(60, Math.floor((new Date(survey.closesAt).getTime() - Date.now()) / 1000))
    : 60 * 60 * 24 * 30;
  response.cookies.set(PARTICIPANT_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high",
  });
  return response;
}
