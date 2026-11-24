// Pick one US size, or — for shoppers whose feet differ — a size for each foot.
// value: { left, right, split }
const SizeRow = ({ sizes, selected, onSelect, label }) => (
  <div className="size-grid" role="radiogroup" aria-label={label}>
    {sizes.map(size => (
      <button
        key={size}
        type="button"
        role="radio"
        aria-checked={Number(selected) === Number(size)}
        className={Number(selected) === Number(size) ? 'selected' : ''}
        onClick={() => onSelect(size)}
      >
        {size}
      </button>
    ))}
  </div>
);

const SizePicker = ({ sizes, value, onChange }) => {
  const toggleSplit = event => {
    const split = event.target.checked;
    // Turning it off: both feet take the left foot's size again.
    onChange({ ...value, split, right: split ? value.right : value.left });
  };

  return (
    <div className="size-picker">
      <label className="split-toggle">
        <input type="checkbox" checked={value.split} onChange={toggleSplit} />
        <span>
          <strong>My feet are different sizes</strong>
          <small>Choose a size for each foot — still one pair, same price.</small>
        </span>
      </label>

      {value.split ? (
        <>
          <p className="foot-label">Left foot</p>
          <SizeRow sizes={sizes} selected={value.left} label="Left foot size" onSelect={size => onChange({ ...value, left: size })} />
          <p className="foot-label">Right foot</p>
          <SizeRow sizes={sizes} selected={value.right} label="Right foot size" onSelect={size => onChange({ ...value, right: size })} />
        </>
      ) : (
        <SizeRow sizes={sizes} selected={value.left} label="Size" onSelect={size => onChange({ ...value, left: size, right: size })} />
      )}
    </div>
  );
};

export default SizePicker;
