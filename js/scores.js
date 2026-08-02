// scores.js - score.md 기반 점수 테이블 및 유틸리티

// ─── 라인 상수 ───────────────────────────────────────────────────
const LINES_ORDER = ['top', 'jungle', 'mid', 'adc', 'support'];
const SELECTOR_LINES = ['top', 'jungle', 'mid', 'adc', 'support', 'all'];

const LINE_NAMES = {
  top: '탑', jungle: '정글', mid: '미드', adc: '원딜', support: '서폿', all: '상관없음'
};

const LINE_ICONS = {
  top: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
  jungle: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
  mid: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
  adc: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
  support: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
  all: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png',
};

// ─── 티어 상수 ───────────────────────────────────────────────────
const ALL_TIERS = [
  '아이언4', '아이언3', '아이언2', '아이언1',
  '브론즈4', '브론즈3', '브론즈2', '브론즈1',
  '실버4', '실버3', '실버2', '실버1',
  '골드4', '골드3', '골드2', '골드1',
  '플래티넘4', '플래티넘3', '플래티넘2', '플래티넘1',
  '에메랄드4', '에메랄드3', '에메랄드2', '에메랄드1',
  '다이아4', '다이아3', '다이아2', '다이아1',
  '마스터', '그랜드마스터', '챌린저'
];

const MASTER_TIERS = ['마스터', '그랜드마스터', '챌린저'];

const TIER_DISPLAY = {
  '아이언4': '아이언4', '아이언3': '아이언3', '아이언2': '아이언2', '아이언1': '아이언1',
  '브론즈4': '브론즈4', '브론즈3': '브론즈3', '브론즈2': '브론즈2', '브론즈1': '브론즈1',
  '실버4': '실버4', '실버3': '실버3', '실버2': '실버2', '실버1': '실버1',
  '골드4': '골드4', '골드3': '골드3', '골드2': '골드2', '골드1': '골드1',
  '플래티넘4': '플래티넘4', '플래티넘3': '플래티넘3', '플래티넘2': '플래티넘2', '플래티넘1': '플래티넘1',
  '에메랄드4': '에메랄드4', '에메랄드3': '에메랄드3', '에메랄드2': '에메랄드2', '에메랄드1': '에메랄드1',
  '다이아4': '다이아4', '다이아3': '다이아3', '다이아2': '다이아2', '다이아1': '다이아1',
  '마스터': '마스터', '그랜드마스터': '그마', '챌린저': '챌린저'
};

// 로컬 티어 엠블럼 이미지
const TIER_ICONS = {
  '아이언4':   'img/iron.png',
  '아이언3':   'img/iron.png',
  '아이언2':   'img/iron.png',
  '아이언1':   'img/iron.png',
  '브론즈4':   'img/bronze.png',
  '브론즈3':   'img/bronze.png',
  '브론즈2':   'img/bronze.png',
  '브론즈1':   'img/bronze.png',
  '실버4':     'img/silver.png',
  '실버3':     'img/silver.png',
  '실버2':     'img/silver.png',
  '실버1':     'img/silver.png',
  '골드4':     'img/gold.png',
  '골드3':     'img/gold.png',
  '골드2':     'img/gold.png',
  '골드1':     'img/gold.png',
  '플래티넘4': 'img/platinum.png',
  '플래티넘3': 'img/platinum.png',
  '플래티넘2': 'img/platinum.png',
  '플래티넘1': 'img/platinum.png',
  '에메랄드4': 'img/emerald.png',
  '에메랄드3': 'img/emerald.png',
  '에메랄드2': 'img/emerald.png',
  '에메랄드1': 'img/emerald.png',
  '다이아4':   'img/diamond.png',
  '다이아3':   'img/diamond.png',
  '다이아2':   'img/diamond.png',
  '다이아1':   'img/diamond.png',
  '마스터':        'img/master.png',
  '그랜드마스터':  'img/grandmaster.png',
  '챌린저':        'img/challenger.png',
};

