import type { SupabaseClient } from "@supabase/supabase-js";

export type CoachSection = "today" | "money" | "career" | "goals" | "weekly" | "general";

export type JoyeRichContext = {
  profile: {
    displayName: string;
    primaryFocus: string;
    biggestChallenge: string;
    desiredOutcome: string;
    planningStyle: "gentle" | "balanced" | "direct";
    availableMinutes: number;
    energy: "low" | "medium" | "high";
    timezone: string;
  };
  goals: Array<{
    id: string;
    title: string;
    summary: string;
    goalType: string;
    trackingMode: string;
    progress: number;
    weeklyFrequency: number | null;
    dueDate: string | null;
    targetValue: number | null;
    currentValue: number | null;
    unit: string | null;
    successDefinition: string;
    openSteps: string[];
  }>;
  money: {
    grossMonthlyIncome: number;
    takeHomePaycheck: number;
    payFrequency: string;
    nextPayday: string | null;
    topPriority: string;
    bills: Array<{ name: string; amount: number; dueDate: string | null; essential: boolean; autopay: boolean }>;
    debts: Array<{ name: string; balance: number; minimumPayment: number; interestRate: number; creditLimit: number | null; dueDate: string | null }>;
    recentPayments: Array<{ name: string; amount: number; paidAt: string; dueDate: string }>;
  };
  career: {
    currentRole: string;
    targetRole: string;
    nextMilestone: string;
    planSummary: string;
    skillGaps: string[];
    openMilestones: string[];
    recentEvidence: string[];
  };
  weekly: {
    weekStart: string;
    outcomes: string[];
    guardrail: string;
    actions: Array<{ id: string; title: string; dayOfWeek: number | null; minutes: number; complete: boolean }>;
  };
  memories: Array<{ id: string; type: string; label: string; text: string; createdAt: string }>;
};

function mondayISO() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  now.setUTCDate(now.getUTCDate() - day + 1);
  return now.toISOString().slice(0, 10);
}

function textFromMemory(content: unknown) {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    const preferred = record.text ?? record.summary ?? record.message ?? record.title;
    if (typeof preferred === "string") return preferred;
    try { return JSON.stringify(content); } catch { return "Saved Joye memory"; }
  }
  return "Saved Joye memory";
}

