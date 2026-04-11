import { useJob } from "@/lib/job-context";
import { StepIndicator } from "./StepIndicator";

type Props = {
  current: 1 | 2 | 3 | 4;
};

/**
 * Reads the job context to figure out which steps are done,
 * then renders the StepIndicator.
 */
export function CompletionIndicator({ current }: Props) {
  const { jobFitResult, positioningResult, coverLetterResult, networkingResult } =
    useJob();

  const completed: (1 | 2 | 3 | 4)[] = [];
  if (jobFitResult) completed.push(1);
  if (positioningResult) completed.push(2);
  if (coverLetterResult) completed.push(3);
  if (networkingResult) completed.push(4);

  return <StepIndicator current={current} completed={completed} />;
}
