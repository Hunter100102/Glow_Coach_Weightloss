export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export const PACE_DEFICITS = {
  slow: 250,
  standard: 500,
  aggressive: 750
};

export function calculateTargets({ sex, age, height_cm, current_weight_lb, goal_weight_lb, activity_level = 'light', pace = 'standard' }) {
  const weightKg = Number(current_weight_lb) * 0.45359237;
  const heightCm = Number(height_cm);
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * Number(age);
  if (sex === 'male') bmr += 5;
  else if (sex === 'female') bmr -= 161;
  else bmr -= 78;

  const maintenance = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity_level] || ACTIVITY_MULTIPLIERS.light));
  const wantsLoss = Number(goal_weight_lb) < Number(current_weight_lb);
  const wantsGain = Number(goal_weight_lb) > Number(current_weight_lb);
  const delta = PACE_DEFICITS[pace] || PACE_DEFICITS.standard;
  let target = maintenance;
  if (wantsLoss) target = maintenance - delta;
  if (wantsGain) target = maintenance + Math.min(delta, 400);
  target = Math.max(1200, Math.round(target));
  const protein = Math.round(Number(current_weight_lb) * 0.7);
  return { maintenance_calories: maintenance, daily_calorie_target: target, protein_target_g: protein };
}
