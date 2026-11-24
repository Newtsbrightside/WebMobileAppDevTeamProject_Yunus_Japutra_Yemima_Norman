// US shoe sizes. A pair can have a different size for the left and the right foot.

// "9" when both feet match, "L 9 / R 9.5" when they differ.
export const sizeLabel = (left, right) =>
  Number(left) === Number(right) ? String(left) : `L ${left} / R ${right}`;

export const MIN_FOOT_SIZE = 4;
export const MAX_FOOT_SIZE = 14;

const hasSize = (shoe, size) => size != null && shoe.sizes.some(s => Number(s) === Number(size));

// What to preselect on a shoe: sizes passed in (from the AI advisor), else the user's
// saved sizes, else the shoe's first size — but only sizes this shoe really has.
export function defaultSizes(shoe, user, preferred) {
  const candidates = [
    preferred && { left: Number(preferred.left), right: Number(preferred.right) },
    user && { left: user.left_size, right: user.right_size }
  ];
  for (const option of candidates) {
    if (option && hasSize(shoe, option.left) && hasSize(shoe, option.right)) {
      return { left: Number(option.left), right: Number(option.right), split: Number(option.left) !== Number(option.right) };
    }
  }
  const first = shoe.sizes[0];
  return { left: first, right: first, split: false };
}
