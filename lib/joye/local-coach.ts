import type { CoachSection, JoyeRichContext } from "@/lib/joye/load-context";

export type CoachReply = {
  answer: string;
  suggestedActions: string[];
  usedContext: string[];
};

export type CoachIntent =
  | "home"
  | "fitness"
  | "nutrition"
  | "mealprep"
  | "sleep"
  | "stress"
  | "debt"
  | "purchase"
  | "budget"
  | "career"
  | "goals"
  | "weekly"
  | "focus"
  | "unknown";

const STOP_WORDS = new Set([
  "a", "about", "am", "an", "and", "are", "at", "be", "can", "do", "for", "get", "how", "i", "in", "is", "it", "me", "more", "my", "of", "on", "should", "the", "this", "to", "what", "with", "would", "could", "help",
]);

const WORD_ALIASES: Record<string, string> = {
  workouts: "workout",
  workout: "workout",
  exercising: "exercise",
  exercises: "exercise",
  trained: "training",
  trains: "training",
  lifting: "lift",
  lifts: "lift",
  proteins: "protein",
  calories: "calorie",
  macros: "macro",
  meals: "meal",
  groceries: "grocery",
  jobs: "job",
  applications: "application",
  bills: "bill",
  debts: "debt",
  goals: "goal",
  habits: "habit",
};

function normalizeWord(word: string) {
  return WORD_ALIASES[word] || word;
}

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9$]+/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function includesAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function editDistance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

function hasApproximateWord(value: string, targets: string[]) {
  const tokens = words(value);
  return tokens.some((token) => targets.some((target) => {
    if (token === target) return true;
    if (Math.min(token.length, target.length) < 2 || Math.max(token.length, target.length) > 9) return false;
    return editDistance(token, target) <= 1;
  }));
}

function detectIntent(question: string): CoachIntent {
  const value = question.toLowerCase();

  if (includesAny(value, [/\bhouse\b/, /\bhome\b/, /mortgage/, /down payment/, /first[- ]time buyer/])) return "home";
  if (includesAny(value, [/meal\s*prep/, /prep(?:ping)?\s+(?:my\s+)?meal/, /batch cook/, /grocery list/, /cook for the week/, /food prep/])) return "mealprep";
  if (includesAny(value, [/protein/, /protien/, /macro/, /calorie/, /nutrition/, /diet/, /eat healthier/, /healthy eating/, /meal plan/])) return "nutrition";
  if (includesAny(value, [/\bgym\b/, /workout/, /exercise/, /fitness/, /training/, /run(?:ning)?/, /\blift(?:ing)?\b/, /weight loss/, /lose weight/]) || hasApproximateWord(value, ["gym"])) return "fitness";
  if (includesAny(value, [/sleep/, /bedtime/, /insomnia/, /wake up/, /tired all the time/])) return "sleep";
  if (includesAny(value, [/stress/, /overwhelm/, /burnout/, /anxious/, /too much going on/])) return "stress";
  if (includesAny(value, [/\bdebt\b/, /credit card/, /interest rate/, /pay off/, /payoff/, /minimum payment/])) return "debt";
  if (includesAny(value, [/resume/, /interview/, /promotion/, /career/, /\bjob\b/, /salary/, /certification/, /skill gap/, /application/])) return "career";
  if (includesAny(value, [/rearrange/, /schedule/, /this week/, /weekly plan/, /plan my week/, /too much this week/])) return "weekly";
  if (includesAny(value, [/afford/, /purchase/, /\bbuy\b/, /spend/, /\bcost\b/])) return "purchase";
  if (includesAny(value, [/budget/, /paycheck/, /\bbill\b/, /saving/, /save money/, /emergency fund/, /\bmoney\b/])) return "budget";
  if (includesAny(value, [/focus/, /priority/, /today/, /next move/, /overlooking/, /most impact/])) return "focus";
  if (includesAny(value, [/\bgoal\b/, /\bhabit\b/, /consistent/, /consistency/, /stay on track/, /motivation/])) return "goals";
  return "unknown";
}

