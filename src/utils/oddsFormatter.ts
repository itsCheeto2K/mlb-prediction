export function formatMoneyline(ml: number): string {
  if (ml > 0) return `+${ml}`;
  return `${ml}`;
}

export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

export function probToDecimalOdds(prob: number): string {
  if (prob <= 0) return '1.00';
  return (1 / prob).toFixed(2);
}

export function getSpreadString(spread: number): string {
  if (spread > 0) return `+${spread.toFixed(1)}`;
  return spread.toFixed(1);
}

export function getTeamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}
