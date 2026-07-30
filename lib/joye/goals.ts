export type GoalKind = "habit" | "financial" | "career" | "project" | "learning" | "health" | "personal";

export function inferGoalKind(text: string): GoalKind {
  const value = text.toLowerCase();
  if (/save|debt|pay off|money|budget|emergency fund|dollar|\$/.test(value)) return "financial";
  if (/job|career|promotion|promoted|certification|resume|interview|salary/.test(value)) return "career";
  if (/gym|workout|exercise|run|sleep|weight|health|meal|water/.test(value)) return "health";
  if (/learn|study|read|course|class|language|practice/.test(value)) return "learning";
  if (/build|launch|finish|complete|create|renovate|project/.test(value)) return "project";
  if (/more|less|every day|daily|weekly|routine|consistent|habit/.test(value)) return "habit";
  return "personal";
}

export function goalTypeLabel(kind: GoalKind) {
  return ({ habit: "Routine", financial: "Money", career: "Career", project: "Project", learning: "Learning", health: "Health", personal: "Personal" } as const)[kind];
}

export function buildGoalPlan(input: {
  rawGoal: string;
  kind: GoalKind;
  motivation?: string;
  obstacle?: string;
  frequency?: number | null;
  targetValue?: number | null;
  unit?: string | null;
  targetDate?: string | null;
}) {
  const raw = input.rawGoal.trim().replace(/[.!?]+$/, "");
  const frequency = input.frequency && input.frequency > 0 ? input.frequency : 3;
  const title = input.kind === "health" && /gym|workout|exercise/i.test(raw)
    ? "Build a consistent workout routine"
    : input.kind === "habit"
      ? `Build consistency with ${raw.toLowerCase()}`
      : raw.charAt(0).toUpperCase() + raw.slice(1);

  const trackingMode = ["health", "habit", "learning"].includes(input.kind) ? "frequency" : input.targetValue ? "number" : "milestones";
  const summaryParts = [
    input.motivation ? `This matters because ${input.motivation.trim().replace(/[.!?]+$/, "").toLowerCase()}.` : null,
    input.obstacle ? `The plan should account for ${input.obstacle.trim().replace(/[.!?]+$/, "").toLowerCase()}.` : null,
  ].filter(Boolean);

  let successDefinition = "Make visible progress each week and review what needs to change.";
  let firstStep = `Choose one small action you can complete this week toward “${title}.”`;
  let cadence: number | null = null;

  if (trackingMode === "frequency") {
    cadence = frequency;
    successDefinition = `Complete this activity ${frequency} times per week consistently.`;
    firstStep = `Choose the ${frequency} days or time blocks you are most likely to follow through.`;
  } else if (input.kind === "financial" && input.targetValue) {
    successDefinition = `Reach ${input.unit === "dollars" || !input.unit ? "$" : ""}${input.targetValue.toLocaleString()}${input.unit && input.unit !== "dollars" ? ` ${input.unit}` : ""}.`;
    firstStep = "Decide the amount to set aside from the next paycheck.";
  } else if (input.kind === "career") {
    successDefinition = "Complete the skill, proof, and application milestones needed for the next career move.";
    firstStep = "Identify the single biggest gap between your current position and the outcome you want.";
  } else if (input.kind === "project") {
    successDefinition = "Finish the project through a short sequence of concrete milestones.";
    firstStep = "Define the smallest deliverable that proves the project has started.";
  }

  return {
    title,
    summary: summaryParts.join(" ") || `Joye created a flexible plan from: “${raw}.”`,
    trackingMode,
    cadence,
    successDefinition,
    firstStep,
  };
}
