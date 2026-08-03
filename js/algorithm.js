// algorithm.js - 팀 배정 알고리즘
// 의존: scores.js (LINES_ORDER, LINE_NAMES, MASTER_TIERS, getScoreForPlayer, getEffectiveTier)

function isPlayerEligibleForLine(p, line) {
  if (!p) return false;
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
function validateForAssignment(activePlayers, mode = '10') {
  const targetCount = (mode === '20') ? 20 : 10;
  const reqPerLine = (mode === '20') ? 4 : 2;

  if (activePlayers.length !== targetCount) {
    return {
      valid: false,
      reason: `현재 ${activePlayers.length}명입니다.\n정확히 ${targetCount}명이 필요합니다.`
    };
  }

  for (const line of LINES_ORDER) {
    const eligible = activePlayers.filter(p => isPlayerEligibleForLine(p, line));
    if (eligible.length < reqPerLine) {
      return {
        valid: false,
        reason: `<span class="cannot-assign-line-name">${LINE_NAMES[line]}</span> 라인에 배정 가능한 인원이 ${reqPerLine}명 미만입니다. 부라인을 추가하거나 대기자와 교체해주세요.`
      };
    }
  }

  // 1단계 통과 후 백트래킹 실현 가능성 검증
  const sorted = [...activePlayers].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const lineAssignments = [];
  if (mode === '20') {
    _findLineAssignments20(sorted, 0, {}, {}, lineAssignments);
  } else {
    _findLineAssignments(sorted, 0, {}, {}, lineAssignments);
  }

  if (lineAssignments.length === 0) {
    return {
      valid: false,
      reason: `${targetCount}명의 희망/부라인 조합으로 5개 라인(각 ${reqPerLine}명)을 모두 채울 수 없습니다. 부라인을 추가하거나 대기자와 교체해주세요.`
    };
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
 * 10인 모드 라인 배정 백트래킹 (각 라인당 2명)
 */
function _findLineAssignments(players, index, lineCount, assignment, results) {
  if (results.length >= 30) return; // 성능 제한

  if (index === players.length) {
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

/**
 * 20인 모드 라인 배정 백트래킹 (각 라인당 4명)
 */
function _findLineAssignments20(players, index, lineCount, assignment, results) {
  if (results.length >= 15) return; // 성능 및 알고리즘 탐색 범위 최적화 (최대 15개 라인배정 후보 탐색)

  if (index === players.length) {
    if (LINES_ORDER.every(l => (lineCount[l] || 0) === 4)) {
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
    if (currentCount >= 4) continue;

    const newLineCount = { ...lineCount, [line]: currentCount + 1 };
    const newAssignment = { ...assignment, [player.id]: line };

    const remaining = players.slice(index + 1);
    const remainingNeeds = {};
    for (const l of LINES_ORDER) {
      remainingNeeds[l] = 4 - (newLineCount[l] || 0);
    }

    if (checkFeasibility(remaining, remainingNeeds)) {
      _findLineAssignments20(players, index + 1, newLineCount, newAssignment, results);
    }
  }
}

// ─── Step 3: 팀 분할 (10인 2팀 / 20인 4팀) ──────────────────────
/**
 * 10인 2팀 분할 조합 계산 (2^5 = 32가지)
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
      scoreDiff: Math.round(scoreDiff * 10) / 10,
      mode: '10'
    });
  }

  return combinations;
}

const PERMS_4 = [
  [0,1,2,3], [0,1,3,2], [0,2,1,3], [0,2,3,1], [0,3,1,2], [0,3,2,1],
  [1,0,2,3], [1,0,3,2], [1,2,0,3], [1,2,3,0], [1,3,0,2], [1,3,2,0],
  [2,0,1,3], [2,0,3,1], [2,1,0,3], [2,1,3,0], [2,3,0,1], [2,3,1,0],
  [3,0,1,2], [3,0,2,1], [3,1,0,2], [3,1,2,0], [3,2,0,1], [3,2,1,0]
];

/**
 * 20인 4팀 분할 조합 계산 (블루, 레드, 그린, 퍼플)
 * 331,776회 완전 탐색 시 객체 생성 수억 개로 인한 브라우저 멈춤 방지 (Top-50 버퍼 기법)
 */
function compute4TeamSplits(lineAssignment, playerScores) {
  const { byLine, isSubLine } = lineAssignment;
  const topCombos = [];
  const MAX_TOP = 50;
  let maxDiffInTop = Infinity;

  const topPair = byLine['top'];
  const jPair = byLine['jungle'];
  const mPair = byLine['mid'];
  const aPair = byLine['adc'];
  const sPair = byLine['support'];

  if (!topPair || topPair.length < 4 || !jPair || jPair.length < 4 || !mPair || mPair.length < 4 || !aPair || aPair.length < 4 || !sPair || sPair.length < 4) {
    return topCombos;
  }

  // 플레이어별 점수 사전 캐싱 (루프 내 객체 접근 및 함수 호출 최소화)
  const getPScore = (pid, line) => (playerScores[pid] && line) ? (playerScores[pid][line] || 0) : 0;

  const topScores = topPair.map(pid => getPScore(pid, 'top'));
  const jScores = jPair.map(pid => getPScore(pid, 'jungle'));
  const mScores = mPair.map(pid => getPScore(pid, 'mid'));
  const aScores = aPair.map(pid => getPScore(pid, 'adc'));
  const sScores = sPair.map(pid => getPScore(pid, 'support'));

  for (let j = 0; j < 24; j++) {
    const jP = PERMS_4[j];
    for (let m = 0; m < 24; m++) {
      const mP = PERMS_4[m];
      for (let a = 0; a < 24; a++) {
        const aP = PERMS_4[a];
        for (let s = 0; s < 24; s++) {
          const sP = PERMS_4[s];

          // 4개 팀 점수 합산 (원시 숫자 연산)
          const s0 = topScores[0] + jScores[jP[0]] + mScores[mP[0]] + aScores[aP[0]] + sScores[sP[0]];
          const s1 = topScores[1] + jScores[jP[1]] + mScores[mP[1]] + aScores[aP[1]] + sScores[sP[1]];
          const s2 = topScores[2] + jScores[jP[2]] + mScores[mP[2]] + aScores[aP[2]] + sScores[sP[2]];
          const s3 = topScores[3] + jScores[jP[3]] + mScores[mP[3]] + aScores[aP[3]] + sScores[sP[3]];

          // 1매치 (블루vs레드) 및 2매치 (그린vs퍼플) 점수 차이 계산
          const diff1 = Math.abs(s0 - s1);
          const diff2 = Math.abs(s2 - s3);
          const scoreDiff = Math.round((diff1 + diff2) * 10) / 10;
          // 두 매치 모두 치열하도록 최대 매치 격차 + 총격차 기반 정렬 메트릭
          const sortMetric = Math.max(diff1, diff2) * 10 + (diff1 + diff2);

          // 상위 50개 후보에 들 수 있는 경우만 객체 생성
          if (topCombos.length < MAX_TOP || sortMetric < maxDiffInTop) {
            const teams = [[], [], [], []];
            const lineMap = {};

            for (let t = 0; t < 4; t++) {
              const topPid = topPair[t];
              const jPid = jPair[jP[t]];
              const mPid = mPair[mP[t]];
              const aPid = aPair[aP[t]];
              const sPid = sPair[sP[t]];

              teams[t].push(topPid, jPid, mPid, aPid, sPid);
              lineMap[topPid] = 'top';
              lineMap[jPid] = 'jungle';
              lineMap[mPid] = 'mid';
              lineMap[aPid] = 'adc';
              lineMap[sPid] = 'support';
            }

            const item = {
              blue: [...teams[0]],
              red: [...teams[1]],
              green: [...teams[2]],
              purple: [...teams[3]],
              lineMap: { ...lineMap },
              isSubLine: { ...isSubLine },
              blueScore: Math.round(s0 * 10) / 10,
              redScore: Math.round(s1 * 10) / 10,
              greenScore: Math.round(s2 * 10) / 10,
              purpleScore: Math.round(s3 * 10) / 10,
              diff1: Math.round(diff1 * 10) / 10,
              diff2: Math.round(diff2 * 10) / 10,
              scoreDiff,
              sortMetric,
              mode: '20'
            };

            topCombos.push(item);
            topCombos.sort((x, y) => x.sortMetric - y.sortMetric);
            if (topCombos.length > MAX_TOP) topCombos.pop();
            maxDiffInTop = topCombos[topCombos.length - 1].sortMetric;
          }
        }
      }
    }
  }

  return topCombos;
}

// ─── 메인 진입점 ──────────────────────────────────────────────────
/**
 * 팀 배정 메인 함수
 * @param {Array} activePlayers - status === 'active' 인 플레이어 배열
 * @param {string} mode - '10' 또는 '20'
 * @returns {{ success: boolean, reason?: string, combinations?: Array, playerScores?: Object }}
 */
function runTeamAssignment(activePlayers, mode = '10') {
  const sorted = [...activePlayers].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  const validation = validateForAssignment(sorted, mode);
  if (!validation.valid) return { success: false, reason: validation.reason };

  const playerScores = {};
  for (const p of sorted) {
    const tier = getEffectiveTier(p);
    const baseScores = getScoreForPlayer(tier, p.lp || 0, p.gamesPlayed || 0);
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

  const lineAssignments = [];
  if (mode === '20') {
    _findLineAssignments20(sorted, 0, {}, {}, lineAssignments);
  } else {
    _findLineAssignments(sorted, 0, {}, {}, lineAssignments);
  }

  if (lineAssignments.length === 0) {
    return {
      success: false,
      reason: '라인 조합을 생성할 수 없습니다. 부라인을 추가하거나 명단을 조정해주세요.'
    };
  }

  const allCombinations = [];
  for (const la of lineAssignments) {
    if (mode === '20') {
      allCombinations.push(...compute4TeamSplits(la, playerScores));
    } else {
      allCombinations.push(...computeTeamSplits(la, playerScores));
    }
  }

  if (mode === '20') {
    allCombinations.sort((a, b) => a.sortMetric - b.sortMetric);
  } else {
    allCombinations.sort((a, b) => a.scoreDiff - b.scoreDiff);
  }

  function getTeamSignature(teamPids, lineMap, isSubLine, pScores) {
    return LINES_ORDER.map(line => {
      const pid = teamPids.find(id => lineMap && lineMap[id] === line);
      if (!pid) return `${line}:none`;
      const score = (pScores[pid] && lineMap[pid]) ? pScores[pid][lineMap[pid]] : 0;
      const isSub = (isSubLine && isSubLine[pid]) ? 'sub' : 'main';
      return `${line}:${score}:${isSub}`;
    }).join(';');
  }

  function getComboSignature(combo, pScores, m) {
    if (m === '20') {
      const bSig = getTeamSignature(combo.blue, combo.lineMap, combo.isSubLine, pScores);
      const rSig = getTeamSignature(combo.red, combo.lineMap, combo.isSubLine, pScores);
      const gSig = getTeamSignature(combo.green, combo.lineMap, combo.isSubLine, pScores);
      const pSig = getTeamSignature(combo.purple, combo.lineMap, combo.isSubLine, pScores);

      const m1 = bSig < rSig ? `${bSig}||${rSig}` : `${rSig}||${bSig}`;
      const m2 = gSig < pSig ? `${gSig}||${pSig}` : `${pSig}||${gSig}`;
      return m1 < m2 ? `${m1}||${m2}` : `${m2}||${m1}`;
    } else {
      const bSig = getTeamSignature(combo.blue, combo.lineMap, combo.isSubLine, pScores);
      const rSig = getTeamSignature(combo.red, combo.lineMap, combo.isSubLine, pScores);
      return bSig < rSig ? `${bSig}||${rSig}` : `${rSig}||${bSig}`;
    }
  }

  const seen = new Set();
  const topCombinations = [];
  for (const combo of allCombinations) {
    const sig = getComboSignature(combo, playerScores, mode);
    if (!seen.has(sig)) {
      seen.add(sig);
      topCombinations.push(combo);
      if (topCombinations.length >= 10) break;
    }
  }

  if (topCombinations.length === 0) {
    return {
      success: false,
      reason: '유효한 팀 밸런스 조합을 생성할 수 없습니다. 명단의 라인 및 티어를 다시 확인해주세요.'
    };
  }

  return { success: true, combinations: topCombinations, playerScores };
}

// ─── 밸런스 판정 ──────────────────────────────────────────────────
/**
 * 점수 차이에 따른 밸런스 라벨 반환
 * @param {number} scoreDiff
 * @param {string} mode - '10' 또는 '20'
 */
function getBalanceLabel(scoreDiff, mode = '10') {
  const maxGold = (mode === '20') ? 10 : 5;
  const maxGreen = (mode === '20') ? 30 : 15;
  if (scoreDiff <= maxGold) return { label: '황밸', cls: 'balance-gold', emoji: '🟡' };
  if (scoreDiff <= maxGreen) return { label: '밸런스 양호', cls: 'balance-green', emoji: '🟢' };
  return { label: '언밸', cls: 'balance-red', emoji: '🔴' };
}