export function inferCoachIntent(section: CoachSection, question: string, priorUserMessages: string[] = []): CoachIntent {
  const direct = detectIntent(question);
  if (direct !== "unknown") return direct;

  const compactFollowUp = words(question).length <= 7 || /\b(it|that|those|this|weekends?|instead|also)\b/i.test(question);
  if (compactFollowUp) {
    for (const previous of [...priorUserMessages].reverse().slice(0, 3)) {
      const inherited = detectIntent(previous);
      if (inherited !== "unknown") return inherited;
    }
  }

  if (section === "money") return "budget";
  if (section === "career") return "career";
  if (section === "goals") return "goals";
  if (section === "weekly") return "weekly";
  if (section === "today") return "focus";
  return "unknown";
}

function estimatedMonthlyTakeHome(context: JoyeRichContext) {
  const paycheck = context.money.takeHomePaycheck;
  if (!paycheck) return 0;
  const periods = context.money.payFrequency === "weekly"
    ? 4.333
    : context.money.payFrequency === "semimonthly"
      ? 2
      : context.money.payFrequency === "monthly"
        ? 1
        : 2.167;
  return paycheck * periods;
}

function moneySnapshot(context: JoyeRichContext) {
  return {
    totalDebt: context.money.debts.reduce((sum, debt) => sum + debt.balance, 0),
    minimums: context.money.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    savedBills: context.money.bills.reduce((sum, bill) => sum + bill.amount, 0),
    essentialBills: context.money.bills.filter((bill) => bill.essential).reduce((sum, bill) => sum + bill.amount, 0),
    monthlyTakeHome: estimatedMonthlyTakeHome(context),
  };
}

function findRelevantGoal(
  context: JoyeRichContext,
  question: string,
  domainTerms: string[] = [],
  preferredTypes: string[] = [],
) {
  const queryWords = new Set([...words(question), ...domainTerms.map(normalizeWord)]);
  const ranked = context.goals
    .map((goal) => {
      const goalWords = words(`${goal.title} ${goal.summary} ${goal.successDefinition} ${goal.openSteps.join(" ")}`);
      const overlapWords = goalWords.filter((word) => queryWords.has(word));
      const overlapScore = new Set(overlapWords).size * 3;
      const phraseScore = question.length > 4 && `${goal.title} ${goal.summary}`.toLowerCase().includes(question.toLowerCase()) ? 5 : 0;
      const typeScore = overlapScore > 0 && preferredTypes.includes(goal.goalType) ? 1 : 0;
      return { goal, score: overlapScore + phraseScore + typeScore };
    })
    .sort((a, b) => b.score - a.score || b.goal.progress - a.goal.progress);

  return ranked[0] && ranked[0].score >= 3 ? ranked[0].goal : null;
}

function matchingMemory(context: JoyeRichContext, terms: string[]) {
  const normalizedTerms = terms.map((term) => term.toLowerCase());
  return context.memories.find((memory) => {
    const value = `${memory.label} ${memory.text}`.toLowerCase();
    return normalizedTerms.some((term) => value.includes(term));
  });
}

function homeReply(context: JoyeRichContext): CoachReply {
  const snapshot = moneySnapshot(context);
  const homeGoal = findRelevantGoal(context, "buy a house home down payment mortgage", ["house", "home", "mortgage", "saving"], ["financial", "personal"]);
  const facts: string[] = [];

  if (snapshot.monthlyTakeHome > 0) facts.push(`estimated monthly take-home of about ${currency(snapshot.monthlyTakeHome)}`);
  if (snapshot.totalDebt > 0) facts.push(`${currency(snapshot.totalDebt)} in saved debt`);
  if (snapshot.minimums > 0) facts.push(`${currency(snapshot.minimums)} in saved debt minimums`);

  const known = facts.length ? `Joye currently sees ${joinNaturally(facts)}.` : "Joye does not yet have enough saved income and debt information to estimate a home-buying timeline.";
  const goalLine = homeGoal
    ? `Your related goal is “${homeGoal.title}.” ${homeGoal.openSteps[0] ? `The next saved step is “${homeGoal.openSteps[0]}.”` : "It needs a concrete savings step."}`
    : "You do not have a dedicated home-buying goal yet.";

  return {
    answer: `Buying a house needs its own money plan. ${known} ${goalLine}\n\nStart by defining the price range, cash already saved, and the monthly payment you could carry without sacrificing bills, debt minimums, or an emergency buffer. Joye should not guess affordability until those pieces are saved.\n\nOne question to answer next: how much money do you currently have set aside for the down payment, closing costs, and moving expenses?`,
    suggestedActions: [
      homeGoal?.openSteps[0] || "Create a home-buying goal in Goals",
      "Add current home savings and a target price range",
      "Use Money to protect bills, minimums, and an emergency buffer first",
    ],
    usedContext: ["Saved income and pay frequency", "Debt balances and minimums", "Related goals"],
  };
}

