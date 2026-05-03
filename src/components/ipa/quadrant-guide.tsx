import { QUADRANT_GUIDES, QUADRANT_THEME, type QuadrantKey } from "@/lib/constants";
import type { IpaResult } from "@/lib/ipa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  data: IpaResult;
};

const ORDER: QuadrantKey[] = ["Q1", "Q2", "Q3", "Q4"];

export function QuadrantGuide({ data }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ORDER.map((key) => {
        const meta = QUADRANT_GUIDES[key];
        const theme = QUADRANT_THEME[key];
        const list = data.quadrants[key];
        return (
          <Card
            key={key}
            className={cn("overflow-hidden border-2 shadow-sm transition-shadow", theme.cardBg, theme.cardBorder)}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                    theme.badge,
                  )}
                >
                  {key}
                </span>
                <span>{meta.name}</span>
              </CardTitle>
              <CardDescription className="text-foreground/80">{meta.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
              <ul className="space-y-2 border-t border-border/60 pt-3 text-sm">
                {list.length === 0 ? (
                  <li className="text-muted-foreground">해당 분면의 업무가 없습니다.</li>
                ) : (
                  list.map((item) => (
                    <li key={item.taskId} className="rounded-md bg-background/60 px-2 py-1.5 ring-1 ring-border/50">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        중요도 평균 {item.avgImportance.toFixed(2)} · 수행도 평균 {item.avgPerformance.toFixed(2)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
