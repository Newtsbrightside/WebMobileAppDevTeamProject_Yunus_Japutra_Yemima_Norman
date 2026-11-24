import { useState } from 'react';
import { Check, X } from 'lucide-react';
import ProductImage from './ProductImage';

// Admins change a product picture by pasting an https:// address of an image that is
// already online. Files are not uploaded: the database keeps only the address, and the
// free server's disk would lose uploaded files on every restart.
const EditImageModal = ({ product, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const submit = event => {
    event.preventDefault();
    const value = url.trim();
    if (!value.startsWith('https://')) {
      setError('Paste an image address that starts with https://');
      return;
    }
    onSave(value);
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

        <ProductImage src={url.startsWith('https://') ? url : product.image} alt={`${product.name} preview`} className="image-edit-preview" />
        <form className="image-edit-form" onSubmit={submit}>
          <label htmlFor="product-image-url">Image address (https://)
            <input
              id="product-image-url"
              type="url"
              value={url}
              onChange={event => { setUrl(event.target.value); setError(''); }}
              placeholder="https://example.com/shoe.webp"
              required
            />
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
