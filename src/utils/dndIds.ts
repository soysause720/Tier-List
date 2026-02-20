export const UNRANKED_CONTAINER_ID = "unranked";
export const UNRANKED_DROP_ID = "container:unranked";
const TIER_DROP_PREFIX = "container:tier:";

export function makeTierDropId(tierId: string): string {
  return `${TIER_DROP_PREFIX}${tierId}`;
}

export function parseTierDropId(dropId: string): string | null {
  if (!dropId.startsWith(TIER_DROP_PREFIX)) {
    return null;
  }

  return dropId.slice(TIER_DROP_PREFIX.length) || null;
}
