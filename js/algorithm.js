// algorithm.js - 팀 배정 알고리즘
// 의존: scores.js (LINES_ORDER, LINE_NAMES, MASTER_TIERS, getScoreForPlayer, getEffectiveTier)

function isPlayerEligibleForLine(p, line) {
  if (p.mainLine === 'all') return true;
  if (p.mainLine === line) return true;
  if (p.subLines && (p.subLines.includes('all') || p.subLines.includes(line))) return true;
  return false;
}

// ─── Step 0: 사전 검증 ────────────────────────────────────────────
/**
 * 팀 배정 가능 여부 검증
 * @param {Array} activePlayers
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateForAssignment(activePlayers) {
  if (activePlayers.length !== 10) {
    return {
      valid: false,
      reason: `현재 ${activePlayers.length}명입니다.\n정확히 10명이 필요합니다.`
    };
  }

  for (const line of LINES_ORDER) {
    const eligible = activePlayers.filter(p => isPlayerEligibleForLine(p, line));
    if (eligible.length < 2) {
      return {
        valid: false,
        reason: `[${LINE_NAMES[line]}] 라인에 배정 가능한 인원이 2명 미만입니다. 부라인을 추가하거나 대기자와 교체해주세요.`
      };
    }
  }

  return { valid: true };
}

// ─── Step 2: 라인 배정 (백트래킹) ───────────────────────────────────
/**
 * 남은 플레이어들이 남은 라인 슬롯을 채울 수 있는지 확인
 */
function checkFeasibility(remainingPlayers, lineNeeds) {
  for (const line of LINES_ORDER) {
    const need = lineNeeds[line] || 0;
    if (need <= 0) continue;
    const eligible = remainingPlayers.filter(p => isPlayerEligibleForLine(p, line));
    if (eligible.length < need) return false;
  }
  return true;
}

/**
 * 재귀 백트래킹으로 유효한 라인 배정 조합 탐색
 * 선착순(joinedAt) 정렬 후 희망 라인 우선 시도
 */
function _findLineAssignments(players, index, lineCount, assignment, results) {
  if (results.length >= 30) return; // 성능 제한

  if (index === players.length) {
    // 모든 라인이 정확히 2명인지 확인
    if (LINES_ORDER.every(l => (lineCount[l] || 0) === 2)) {
      const byLine = {};
      for (const l of LINES_ORDER) byLine[l] = [];

      const isSubLine = {};
      for (const p of players) {
        const assignedLine = assignment[p.id];
        byLine[assignedLine].push(p.id);
        isSubLine[p.id] = (p.mainLine !== 'all' && assignedLine !== p.mainLine);
      }

      results.push({ byLine, isSubLine, rawAssignment: { ...assignment } });
    }
    return;
  }

  const player = players[index];

  // 후보 라인: 희망 라인 먼저, 이후 부라인 (중복 제거)
  const seen = new Set();
  const candidates = [];
  if (player.mainLine === 'all') {
    LINES_ORDER.forEach(l => {
      seen.add(l);
      candidates.push(l);
    });
  } else {
    const rawList = [player.mainLine, ...(player.subLines || [])];
    if (rawList.includes('all')) {
      if (player.mainLine && !seen.has(player.mainLine)) {
        seen.add(player.mainLine);
        candidates.push(player.mainLine);
      }
      LINES_ORDER.forEach(l => {
        if (!seen.has(l)) {
          seen.add(l);
          candidates.push(l);
        }
      });
    } else {
      for (const line of rawList) {
        if (line && line !== 'all' && !seen.has(line)) {
          seen.add(line);
          candidates.push(line);
        }
      }
    }
  }

  for (const line of candidates) {
    const currentCount = lineCount[line] || 0;
    if (currentCount >= 2) continue;

    const newLineCount = { ...lineCount, [line]: currentCount + 1 };
    const newAssignment = { ...assignment, [player.id]: line };

    // 실현 가능성 검증
    const remaining = players.slice(index + 1);
    const remainingNeeds = {};
    for (const l of LINES_ORDER) {
      remainingNeeds[l] = 2 - (newLineCount[l] || 0);
    }

    if (checkFeasibility(remaining, remainingNeeds)) {
      _findLineAssignments(players, index + 1, newLineCount, newAssignment, results);
    }
  }
}

