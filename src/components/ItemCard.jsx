function ItemCard({ item }) {
  if (!item) return null;

  return (
    <div className="flex flex-col items-center mb-8 animate-fade-in">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <img 
          src={`https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/${item.id}.png`} 
          alt={item.name}
          className="relative w-24 h-24 border-2 border-lol-gold rounded-md shadow-2xl"
        />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-lol-blue tracking-wide text-center">
        {item.name}
      </h2>
    </div>
  );
}

export default ItemCard;