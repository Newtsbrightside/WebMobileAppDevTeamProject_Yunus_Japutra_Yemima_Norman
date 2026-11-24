import { useState } from 'react';
import { AlertTriangle, ShoppingBag, Sparkles, X } from 'lucide-react';
import Modal from './Modal';
import ProductImage from './ProductImage';
import { api, API_ENABLED } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { FOOT_SIZES, sizeLabel } from '../utils/sizes';

const ACTIVITIES = ['Everyday', 'Running', 'Basketball', 'Casual', 'Lifestyle'];
const money = value => `$${Number(value || 0).toFixed(2)}`;

const PickCard = ({ pick, onAdd }) => (
  <article className="advisor-pick">
    <ProductImage src={pick.shoe.image} alt={pick.shoe.name} />
    <div className="advisor-pick-body">
      <span className="product-category">{pick.shoe.category} · {money(pick.shoe.price)}</span>
      <strong>{pick.shoe.name}</strong>
      <span className="advisor-sizes">
        Order: US {sizeLabel(pick.left_size, pick.right_size)}
        {pick.exact_fit ? <em className="fit-badge exact">Exact fit</em> : <em className="fit-badge">Half size up</em>}
      </span>
      {pick.reason && <p>{pick.reason}</p>}
    </div>
    <button className="btn btn-primary btn-sm" type="button" onClick={() => onAdd(pick)}>
      <ShoppingBag size={13} /> Add
    </button>
  </article>
);

// AI Fit Advisor: the shopper enters the size of each foot, the server asks the LLM
// which of our shoes fit best and returns the picks. AI text is always labelled.
const FitAdvisorModal = ({ onClose, onAddToCart }) => {
  const { user, saveSizes } = useAuth();
  const [form, setForm] = useState({
    left: user?.left_size ?? 9,
    right: user?.right_size ?? 9,
    activity: 'Everyday',
    notes: '',
    remember: true
  });
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [fallback, setFallback] = useState(null);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setAdvice(null);
    setFallback(null);

    if (form.remember && (form.left !== user?.left_size || form.right !== user?.right_size)) {
      saveSizes(form.left, form.right).catch(() => {}); // nice to have; the advice still works without it
    }

    try {
      setAdvice(await api.getFitAdvice({
        left_size: form.left,
        right_size: form.right,
        activity: form.activity,
        notes: form.notes
      }));
    } catch (err) {
      setError(err.message);
      setFallback(err.payload?.fallback_picks || null);
    } finally {
      setBusy(false);
    }
  };

  const addPick = pick => onAddToCart(pick.shoe, { left: pick.left_size, right: pick.right_size });

  return (
    <Modal onClose={onClose} className="advisor-modal">
      <div className="modal-header">
        <div>
          <p className="eyebrow"><Sparkles size={13} /> AI FIT ADVISOR</p>
          <h2>Which pair fits both feet?</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close fit advisor">
          <X size={18} />
        </button>
      </div>

      {!API_ENABLED ? (
        <p className="form-error">The AI advisor needs the live server. This build runs in offline demo mode.</p>
      ) : (
        <form className="advisor-form" onSubmit={submit}>
          <div className="advisor-feet">
            <label htmlFor="advisor-left">
              Left foot (US)
              <select id="advisor-left" value={form.left} onChange={e => update('left', Number(e.target.value))}>
                {FOOT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <label htmlFor="advisor-right">
              Right foot (US)
              <select id="advisor-right" value={form.right} onChange={e => update('right', Number(e.target.value))}>
                {FOOT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <label htmlFor="advisor-activity">
              Mostly for
              <select id="advisor-activity" value={form.activity} onChange={e => update('activity', e.target.value)}>
                {ACTIVITIES.map(activity => <option key={activity}>{activity}</option>)}
              </select>
            </label>
          </div>
          <label htmlFor="advisor-notes">
            Anything else? <span className="optional">optional</span>
            <textarea
              id="advisor-notes"
              rows={2}
              maxLength={300}
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="e.g. wide feet, budget under $150, white colour"
            />
          </label>
          <label className="advisor-remember">
            <input type="checkbox" checked={form.remember} onChange={e => update('remember', e.target.checked)} />
            Remember these sizes on my account (web and phone)
          </label>
          <button className="btn btn-primary full-button" type="submit" disabled={busy}>
            <Sparkles size={15} /> {busy ? 'Asking the AI…' : 'Get my recommendation'}
          </button>
        </form>
      )}

      {error && (
        <p className="advisor-warning" role="alert"><AlertTriangle size={15} /> {error}</p>
      )}

      {advice && (
        <section className="advisor-result" aria-live="polite">
          {advice.ai_generated && (
            <p className="ai-label"><Sparkles size={12} /> AI-generated · {advice.model} · check the size chart before you buy</p>
          )}
          <p className="advisor-summary">{advice.summary}</p>
          {advice.picks.map(pick => <PickCard key={pick.shoe.id} pick={pick} onAdd={addPick} />)}
          {advice.tips && <p className="advisor-tip"><strong>Tip:</strong> {advice.tips}</p>}
        </section>
      )}

      {fallback && fallback.length > 0 && (
        <section className="advisor-result">
          <p className="ai-label not-ai">Size match · not written by AI</p>
          {fallback.map(pick => <PickCard key={pick.shoe.id} pick={pick} onAdd={addPick} />)}
        </section>
      )}
    </Modal>
  );
};

export default FitAdvisorModal;
