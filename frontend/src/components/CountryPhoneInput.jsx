import { useState, useRef, useEffect } from 'react';
import { COUNTRY_DIAL_CODES } from '../utils/countryDialCodes';

const FLAG_EMOJI = (code) => {
  if (!code || code.length !== 2) return '🌐';
  const c = code.toUpperCase();
  if (c === 'CA-W' || c === 'US-C' || c === 'US-W') return '🌐';
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)));
};

export default function CountryPhoneInput({
  countryCode,
  onCountryChange,
  phoneNumber,
  onPhoneChange,
  placeholder = 'Numéro',
  label,
  className = '',
  labelClassName = '',
  inputClassName = '',
  required = true,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = COUNTRY_DIAL_CODES.find((c) => c.code === countryCode) || COUNTRY_DIAL_CODES[0];
  const filtered = search.trim()
    ? COUNTRY_DIAL_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search)
      )
    : COUNTRY_DIAL_CODES;

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onOutside);
    return () => document.removeEventListener('click', onOutside);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`.trim()}>
      {label != null && <label className={labelClassName}>{label}</label>}
      <div className="flex rounded-xl overflow-hidden border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#252525] focus-within:ring-2 focus-within:ring-pink-primary dark:focus-within:ring-pink-400 focus-within:border-pink-primary transition-all">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-3 min-w-[120px] border-e border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 text-start text-sm text-text dark:text-[#f5f5f5] hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
        >
          <span className="text-lg leading-none" aria-hidden>
            {FLAG_EMOJI(selected.code)}
          </span>
          <span className="font-medium">{selected.dialCode}</span>
          <svg className="w-4 h-4 ml-auto shrink-0 text-text/50 dark:text-[#f5f5f5]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-hidden rounded-xl border border-pink-primary/30 dark:border-pink-400/30 bg-white dark:bg-[#1a1a1a] shadow-xl">
            <div className="p-2 border-b border-white/10 dark:border-white/10">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5">
                <svg className="w-4 h-4 text-text/50 dark:text-[#f5f5f5]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un pays..."
                  className="flex-1 bg-transparent text-sm text-text dark:text-[#f5f5f5] placeholder:text-text/40 dark:placeholder:text-[#f5f5f5]/40 focus:outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48 p-1">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onCountryChange(c.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start text-sm transition-colors ${
                    c.code === countryCode
                      ? 'bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400'
                      : 'text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg leading-none">{FLAG_EMOJI(c.code)}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-text/60 dark:text-[#f5f5f5]/60 font-mono">{c.dialCode}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-sm text-text/50 dark:text-[#f5f5f5]/50">Aucun pays trouvé.</p>
              )}
            </div>
          </div>
        )}

        <input
          type="tel"
          required={required}
          placeholder={placeholder}
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
          className={`flex-1 px-4 py-3 bg-transparent text-text dark:text-[#f5f5f5] placeholder:text-text/40 dark:placeholder:text-[#f5f5f5]/40 focus:outline-none min-w-0 ${inputClassName}`}
        />
      </div>
    </div>
  );
}
