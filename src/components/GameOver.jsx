function GameOver({ score, onRestart }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-lol-dark text-lol-gold p-4">
      <h1 className="text-4xl font-bold mb-4 text-red-500">DEFEAT</h1>
      <p className="text-xl mb-8">Score final : {score}</p>
      <button 
        onClick={onRestart}
        className="px-8 py-3 bg-lol-gold text-lol-dark font-bold rounded hover:bg-yellow-600 transition"
      >
        REJOUER
      </button>
    </div>
  );
}

export default GameOver;