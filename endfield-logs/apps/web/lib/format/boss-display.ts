export const CRISIS_CONTRACT_BOSS_SLUG = "indie_group_ccdg";
export const CRISIS_CONTRACT_DUNGEON_NAME = "危机合约";

type BossDisplayInput = {
  bossSlug?: string | null;
  bossName?: string | null;
  dungeonName?: string | null;
};

export function isCrisisContractDisplay({ bossSlug, dungeonName }: BossDisplayInput) {
  return bossSlug === CRISIS_CONTRACT_BOSS_SLUG || dungeonName === CRISIS_CONTRACT_DUNGEON_NAME;
}

export function formatBossDisplayName(input: BossDisplayInput) {
  if (isCrisisContractDisplay(input)) {
    return CRISIS_CONTRACT_DUNGEON_NAME;
  }
  return input.bossName?.trim() || input.dungeonName?.trim() || "未知首领";
}

export function formatBossEyebrow(input: BossDisplayInput) {
  if (isCrisisContractDisplay(input)) {
    return "活动竞速";
  }
  return input.dungeonName?.trim() || "竞速榜单";
}
