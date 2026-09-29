import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import ProductImage from './ProductImage';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const EditImageModal = ({ product, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product.image);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return undefined;

    const objectUrl = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const submit = event => {
    event.preventDefault();
    setError('');

    if (file && !ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a PNG, JPEG, or WEBP image.');
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      setError('The image must be 2 MB or smaller.');
      return;
    }
    if (url && !url.startsWith('https://')) {
      setError('Image URLs must start with https://.');
      return;
    }
    if (!file && !url.trim()) {
      setError('Choose an image file or enter an HTTPS image URL.');
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => onSave(String(reader.result));
      reader.onerror = () => setError('The selected image could not be read.');
      reader.readAsDataURL(file);
      return;
    }

    onSave(url.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <section className="modal-card image-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-image-title" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">INVENTORY / IMAGE</p>
            <h2 id="edit-image-title">Edit {product.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cancel image edit"><X size={18} /></button>
        </div>

        <ProductImage src={preview} alt={`${product.name} preview`} className="image-edit-preview" />
        <form className="image-edit-form" onSubmit={submit}>
          <label htmlFor="product-image-file">Upload image
            <input id="product-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const selectedFile = event.target.files?.[0] || null; setFile(selectedFile); setUrl(''); setPreview(selectedFile ? URL.createObjectURL(selectedFile) : product.image); }} />
          </label>
          <label htmlFor="product-image-url">HTTPS image URL <span className="optional">optional</span>
            <input id="product-image-url" type="url" value={url} onChange={event => { setUrl(event.target.value); setFile(null); setPreview(event.target.value || product.image); }} placeholder="https://example.com/shoe.webp" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="image-edit-actions">
            <button className="btn btn-light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit"><Check size={16} /> Save image</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default EditImageModal;