// ─── 점수 테이블 (score.md 기반) ─────────────────────────────────
const TIER_SCORES = {
  '아이언4': { top: 2, jungle: 1.5, mid: 4.9, adc: 4.1, support: 7.4 },
  '아이언3': { top: 3, jungle: 2.4, mid: 5.8, adc: 4.8, support: 8.2 },
  '아이언2': { top: 4, jungle: 3.4, mid: 6.7, adc: 5.4, support: 9.1 },
  '아이언1': { top: 5, jungle: 4.3, mid: 7.6, adc: 6.1, support: 9.9 },
  '브론즈4': { top: 6, jungle: 5.3, mid: 8.5, adc: 6.7, support: 10.8 },
  '브론즈3': { top: 7, jungle: 6.2, mid: 9.4, adc: 7.4, support: 11.6 },
  '브론즈2': { top: 8, jungle: 7.2, mid: 10.3, adc: 8, support: 12.5 },
  '브론즈1': { top: 9, jungle: 8.1, mid: 11.2, adc: 8.7, support: 13.3 },
  '실버4': { top: 10, jungle: 9.1, mid: 12.1, adc: 9.3, support: 14.2 },
  '실버3': { top: 11, jungle: 10, mid: 13, adc: 10, support: 15 },
  '실버2': { top: 12, jungle: 11, mid: 13.9, adc: 10.6, support: 15.9 },
  '실버1': { top: 13, jungle: 11.9, mid: 14.8, adc: 11.3, support: 16.7 },
  '골드4': { top: 14.6, jungle: 12.8, mid: 15.9, adc: 11.9, support: 17.6 },
  '골드3': { top: 15.9, jungle: 13.8, mid: 16.8, adc: 12.6, support: 18.3 },
  '골드2': { top: 17.7, jungle: 14.7, mid: 17.8, adc: 13.4, support: 19.1 },
  '골드1': { top: 19, jungle: 16.7, mid: 19.7, adc: 15.1, support: 20.5 },
  '플래티넘4': { top: 21.2, jungle: 18.1, mid: 21.1, adc: 16.4, support: 21.2 },
  '플래티넘3': { top: 24, jungle: 19.3, mid: 22.7, adc: 17.5, support: 22 },
  '플래티넘2': { top: 24.7, jungle: 20.5, mid: 24.3, adc: 18.7, support: 22.8 },
  '플래티넘1': { top: 25.2, jungle: 21.9, mid: 27.1, adc: 20.3, support: 24.2 },
  '에메랄드4': { top: 26, jungle: 23.4, mid: 29.6, adc: 21.6, support: 25.1 },
  '에메랄드3': { top: 26.5, jungle: 24.8, mid: 31.8, adc: 22.8, support: 26 },
  '에메랄드2': { top: 27.3, jungle: 26.6, mid: 33, adc: 24.3, support: 27 },
  '에메랄드1': { top: 28.6, jungle: 28.8, mid: 34.6, adc: 25.7, support: 28.2 },
  '다이아4': { top: 30.3, jungle: 30.7, mid: 35.4, adc: 27.6, support: 29.3 },
  '다이아3': { top: 31.6, jungle: 32.5, mid: 37.1, adc: 29.7, support: 30.3 },
  '다이아2': { top: 33.8, jungle: 34.8, mid: 38, adc: 32.1, support: 31.3 },
  '다이아1': { top: 35.7, jungle: 36.8, mid: 38.7, adc: 34, support: 32.2 },
};

// 마스터+ LP 구간별 점수
const MASTER_LP_SCORES = [
  { lpMin: 0, lpMax: 99, top: 37.4, jungle: 38.2, mid: 39.8, adc: 36.1, support: 33.1 },
  { lpMin: 100, lpMax: 199, top: 39.1, jungle: 39.4, mid: 41.3, adc: 38.3, support: 34 },
  { lpMin: 200, lpMax: 299, top: 41.8, jungle: 40.6, mid: 43, adc: 40.6, support: 35 },
  { lpMin: 300, lpMax: 399, top: 43, jungle: 42.4, mid: 44.7, adc: 43.5, support: 36.1 },
  { lpMin: 400, lpMax: 499, top: 45.2, jungle: 44.3, mid: 45.2, adc: 46.2, support: 37.7 },
  { lpMin: 500, lpMax: 599, top: 47.9, jungle: 46.3, mid: 46.2, adc: 48.6, support: 39 },
  { lpMin: 600, lpMax: 699, top: 49.7, jungle: 48.4, mid: 48, adc: 51.1, support: 41.1 },
  { lpMin: 700, lpMax: 799, top: 51.3, jungle: 50.6, mid: 49.3, adc: 53.7, support: 42.8 },
  { lpMin: 800, lpMax: 899, top: 52.6, jungle: 53.1, mid: 50.2, adc: 56.1, support: 44.5 },
  { lpMin: 900, lpMax: 999, top: 54.8, jungle: 55.4, mid: 51.4, adc: 58.8, support: 46.2 },
  { lpMin: 1000, lpMax: 1099, top: 57.8, jungle: 57.7, mid: 53.1, adc: 61.3, support: 48 },
  { lpMin: 1100, lpMax: 1199, top: 59.9, jungle: 59.4, mid: 54.7, adc: 62.2, support: 48.7 },
  { lpMin: 1200, lpMax: 1299, top: 62.4, jungle: 60.5, mid: 56, adc: 62.7, support: 49.3 },
  { lpMin: 1300, lpMax: 1399, top: 63.1, jungle: 61.3, mid: 57.3, adc: 63.3, support: 49.8 },
  { lpMin: 1400, lpMax: 1499, top: 63.8, jungle: 62.2, mid: 58.2, adc: 63.9, support: 50.1 },
  { lpMin: 1500, lpMax: 1599, top: 64.6, jungle: 63.3, mid: 59.9, adc: 64.2, support: 50.6 },
  { lpMin: 1600, lpMax: 1699, top: 65.5, jungle: 63.8, mid: 60.8, adc: 64.4, support: 50.9 },
  { lpMin: 1700, lpMax: 1799, top: 66, jungle: 64.3, mid: 61.1, adc: 64.7, support: 51.5 },
  { lpMin: 1800, lpMax: 99999, top: 67, jungle: 66, mid: 62, adc: 65, support: 52 },
];