function fitnessReply(context: JoyeRichContext, question: string): CoachReply {
  const goal = findRelevantGoal(
    context,
    question,
    ["gym", "workout", "exercise", "fitness", "training", "routine"],
    ["health", "habit"],
  );
  const frequency = goal?.weeklyFrequency;
  const firstStep = goal?.openSteps[0];
  const time = Math.max(15, context.profile.availableMinutes || 30);

  return {
    answer: goal
      ? `For “${goal.title},” the biggest win is making the routine easier to repeat. ${frequency ? `Your saved target is ${frequency} sessions per week.` : "Choose a realistic weekly frequency before worrying about a long streak."} Use fixed days or time blocks, and make the minimum version small enough to complete on a low-motivation day—about ${Math.min(time, 30)} minutes based on your saved availability. ${firstStep ? `Your next saved step is “${firstStep}.”` : "The next step is to choose the exact days you will train."}`
      : `To become more consistent with the gym, reduce the number of decisions required on training days. Pick specific days, define a minimum workout you can finish in about ${Math.min(time, 30)} minutes, prepare your clothes or gym bag ahead of time, and track attendance rather than judging every session. Joye does not see a clearly matching fitness goal yet, so it will not pretend another goal is related.`,
    suggestedActions: [
      firstStep || "Create a fitness goal and choose realistic training days",
      `Define a ${Math.min(time, 30)}-minute minimum workout for busy days`,
      "Use I did this today after every completed session",
    ],
    usedContext: ["Matching fitness goal", "Weekly frequency", "Available time"],
  };
}

function nutritionReply(context: JoyeRichContext, question: string): CoachReply {
  const goal = findRelevantGoal(
    context,
    question,
    ["protein", "nutrition", "macro", "calorie", "meal", "diet", "food"],
    ["health", "habit"],
  );
  const preference = matchingMemory(context, ["protein", "food", "diet", "meal", "allergy", "dislike"]);
  const target = goal?.targetValue != null
    ? `${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ""}`
    : null;
  const available = Math.max(15, context.profile.availableMinutes || 30);

  const targetLine = target
    ? `Your saved target is ${target}.`
    : "Joye does not see a saved daily protein target, so it should not invent one.";
  const goalLine = goal ? `The closest saved goal is “${goal.title}.”` : "There is no clearly matching nutrition goal yet.";
  const preferenceLine = preference ? `A saved preference that may matter is: “${preference.text}.”` : "No food preferences or restrictions are saved yet.";

  const followUp = target
    ? "One detail Joye still needs for a truly personalized plan: which protein foods do you actually enjoy, and across how many meals do you want to spread the target?"
    : "Two details Joye still needs for a truly personalized plan: what daily target are you using, and which protein foods do you actually enjoy?";

  return {
    answer: `${targetLine} ${goalLine} ${preferenceLine}\n\nThe simplest way to hit a protein goal is to divide it across the meals you already eat instead of trying to recover at night. Choose 3–4 repeatable protein anchors, decide the amount each meal needs to contribute, and keep one quick backup available for busy days. A ${Math.min(available, 30)}-minute prep block is enough to prepare several portions of one protein source.\n\n${followUp}`,
    suggestedActions: [
      target ? `Split ${target} across your normal meals` : "Save your daily protein target in a nutrition goal",
      "Choose three repeatable protein anchors",
      "Add one quick backup option for busy days",
    ],
    usedContext: ["Matching nutrition goal", "Saved target and unit", "Food preferences", "Available time"],
  };
}