// ─── Step 3: 팀 분할 (2^5 = 32가지 완전 탐색) ──────────────────────
/**
 * 라인 배정이 완료된 상태에서 블루/레드팀 분할 조합을 계산
 */
function computeTeamSplits(lineAssignment, playerScores) {
  const { byLine, isSubLine } = lineAssignment;
  const combinations = [];

  for (let mask = 0; mask < 32; mask++) {
    const blue = [];
    const red = [];
    const lineMap = {};

    LINES_ORDER.forEach((line, i) => {
      const pair = byLine[line];
      if (!pair || pair.length < 2) return;
      const [p1, p2] = pair;
      lineMap[p1] = line;
      lineMap[p2] = line;

      if ((mask >> i) & 1) {
        blue.push(p1);
        red.push(p2);
      } else {
        red.push(p1);
        blue.push(p2);
      }
    });

    const calc = (pids) => pids.reduce((sum, pid) => {
      const line = lineMap[pid];
      return sum + ((playerScores[pid] && line) ? (playerScores[pid][line] || 0) : 0);
    }, 0);

    const blueScore = calc(blue);
    const redScore = calc(red);
    const scoreDiff = Math.abs(blueScore - redScore);

    combinations.push({
      blue: [...blue],
      red: [...red],
      lineMap: { ...lineMap },
      isSubLine: { ...isSubLine },
      blueScore: Math.round(blueScore * 10) / 10,
      redScore: Math.round(redScore * 10) / 10,
      scoreDiff: Math.round(scoreDiff * 10) / 10
    });
  }

  return combinations;
}

// ─── 메인 진입점 ──────────────────────────────────────────────────
/**
 * 팀 배정 메인 함수
 * @param {Array} activePlayers - status === 'active' 인 플레이어 배열
 * @returns {{ success: boolean, reason?: string, combinations?: Array, playerScores?: Object }}
 */
function runTeamAssignment(activePlayers) {
  // 선착순 정렬
  const sorted = [...activePlayers].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  // 검증
  const validation = validateForAssignment(sorted);
  if (!validation.valid) return { success: false, reason: validation.reason };

  // 플레이어별 점수 계산
  const playerScores = {};
  for (const p of sorted) {
    const tier = getEffectiveTier(p);
    const baseScores = getScoreForPlayer(tier, p.lp || 0);
    if (p.mainLine === 'all') {
      const advantageScores = {};
      for (const line of LINES_ORDER) {
        advantageScores[line] = Math.round((baseScores[line] - 2) * 10) / 10;
      }
      playerScores[p.id] = advantageScores;
    } else {
      playerScores[p.id] = baseScores;
    }
  }

  // 라인 배정 조합 탐색
  const lineAssignments = [];
  _findLineAssignments(sorted, 0, {}, {}, lineAssignments);

  if (lineAssignments.length === 0) {
    return {
      success: false,
      reason: '라인 조합을 생성할 수 없습니다. 부라인을 추가하거나 명단을 조정해주세요.'
    };
  }

  // 모든 라인 배정 × 32가지 팀 분할 계산
  const allCombinations = [];
  for (const la of lineAssignments) {
    allCombinations.push(...computeTeamSplits(la, playerScores));
  }

  // 점수 차이 오름차순 정렬
  allCombinations.sort((a, b) => a.scoreDiff - b.scoreDiff);

  // 중복 제거 후 상위 10개 선택 (레드/블루 진영 스왑 중복 제외)
  const seen = new Set();
  const topCombinations = [];
  for (const combo of allCombinations) {
    const blueKey = [...combo.blue].sort().join(',');
    const redKey = [...combo.red].sort().join(',');
    const key = blueKey < redKey ? `${blueKey}|${redKey}` : `${redKey}|${blueKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      topCombinations.push(combo);
      if (topCombinations.length >= 10) break;
    }
  }

  return { success: true, combinations: topCombinations, playerScores };
}

// ─── 밸런스 판정 ──────────────────────────────────────────────────
/**
 * 점수 차이에 따른 밸런스 라벨 반환
 */
function getBalanceLabel(scoreDiff) {
  if (scoreDiff <= 5) return { label: '황밸', cls: 'balance-gold', emoji: '🟡' };
  if (scoreDiff <= 15) return { label: '밸런스 양호', cls: 'balance-green', emoji: '🟢' };
  return { label: '언밸', cls: 'balance-red', emoji: '🔴' };
}
