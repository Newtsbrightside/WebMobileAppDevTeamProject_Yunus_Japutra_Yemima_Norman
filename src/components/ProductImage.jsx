import placeholderImage from '../assets/images/image-placeholder.svg';

const ProductImage = ({ src, alt, onError, ...props }) => {
  const handleError = event => {
    if (event.currentTarget.dataset.fallback === 'true') return;
    event.currentTarget.dataset.fallback = 'true';
    event.currentTarget.src = placeholderImage;
    onError?.(event);
  };

  return <img src={src || placeholderImage} alt={alt} onError={handleError} {...props} />;
};

export default ProductImage;
