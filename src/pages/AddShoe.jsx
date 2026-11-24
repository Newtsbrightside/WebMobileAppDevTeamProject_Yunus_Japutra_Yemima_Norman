import { useState } from 'react';
import { ArrowLeft, Check, ImagePlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

// "8, 8.5, 9" → [8, 8.5, 9]; null when something is not a half-size number between 3 and 16.
const parseSizeList = text => {
  const sizes = text.split(',').map(part => Number(part.trim())).filter(part => !Number.isNaN(part));
  const valid = sizes.length > 0 && sizes.every(size => size >= 3 && size <= 16 && Number.isInteger(size * 2));
  return valid ? sizes : null;
};

const AddShoe = () => {
  const { addShoe } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', category: 'Running', price: '', stock: '', sizes: '8, 8.5, 9, 9.5, 10, 10.5, 11, 12', image: '', description: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    const sizes = parseSizeList(form.sizes);
    if (!form.name.trim() || !form.price || !form.stock) {
      setError('Complete the required fields before publishing.');
      return;
    }
    if (!sizes) {
      setError('Sizes must be US sizes separated by commas, e.g. 8, 8.5, 9.');
      return;
    }
    if (form.image && !form.image.startsWith('https://')) {
      setError('The image address must start with https://');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await addShoe({
        name: form.name.trim(),
        brand: 'Finish Line',
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        sizes,
        image_url: form.image.trim() || null,
        description: form.description.trim() || 'A new Finishline release ready for the collection.'
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="form-page animate-fade-in">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to dashboard</Link>
      <div className="form-intro">
        <p className="eyebrow">INVENTORY / NEW ENTRY</p>
        <h1>Add a <em>new pair.</em></h1>
        <p className="muted">Create a product card for the Finishline collection. It is saved on the server and appears on the web and in the phone app.</p>
      </div>
      <form className="shoe-form" onSubmit={submit}>
        <div className="form-section">
          <div className="form-section-heading"><span>01</span><div><h2>Product details</h2><p>Name the pair and place it in the right edit.</p></div></div>
          <label htmlFor="shoe-name">Product name<input id="shoe-name" name="name" value={form.name} onChange={update} placeholder="e.g. Motion 01 Runner" /></label>
          <div className="form-two">
            <label htmlFor="shoe-category">Category<select id="shoe-category" name="category" value={form.category} onChange={update}><option>Running</option><option>Basketball</option><option>Casual</option><option>Lifestyle</option></select></label>
            <label htmlFor="shoe-price">Price (USD)<input id="shoe-price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} placeholder="145.00" /></label>
          </div>
          <div className="form-two">
            <label htmlFor="shoe-stock">Initial stock<input id="shoe-stock" name="stock" type="number" min="0" value={form.stock} onChange={update} placeholder="24" /></label>
            <label htmlFor="shoe-sizes">Sizes (US, comma-separated)<input id="shoe-sizes" name="sizes" value={form.sizes} onChange={update} placeholder="8, 8.5, 9" /></label>
          </div>
          <label htmlFor="shoe-description">Description <span className="optional">optional</span><input id="shoe-description" name="description" value={form.description} onChange={update} placeholder="Used by the AI Fit Advisor to explain its picks" /></label>
        </div>
        <div className="form-section">
          <div className="form-section-heading"><span>02</span><div><h2>Product image</h2><p>Paste the https:// address of a picture that is already online.</p></div></div>
          <label htmlFor="shoe-image">Image URL <span className="optional">optional</span><input id="shoe-image" name="image" value={form.image} onChange={update} placeholder="https://..." /></label>
          <div className="image-placeholder"><ImagePlus size={22} /><span>Only the address is stored in the database<br /><small>Recommended: square image, minimum 800px</small></span></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}><Check size={17} /> {busy ? 'Publishing…' : 'Publish shoe'}</button>
      </form>
    </main>
  );
};

export default AddShoe;