function mealPrepReply(context: JoyeRichContext, question: string): CoachReply {
  const goal = findRelevantGoal(
    context,
    question,
    ["meal", "prep", "protein", "nutrition", "food", "cook"],
    ["health", "habit"],
  );
  const preference = matchingMemory(context, ["food", "meal", "diet", "allergy", "dislike", "protein"]);
  const time = Math.max(15, context.profile.availableMinutes || 30);
  const goalLine = goal ? `This can support your saved goal “${goal.title}.”` : "Joye does not see a clearly matching meal or nutrition goal yet.";
  const preferenceLine = preference ? `I also see this saved preference: “${preference.text}.”` : "Your preferred foods and restrictions are not saved yet.";

  return {
    answer: `${goalLine} ${preferenceLine}\n\nFor a beta plan, keep meal prep small: choose two meals you will actually repeat, one main protein for each, one easy carbohydrate or wrap, and one vegetable or fruit. Cook enough for the next 2–3 days rather than forcing an entire week. With your saved ${time}-minute planning capacity, start by choosing the meals and building the grocery list; the cooking block can be scheduled separately.\n\nTo make this personalized, answer one thing next: how many people and how many lunches or dinners are you preparing?`,
    suggestedActions: [
      "Choose two meals for the next 2–3 days",
      "Build one grocery list around those meals",
      "Schedule a separate cooking block in Weekly",
    ],
    usedContext: ["Related health goal", "Saved food preferences", "Available time"],
  };
}

function sleepReply(context: JoyeRichContext, question: string): CoachReply {
  const goal = findRelevantGoal(context, question, ["sleep", "bedtime", "rest", "routine"], ["health", "habit"]);
  const time = Math.max(10, Math.min(context.profile.availableMinutes || 30, 30));
  return {
    answer: goal
      ? `For “${goal.title},” focus on a repeatable wind-down cue rather than trying to force sleep. Pick a consistent start time, reduce one source of stimulation, and use a ${time}-minute wind-down routine. If sleep problems are persistent, severe, or affecting safety, discuss them with a healthcare professional.`
      : `Joye does not see a matching sleep goal. Start with one repeatable cue: a consistent wind-down time, fewer screens or stimulating tasks immediately before bed, and a ${time}-minute routine. Persistent or severe sleep problems deserve medical guidance rather than an app guess.`,
    suggestedActions: ["Choose a wind-down start time", `Create a ${time}-minute bedtime routine`, "Track whether the routine happened, not whether sleep was perfect"],
    usedContext: ["Matching sleep goal", "Available time"],
  };
}

function stressReply(context: JoyeRichContext): CoachReply {
  const open = context.weekly.actions.filter((action) => !action.complete);
  const smallest = [...open].sort((a, b) => a.minutes - b.minutes)[0];
  return {
    answer: `Your saved energy is ${context.profile.energy}, with about ${context.profile.availableMinutes} minutes available. When the plan feels overwhelming, reduce the number of active decisions. ${smallest ? `The smallest open action is “${smallest.title}” at ${smallest.minutes} minutes.` : "There is no open weekly action to simplify yet."} Choose one must-do item, delay one low-impact item, and leave room to recover. If stress feels unmanageable or unsafe, reach out to an appropriate professional or someone you trust.`,
    suggestedActions: [smallest?.title || "Choose one small must-do action", "Move one low-impact item out of this week", "Protect one recovery block"],
    usedContext: ["Energy", "Available time", "Weekly actions"],
  };
}

function debtReply(context: JoyeRichContext): CoachReply {
  const snapshot = moneySnapshot(context);
  const nextDebt = [...context.money.debts].sort((a, b) => b.interestRate - a.interestRate)[0];

  if (!context.money.debts.length) {
    return {
      answer: "Joye does not see any active debts saved, so it cannot recommend a payoff order yet. Add each balance, minimum payment, and interest rate in Money. Once those are present, Joye can compare the highest-interest approach with a smallest-balance approach.",
      suggestedActions: ["Add each debt in Money", "Include balance, minimum, and APR", "Review the plan after the next paycheck"],
      usedContext: ["No saved debts found"],
    };
  }

  return {
    answer: `Your saved debts total ${currency(snapshot.totalDebt)}, with ${currency(snapshot.minimums)} in minimum payments. Keep every minimum current first. For the strongest interest savings, direct extra money to ${nextDebt?.name || "the highest-interest debt"}${nextDebt ? ` at ${formatPercent(nextDebt.interestRate)} APR` : ""}, while keeping a small cash buffer so one surprise expense does not go back onto a card.`,
    suggestedActions: ["Confirm every minimum is covered", nextDebt ? `Add an extra payment to ${nextDebt.name}` : "Choose one target debt", "Review the result after the payment posts"],
    usedContext: ["Debt balances", "Minimum payments", "Interest rates"],
  };
}

