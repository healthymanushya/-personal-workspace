import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  supportingText,
  tone = "default",
  progress,
}: {
  label: string;
  value: number | string;
  supportingText?: string;
  tone?: "default" | "destructive" | "success" | "primary";
  progress?: number;
}) {
  const toneClass: Record<string, string> = {
    default: "text-foreground",
    destructive: "text-destructive",
    success: "text-success",
    primary: "text-primary",
  };

  return (
    <div className="glass-subtle flex flex-col gap-2 rounded-xl px-4 py-4 text-sm text-card-foreground">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("-mt-0.5 text-2xl font-semibold tabular-nums", toneClass[tone])}>{value}</p>
      {supportingText && <p className="-mt-1 text-xs text-muted-foreground">{supportingText}</p>}
      {progress != null && <Progress value={progress} className="mt-1 h-1" />}
    </div>
  );
}