export async function loadJoyeContext(supabase: SupabaseClient, userId: string, fallbackName = "Member"): Promise<JoyeRichContext> {
  const weekStart = mondayISO();
  const [
    profileResult,
    goalsResult,
    stepsResult,
    incomeResult,
    financialResult,
    billsResult,
    debtsResult,
    paymentsResult,
    careerResult,
    milestonesResult,
    evidenceResult,
    weeklyPlanResult,
    weeklyActionsResult,
    memoryResult,
  ] = await Promise.all([
    supabase.from("profiles").select("display_name,primary_focus,biggest_challenge,desired_outcome,planning_style,available_minutes,energy,timezone").eq("id", userId).maybeSingle(),
    supabase.from("goals").select("id,title,summary,goal_type,tracking_mode,progress,weekly_frequency,due_date,target_value,current_value,unit,success_definition,status").eq("user_id", userId).eq("status", "active").order("priority").limit(8),
    supabase.from("goal_steps").select("goal_id,title,completed_at").eq("user_id", userId).is("completed_at", null).limit(30),
    supabase.from("income_profiles").select("gross_monthly_income,take_home_paycheck,pay_frequency,next_payday").eq("user_id", userId).maybeSingle(),
    supabase.from("financial_profiles").select("top_priority").eq("user_id", userId).maybeSingle(),
    supabase.from("recurring_bills").select("name,amount,due_date,essential,autopay").eq("user_id", userId).order("due_date", { ascending: true, nullsFirst: false }).limit(30),
    supabase.from("debts").select("name,balance,minimum_payment,interest_rate,credit_limit,due_date").eq("user_id", userId).order("interest_rate", { ascending: false }).limit(20),
    supabase.from("payment_records").select("name,amount,paid_at,due_date").eq("user_id", userId).order("paid_at", { ascending: false }).limit(12),
    supabase.from("career_plans").select("current_role,target_role,next_milestone,plan_summary,skill_gaps").eq("user_id", userId).maybeSingle(),
    supabase.from("career_milestones").select("title,status").eq("user_id", userId).neq("status", "completed").order("target_date", { ascending: true, nullsFirst: false }).limit(8),
    supabase.from("career_evidence").select("title,result").eq("user_id", userId).order("happened_on", { ascending: false, nullsFirst: false }).limit(6),
    supabase.from("weekly_plans").select("most_important_result,progress_result,relief_result,guardrail").eq("user_id", userId).eq("week_start", weekStart).maybeSingle(),
    supabase.from("weekly_actions").select("id,title,day_of_week,minutes,completed_at").eq("user_id", userId).eq("week_start", weekStart).order("day_of_week", { ascending: true }).limit(30),
    supabase.from("joye_memory").select("id,memory_type,content,created_at,label").eq("user_id", userId).order("importance", { ascending: false }).order("created_at", { ascending: false }).limit(12),
  ]);

  const profile = profileResult.data;
  const steps = stepsResult.data ?? [];
  const career = careerResult.data;
  const plan = weeklyPlanResult.data;

  return {
    profile: {
      displayName: profile?.display_name?.trim() || fallbackName,
      primaryFocus: profile?.primary_focus || "Build steady progress",
      biggestChallenge: profile?.biggest_challenge || "Not added yet",
      desiredOutcome: profile?.desired_outcome || "Not added yet",
      planningStyle: (profile?.planning_style || "balanced") as "gentle" | "balanced" | "direct",
      availableMinutes: Number(profile?.available_minutes ?? 30),
      energy: (profile?.energy || "medium") as "low" | "medium" | "high",
      timezone: profile?.timezone || "America/New_York",
    },
    goals: (goalsResult.data ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      summary: goal.summary || "",
      goalType: goal.goal_type || "personal",
      trackingMode: goal.tracking_mode || "milestones",
      progress: Number(goal.progress || 0),
      weeklyFrequency: goal.weekly_frequency == null ? null : Number(goal.weekly_frequency),
      dueDate: goal.due_date || null,
      targetValue: goal.target_value == null ? null : Number(goal.target_value),
      currentValue: goal.current_value == null ? null : Number(goal.current_value),
      unit: goal.unit || null,
      successDefinition: goal.success_definition || "",
      openSteps: steps.filter((step) => step.goal_id === goal.id).map((step) => step.title).slice(0, 5),
    })),
    money: {
      grossMonthlyIncome: Number(incomeResult.data?.gross_monthly_income || 0),
      takeHomePaycheck: Number(incomeResult.data?.take_home_paycheck || 0),
      payFrequency: incomeResult.data?.pay_frequency || "not set",
      nextPayday: incomeResult.data?.next_payday || null,
      topPriority: financialResult.data?.top_priority || "Not added yet",
      bills: (billsResult.data ?? []).map((bill) => ({
        name: bill.name,
        amount: Number(bill.amount || 0),
        dueDate: bill.due_date || null,
        essential: Boolean(bill.essential),
        autopay: Boolean(bill.autopay),
      })),
      debts: (debtsResult.data ?? []).map((debt) => ({
        name: debt.name,
        balance: Number(debt.balance || 0),
        minimumPayment: Number(debt.minimum_payment || 0),
        interestRate: Number(debt.interest_rate || 0),
        creditLimit: debt.credit_limit == null ? null : Number(debt.credit_limit),
        dueDate: debt.due_date || null,
      })),
      recentPayments: (paymentsResult.data ?? []).map((payment) => ({
        name: payment.name,
        amount: Number(payment.amount || 0),
        paidAt: payment.paid_at,
        dueDate: payment.due_date,
      })),
    },
    career: {
      currentRole: career?.current_role || "Not added yet",
      targetRole: career?.target_role || "Not added yet",
      nextMilestone: career?.next_milestone || "Not added yet",
      planSummary: career?.plan_summary || "",
      skillGaps: Array.isArray(career?.skill_gaps) ? career.skill_gaps : [],
      openMilestones: (milestonesResult.data ?? []).map((item) => item.title),
      recentEvidence: (evidenceResult.data ?? []).map((item) => item.result ? `${item.title}: ${item.result}` : item.title),
    },
    weekly: {
      weekStart,
      outcomes: [plan?.most_important_result, plan?.progress_result, plan?.relief_result].filter((item): item is string => Boolean(item)),
      guardrail: plan?.guardrail || "",
      actions: (weeklyActionsResult.data ?? []).map((action) => ({
        id: action.id,
        title: action.title,
        dayOfWeek: action.day_of_week == null ? null : Number(action.day_of_week),
        minutes: Number(action.minutes || 30),
        complete: Boolean(action.completed_at),
      })),
    },
    memories: (memoryResult.data ?? []).map((memory) => ({
      id: memory.id,
      type: memory.memory_type,
      label: memory.label || memory.memory_type.replaceAll("_", " "),
      text: textFromMemory(memory.content),
      createdAt: memory.created_at,
    })),
  };
}

export function contextForPrompt(context: JoyeRichContext, section: CoachSection) {
  const common = {
    profile: context.profile,
    activeGoals: context.goals,
    currentWeek: context.weekly,
    savedMemories: context.memories.slice(0, 8),
  };
  if (section === "money") return { ...common, money: context.money };
  if (section === "career") return { ...common, career: context.career };
  if (section === "goals") return { ...common, goals: context.goals };
  if (section === "weekly") return { ...common, career: context.career, moneyPriority: context.money.topPriority };
  return { ...common, money: context.money, career: context.career };
}