function purchaseReply(context: JoyeRichContext): CoachReply {
  const snapshot = moneySnapshot(context);
  const details = snapshot.monthlyTakeHome > 0
    ? `Your estimated monthly take-home is about ${currency(snapshot.monthlyTakeHome)}, and saved debt minimums total ${currency(snapshot.minimums)}.`
    : "Your typical take-home paycheck is not fully set, so Joye cannot calculate a reliable ceiling yet.";

  return {
    answer: `To decide whether a purchase fits, compare it against money that is truly unassigned after upcoming bills, debt minimums, savings commitments, and a safety buffer. ${details} The “Still available” amount in the paycheck planner is the correct place to test the purchase, but it is a ceiling—not a spending target.`,
    suggestedActions: ["Open the paycheck planner", "Enter the purchase as a temporary allocation", "Keep the purchase only if the remaining buffer still feels safe"],
    usedContext: ["Take-home pay", "Debt minimums", "Saved money priority"],
  };
}

function budgetReply(context: JoyeRichContext): CoachReply {
  const snapshot = moneySnapshot(context);
  const nextDebt = [...context.money.debts].sort((a, b) => b.interestRate - a.interestRate)[0];
  const knownParts: string[] = [];
  if (snapshot.monthlyTakeHome > 0) knownParts.push(`${currency(snapshot.monthlyTakeHome)} estimated monthly take-home`);
  if (snapshot.savedBills > 0) knownParts.push(`${currency(snapshot.savedBills)} across saved bill amounts`);
  if (snapshot.minimums > 0) knownParts.push(`${currency(snapshot.minimums)} in debt minimums`);

  return {
    answer: `${knownParts.length ? `Your current snapshot shows ${joinNaturally(knownParts)}.` : "Your Money setup is still missing enough information for a complete recommendation."} Your saved priority is “${context.money.topPriority}.” Build each paycheck in this order: bills due before the next check, debt minimums, a safety buffer, the top priority, then optional spending.${nextDebt ? ` Extra debt money should generally go to ${nextDebt.name}, your highest saved APR.` : ""}`,
    suggestedActions: ["Review the next paycheck", "Confirm bills due before the following check", nextDebt ? `Plan an extra payment to ${nextDebt.name}` : "Assign a savings amount"],
    usedContext: ["Saved bills", "Take-home pay", "Money priority", "Debts"],
  };
}

function careerReply(context: JoyeRichContext, question: string): CoachReply {
  const next = context.career.openMilestones[0] || context.career.nextMilestone;
  const evidence = context.career.recentEvidence[0];
  const lower = question.toLowerCase();

  if (/resume|bullet/.test(lower)) {
    return {
      answer: evidence
        ? `Use your saved evidence—“${evidence}”—as the source for a resume bullet. Structure it as: action you took + system or problem + measurable result. Joye needs the exact scope or result before it should invent a number.`
        : "Joye does not see a saved proof item to turn into a resume bullet. Add one real project, ticket, certification, or measurable result in Career evidence first.",
      suggestedActions: [evidence ? "Open Career evidence and add the exact result" : "Add a Career evidence item", "Write the action, technology, and result", "Save the finished bullet with the evidence"],
      usedContext: ["Career evidence", "Current and target roles"],
    };
  }

  return {
    answer: `Your direction is ${context.career.currentRole} → ${context.career.targetRole}. The strongest next move is “${next}.” Keep it small enough to finish this week, then save proof of the result${evidence ? `. Your recent evidence—${evidence}—can support future applications` : " in the evidence library"}.`,
    suggestedActions: [next, "Add one proof item to Career evidence", "Schedule the action in Weekly"],
    usedContext: ["Current and target roles", "Open career milestones", "Career evidence"],
  };
}

function goalsReply(context: JoyeRichContext, question: string): CoachReply {
  const broadQuestion = /which goal|my goals|goal should|next goal|stay on track|motivation|consistent with my goals?/i.test(question);
  const goal = findRelevantGoal(context, question) || (broadQuestion ? context.goals[0] || null : null);
  if (!goal) {
    return {
      answer: `Joye does not see a saved goal that clearly matches “${shortTopic(question)}.” I will not substitute an unrelated goal. Create or update the goal in plain language, then ask again so Joye can use its tracking style, steps, and progress.`,
      suggestedActions: ["Create or update the matching goal", "Add the first concrete step", "Ask Joye again from that goal"],
      usedContext: ["No matching active goal found"],
    };
  }

  const next = goal.openSteps[0] || (goal.trackingMode === "frequency" ? `Complete one ${goal.title} check-in` : `Define the next step for ${goal.title}`);
  return {
    answer: `The goal that best matches your question is “${goal.title},” currently at ${goal.progress}%. Your next useful action is “${next}.” ${goal.trackingMode === "frequency" ? "Judge progress by repeatability, not perfection." : "Keep the next milestone concrete enough to finish and record."}`,
    suggestedActions: [next, "Add the step to Weekly", "Record progress after completing it"],
    usedContext: ["Matching active goal", "Goal progress", "Open goal steps"],
  };
}

