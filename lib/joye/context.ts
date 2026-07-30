import type { UserContext } from "@/types/database";

export type Signal = { id: string; kind: "attention" | "opportunity" | "progress"; title: string; detail: string; weight: number };
export type Recommendation = { title: string; reason: string; actionLabel: string; taskId?: string; confidence: "low" | "medium" | "high" };

function daysUntil(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function buildSignals(context: UserContext): Signal[] {
  const signals: Signal[] = [];
  const overdue = context.tasks.filter((task) => !task.completed && daysUntil(task.dueDate) < 0);
  if (overdue.length) signals.push({ id: "overdue", kind: "attention", title: `${overdue.length} overdue ${overdue.length === 1 ? "item" : "items"}`, detail: "Clear or reschedule these before adding more commitments.", weight: 100 });

  const nearGoal = context.goals.filter((goal) => goal.progress >= 75 && goal.progress < 100).sort((a,b) => b.progress-a.progress)[0];
  if (nearGoal) signals.push({ id: `goal-${nearGoal.id}`, kind: "opportunity", title: `${nearGoal.title} is within reach`, detail: `You are ${nearGoal.progress}% complete. A focused step could create a meaningful win.`, weight: 78 });

  if ((context.money.availableMargin ?? 0) < 0) signals.push({ id: "money-gap", kind: "attention", title: "Your current money plan is overallocated", detail: "Reduce a flexible category before committing additional money.", weight: 92 });
  if (context.career.nextMilestone) signals.push({ id: "career", kind: "opportunity", title: "Your career plan has a clear next step", detail: context.career.nextMilestone, weight: 65 });

  const completed = context.tasks.filter((task) => task.completed).length;
  if (completed) signals.push({ id: "wins", kind: "progress", title: `${completed} completed ${completed === 1 ? "action" : "actions"}`, detail: "Your plan is moving. Keep the next step realistic.", weight: 45 });
  return signals.sort((a,b) => b.weight-a.weight).slice(0,4);
}

export function chooseNextMove(context: UserContext): Recommendation {
  const viable = context.tasks
    .filter((task) => !task.completed && task.minutes <= context.availableMinutes)
    .map((task) => ({ ...task, score: task.priority * 20 + (daysUntil(task.dueDate) <= 2 ? 35 : 0) + (context.energy === "high" ? 10 : task.minutes <= 30 ? 12 : 0) }))
    .sort((a,b) => b.score-a.score);

  if (viable[0]) return { title: viable[0].title, reason: `It fits your ${context.availableMinutes}-minute window and ranks highest against urgency and impact.`, actionLabel: "Start this next", taskId: viable[0].id, confidence: "high" };
  if (context.tasks.some((task) => !task.completed)) return { title: "Make one task smaller", reason: "Your open tasks do not fit the time you have today. Reduce one to a first step you can finish.", actionLabel: "Break down a task", confidence: "medium" };
  return { title: "Choose one meaningful outcome", reason: "Joye Life needs one concrete commitment before it can rank your next move.", actionLabel: "Create today’s focus", confidence: "medium" };
}

export function createDailyBrief(context: UserContext) {
  const signals = buildSignals(context);
  const recommendation = chooseNextMove(context);
  const attention = signals.find((signal) => signal.kind === "attention");
  return {
    greeting: `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}${context.displayName ? `, ${context.displayName}` : ""}.`,
    summary: attention ? `${attention.title} needs attention, but your next move is still manageable.` : "Your plan is clear enough to make progress without overloading the day.",
    signals,
    recommendation,
  };
}
