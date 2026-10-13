/**
 * Self-expiring "NEW" badges.
 *
 * A badge that has to be removed by hand never gets removed — it just quietly
 * becomes furniture, and then every future badge means less because users have
 * learned the last one lied. So each entry carries its own ship date and the
 * badge disappears on its own after NEW_FOR_DAYS.
 *
 * To mark something new: add it here with today's date. That's the whole job.
 */

export const NEW_FOR_DAYS = 45;

const SHIPPED_AT: Record<string, string> = {
  build: "2026-10-13"
};

export function isNew(key: string, now = new Date()): boolean {
  const shipped = SHIPPED_AT[key];
  if (!shipped) return false;
  const age = (now.getTime() - new Date(`${shipped}T00:00:00Z`).getTime()) / 86_400_000;
  return age >= 0 && age <= NEW_FOR_DAYS;
}
