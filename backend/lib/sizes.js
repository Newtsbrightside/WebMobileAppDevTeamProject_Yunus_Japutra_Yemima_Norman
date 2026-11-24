// Helpers for shoe sizes (US sizes, e.g. 9 or 9.5).
// A customer may need a different size for the left and the right foot,
// so an order line stores left_size and right_size separately.

const MIN_SIZE = 3;
const MAX_SIZE = 16;

// The shoes table keeps sizes as JSON text: "[8, 8.5, 9]".
function parseSizes(value) {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

// A foot size must be a number between 3 and 16 in half-size steps.
function isValidSize(value) {
  const size = Number(value);
  return Number.isFinite(size) && size >= MIN_SIZE && size <= MAX_SIZE && Number.isInteger(size * 2);
}

// The size we would sell for a foot: the exact size if the shoe has it,
// otherwise the next half size up (shoe fitters advise going up, not down).
// Returns null when the closest size is more than half a size away.
function closestSize(sizes, footSize) {
  const sorted = [...sizes].sort((a, b) => a - b);
  const exactOrUp = sorted.find(size => size >= footSize);
  const chosen = exactOrUp !== undefined ? exactOrUp : sorted[sorted.length - 1];
  if (chosen === undefined || Math.abs(chosen - footSize) > 0.5) return null;
  return chosen;
}

// "9" when both feet match, "L 9 / R 9.5" when they differ.
function sizeLabel(leftSize, rightSize) {
  return Number(leftSize) === Number(rightSize)
    ? String(leftSize)
    : `L ${leftSize} / R ${rightSize}`;
}

module.exports = { parseSizes, isValidSize, closestSize, sizeLabel };
