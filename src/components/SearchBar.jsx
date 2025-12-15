import { useState, useEffect, useRef } from 'react';
import { PATCH_VERSION } from '../utils/constants';

function SearchBar({ items, onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const wrapperRef = useRef(null);

  // Fermer la liste si on clique ailleurs
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
    setSelectedItem(null); // Reset si on tape

    if (val.length > 1) {
      // Filtre : le nom inclut la recherche (insensible à la casse)
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6); // Max 6 résultats pour pas polluer
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setSelectedItem(item);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(item); // Envoie au parent
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mb-4 z-50">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Tape le nom de l'objet..."
        className="w-full p-4 pl-4 rounded bg-[#091428] border border-lol-gold text-white placeholder-gray-500 outline-none focus:shadow-[0_0_15px_rgba(200,170,110,0.5)] transition"
      />

      {/* LISTE DÉROULANTE */}
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