function weeklyReply(context: JoyeRichContext): CoachReply {
  const open = context.weekly.actions.filter((action) => !action.complete);
  const fit = open.find((action) => action.minutes <= context.profile.availableMinutes);
  return {
    answer: fit
      ? `You have ${context.profile.availableMinutes} minutes available and ${context.profile.energy} energy. “${fit.title}” fits that capacity and is the cleanest next action. Protect the week from “${context.weekly.guardrail || "unplanned low-priority work"}.”`
      : open.length
        ? "Your current weekly actions do not fit the time you have available. Break one action into a 15–30 minute first step instead of abandoning the plan."
        : "Joye does not see an open weekly action. Pull one next step from your most important goal or career milestone and schedule it on a realistic day.",
    suggestedActions: fit ? [fit.title, "Mark it complete when finished", "Review tomorrow’s action"] : ["Add or shorten one weekly action", "Move one low-priority action to next week"],
    usedContext: ["Available time", "Energy", "Current weekly actions"],
  };
}

function focusReply(context: JoyeRichContext): CoachReply {
  const openAction = context.weekly.actions.find((action) => !action.complete && action.minutes <= context.profile.availableMinutes);
  const goal = context.goals.find((item) => item.openSteps.length > 0) || context.goals[0];
  const careerMilestone = context.career.openMilestones[0] || (context.career.nextMilestone !== "Not added yet" ? context.career.nextMilestone : null);
  const focus = openAction?.title || goal?.openSteps[0] || careerMilestone || context.profile.primaryFocus;
  const source = openAction ? "this week’s plan" : goal ? `your goal “${goal.title}”` : careerMilestone ? "your career plan" : "your saved primary focus";

  return {
    answer: `Focus on “${focus}” next. It comes from ${source} and fits the ${context.profile.availableMinutes}-minute capacity saved in your profile. Finish that one step before adding another priority, then record the result so tomorrow’s guidance can change.`,
    suggestedActions: [focus, "Update the result when finished", "Rebuild the week only if the priority changed"],
    usedContext: ["Open weekly actions", "Active goal steps", "Available time"],
  };
}

function unknownReply(context: JoyeRichContext, question: string): CoachReply {
  return {
    answer: `I do not want to give you a polished but unrelated answer. I understood the topic as “${shortTopic(question)},” but guided beta mode does not have enough structured information to answer it reliably. Add one detail: what result are you trying to reach, and what is currently getting in the way?`,
    suggestedActions: ["State the desired result", "Mention the main obstacle", `Include any time limit, such as your saved ${context.profile.availableMinutes} minutes`],
    usedContext: ["Guided beta capabilities", "Available time"],
  };
}

export function buildLocalCoachReply(
  context: JoyeRichContext,
  section: CoachSection,
  question: string,
  priorUserMessages: string[] = [],
): CoachReply {
  const intent = inferCoachIntent(section, question, priorUserMessages);
  if (intent === "home") return homeReply(context);
  if (intent === "fitness") return fitnessReply(context, question);
  if (intent === "nutrition") return nutritionReply(context, question);
  if (intent === "mealprep") return mealPrepReply(context, question);
  if (intent === "sleep") return sleepReply(context, question);
  if (intent === "stress") return stressReply(context);
  if (intent === "debt") return debtReply(context);
  if (intent === "purchase") return purchaseReply(context);
  if (intent === "budget") return budgetReply(context);
  if (intent === "career") return careerReply(context, question);
  if (intent === "goals") return goalsReply(context, question);
  if (intent === "weekly") return weeklyReply(context);
  if (intent === "focus") return focusReply(context);
  return unknownReply(context, question);
}

function shortTopic(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}…` : cleaned;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function formatPercent(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function joinNaturally(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
