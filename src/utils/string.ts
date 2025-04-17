/**
 * 두 문자열 사이의 Levenshtein 거리를 계산합니다.
 * Levenshtein 거리는 한 문자열을 다른 문자열로 변환하는 데 필요한 최소 편집 횟수입니다.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // 삭제
        matrix[j - 1][i] + 1, // 삽입
        matrix[j - 1][i - 1] + substitutionCost // 대체
      );
    }
  }

  return matrix[b.length][a.length];
};

/**
 * 두 문자열의 유사도를 0~1 사이의 값으로 계산합니다.
 * 1에 가까울수록 더 유사하며, 완전히 동일한 문자열은 1을 반환합니다.
 */
export const calculateStringSimilarity = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  
  return 1 - distance / maxLength;
}; 