/**
 * 솔로랭크 판수 어드밴티지 계산 (100판: -1점, 300판: -2점, 500판이상: -3점)
 * @param {number} gamesPlayed 
 * @returns {number}
 */
function getGameAdvantage(gamesPlayed) {
  const g = parseInt(gamesPlayed) || 0;
  if (g >= 500) return -3;
  if (g >= 300) return -2;
  if (g >= 100) return -1;
  return 0;
}

/**
 * 티어, LP, 판수로 라인별 점수 반환
 * @param {string} tier - 티어명 (예: '골드2', '마스터')
 * @param {number} lp   - LP (마스터 이상만 사용)
 * @param {number} gamesPlayed - 솔랭 판수
 * @returns {{ top, jungle, mid, adc, support }}
 */
function getScoreForPlayer(tier, lp, gamesPlayed = 0) {
  let baseObj;
  if (tier === '실버3이하') tier = '실버3';
  if (MASTER_TIERS.includes(tier)) {
    const lpNum = parseInt(lp) || 0;
    const row = MASTER_LP_SCORES.find(r => lpNum >= r.lpMin && lpNum <= r.lpMax)
      || MASTER_LP_SCORES[MASTER_LP_SCORES.length - 1];
    baseObj = { top: row.top, jungle: row.jungle, mid: row.mid, adc: row.adc, support: row.support };
  } else {
    baseObj = TIER_SCORES[tier] || TIER_SCORES['골드4'];
  }

  const adv = getGameAdvantage(gamesPlayed);
  if (adv !== 0) {
    const adjustedObj = {};
    for (const line of LINES_ORDER) {
      adjustedObj[line] = Math.round((baseObj[line] + adv) * 10) / 10;
    }
    return adjustedObj;
  }
  return baseObj;
}

/**
 * 플레이어의 실효 티어 (조정값 우선)
 */
function getEffectiveTier(player) {
  return player.adjustedTier || player.tier;
}

/**
 * 플레이어 티어 표시 문자열 (마스터+ LP 포함)
 */
function getTierLabel(player) {
  const tier = getEffectiveTier(player);
  if (MASTER_TIERS.includes(tier) && player.lp != null) {
    return `${tier} ${player.lp}LP`;
  }
  return tier;
}

/**
 * 티어별 CSS 클래스명 반환
 */
function getTierClass(tier) {
  if (!tier) return 'tier-silver';
  if (tier.startsWith('아이언')) return 'tier-iron';
  if (tier.startsWith('브론즈')) return 'tier-bronze';
  if (tier.startsWith('실버')) return 'tier-silver';
  if (tier.startsWith('골드')) return 'tier-gold';
  if (tier.startsWith('플래티넘')) return 'tier-platinum';
  if (tier.startsWith('에메랄드')) return 'tier-emerald';
  if (tier.startsWith('다이아')) return 'tier-diamond';
  if (tier === '마스터') return 'tier-master';
  if (tier === '그랜드마스터') return 'tier-grandmaster';
  if (tier === '챌린저') return 'tier-challenger';
  return 'tier-silver';
}
