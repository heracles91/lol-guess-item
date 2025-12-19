import { useState, useEffect, useRef } from 'react';
import { PATCH_VERSION } from '../utils/constants';

function SearchBar({ items, onSelect, t }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.length > 1) {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(item);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mb-4 z-50">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={t.search_placeholder} // Utilisation de la traduction ici
        className="w-full p-4 pl-4 rounded bg-[#091428] border border-lol-gold text-white placeholder-gray-500 outline-none focus:shadow-[0_0_15px_rgba(200,170,110,0.5)] transition"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 w-full bg-[#0F1923] border border-lol-gold mt-1 rounded shadow-2xl max-h-60 overflow-y-auto scrollbar-hide">
          {suggestions.map((item) => (
            <li 
              key={item.id}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 p-3 hover:bg-lol-gold hover:text-black cursor-pointer transition border-b border-gray-800 last:border-0"
            >
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}/img/item/${item.image.full}`}
                alt={item.name}
                className="w-8 h-8 rounded border border-gray-600"
              />
              <span className="font-bold text-sm">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;