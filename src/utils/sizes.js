// Shoe size helpers shared by the product page, the bag and the AI Fit Advisor.
// A pair can have a different US size for the left and the right foot.

// "9" when both feet match, "L 9 / R 9.5" when they differ.
export const sizeLabel = (left, right) =>
  Number(left) === Number(right) ? String(left) : `L ${left} / R ${right}`;

const hasSize = (shoe, size) => size != null && shoe.sizes.some(s => Number(s) === Number(size));

// The sizes to preselect for a shoe: the user's saved sizes when the shoe has them,
// otherwise the shoe's first size for both feet.
export const defaultSizes = (shoe, user) => {
  const left = user?.left_size;
  const right = user?.right_size;
  if (hasSize(shoe, left) && hasSize(shoe, right)) {
    return { left: Number(left), right: Number(right), split: Number(left) !== Number(right) };
  }
  const first = shoe.sizes[0];
  return { left: first, right: first, split: false };
};

// Sizes a shopper can pick for their own feet (US 4–14 in half sizes).
export const FOOT_SIZES = Array.from({ length: 21 }, (_, index) => 4 + index * 0.5);
