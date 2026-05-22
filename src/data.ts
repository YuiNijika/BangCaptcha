import { TracePoint } from './types';
import { v4 as uuidv4 } from 'uuid';
import { ALL_CHARACTERS } from './character/index';
import crypto from 'crypto';

interface ChallengeData {
  correctIndexes: number[];
  createdAt: number;
  imageTokens: string[];
}

export const challengeStore = new Map<string, ChallengeData>();
export const imageTokenStore = new Map<string, string>();

function getRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function createChallenge() {
  const challengeId = uuidv4();

  // 验证模式
  const mode = getRandomInt(0, 2) === 1 ? 'BAND' : 'CHARACTER';

  let targetName = '';
  let correctImages: string[] = [];
  let distractorImages: string[] = [];

  if (mode === 'CHARACTER') {
    const targetChar = ALL_CHARACTERS[getRandomInt(0, ALL_CHARACTERS.length)];
    targetName = targetChar.name;

    const maxCorrect = Math.min(targetChar.images.length, 5);
    const minCorrect = Math.min(3, maxCorrect);
    const correctCount = getRandomInt(minCorrect, maxCorrect + 1);

    correctImages = shuffleArray(targetChar.images).slice(0, correctCount);

    const otherChars = ALL_CHARACTERS.filter(c => c.id !== targetChar.id);
    const otherImagesPool = otherChars.flatMap(c => c.images);
    const distractorCount = 9 - correctCount;
    distractorImages = shuffleArray(otherImagesPool).slice(0, distractorCount);

  } else {
    const allBands = Array.from(new Set(ALL_CHARACTERS.map(c => c.band)));
    const targetBand = allBands[getRandomInt(0, allBands.length)];
    targetName = `${targetBand} 的角色`;

    const bandChars = ALL_CHARACTERS.filter(c => c.band === targetBand);
    const bandImagesPool = bandChars.flatMap(c => c.images);

    const maxCorrect = Math.min(bandImagesPool.length, 6);
    const minCorrect = Math.min(3, maxCorrect);
    const correctCount = getRandomInt(minCorrect, maxCorrect + 1);

    correctImages = shuffleArray(bandImagesPool).slice(0, correctCount);

    const otherChars = ALL_CHARACTERS.filter(c => c.band !== targetBand);
    const otherImagesPool = otherChars.flatMap(c => c.images);
    const distractorCount = 9 - correctCount;
    distractorImages = shuffleArray(otherImagesPool).slice(0, distractorCount);
  }

  const combinedItems = [
    ...correctImages.map(url => ({ url, isCorrect: true })),
    ...distractorImages.map(url => ({ url, isCorrect: false }))
  ];

  const shuffledItems = shuffleArray(combinedItems);
  
  const tokenList: string[] = [];
  const finalImageTokens = shuffledItems.map(item => {
    const token = uuidv4();
    imageTokenStore.set(token, item.url);
    tokenList.push(token);
    // 移除单个图片的 setTimeout，改为跟随 challenge 统一清理
    return `/api/img/${token}`;
  });

  const correctIndexes = shuffledItems
    .map((item, index) => item.isCorrect ? index : -1)
    .filter(index => index !== -1);

  challengeStore.set(challengeId, {
    correctIndexes,
    createdAt: Date.now(),
    imageTokens: tokenList
  });
  
  setTimeout(() => {
    const data = challengeStore.get(challengeId);
    if (data) {
      data.imageTokens.forEach(t => imageTokenStore.delete(t));
      challengeStore.delete(challengeId);
    }
  }, 60 * 1000);

  return {
    id: challengeId,
    targetName: targetName,
    images: finalImageTokens
  };
}

export function verifyChallenge(
  id: string,
  selectedIndexes: number[],
  traceData?: TracePoint[],
  startTime?: number // Kept for backward compatibility but ignored for security
): { isValid: boolean; reason?: string; duration?: number } {

  const challengeData = challengeStore.get(id);

  if (!challengeData) {
    return { isValid: false, reason: 'Challenge expired' };
  }

  const { correctIndexes, createdAt, imageTokens } = challengeData;

  const now = Date.now();
  const duration = now - createdAt;

  if (duration < 500) {
    cleanupChallenge(id);
    return { isValid: false, reason: 'Too fast', duration };
  }
  if (duration > 60 * 1000) {
    cleanupChallenge(id);
    return { isValid: false, reason: 'Timeout', duration };
  }

  // Basic trace data validation
  if (!traceData || !Array.isArray(traceData) || traceData.length < 5) {
    cleanupChallenge(id);
    return { isValid: false, reason: 'Invalid trace data', duration };
  }

  // Validate that not all trace points are identical (bot prevention)
  let hasMovement = false;
  const firstPoint = traceData[0];
  for (let i = 1; i < traceData.length; i++) {
    const point = traceData[i];
    if (point[1] !== firstPoint[1] || point[2] !== firstPoint[2]) {
      hasMovement = true;
      break;
    }
  }
  
  if (!hasMovement) {
    cleanupChallenge(id);
    return { isValid: false, reason: 'Suspicious trace data', duration };
  }

  // Validate selected indexes array
  if (!Array.isArray(selectedIndexes)) {
    cleanupChallenge(id);
    return { isValid: false, reason: 'Invalid format', duration };
  }

  // Remove duplicates and sort
  const uniqueSelected = Array.from(new Set(selectedIndexes));

  if (uniqueSelected.length !== correctIndexes.length) {
    cleanupChallenge(id);
    return { isValid: false, reason: 'Incorrect count', duration };
  }

  const sortedSelected = [...uniqueSelected].sort((a, b) => a - b);
  const sortedCorrect = [...correctIndexes].sort((a, b) => a - b);

  for (let i = 0; i < sortedSelected.length; i++) {
    if (sortedSelected[i] !== sortedCorrect[i] || sortedSelected[i] < 0 || sortedSelected[i] > 8) {
      cleanupChallenge(id);
      return { isValid: false, reason: 'Incorrect selection', duration };
    }
  }

  cleanupChallenge(id);
  return { isValid: true, duration };
}

function cleanupChallenge(id: string) {
  const data = challengeStore.get(id);
  if (data) {
    data.imageTokens.forEach(t => imageTokenStore.delete(t));
    challengeStore.delete(id);
  }
}
