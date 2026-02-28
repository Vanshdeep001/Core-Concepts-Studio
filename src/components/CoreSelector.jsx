const CORES = [1, 2, 4];

export default function CoreSelector({ cores, onChange }) {
    return (
        <div>
            <label className="form-label">CPU Cores</label>
            <div className="chip-group">
                {CORES.map(c => (
                    <button
                        key={c}
                        className={`chip${cores === c ? ' active' : ''}`}
                        onClick={() => onChange(c)}
                    >
                        {c === 1 ? '⬛ Single' : c === 2 ? '⬛⬛ Dual' : '⬛⬛⬛⬛ Quad'}
                    </button>
                ))}
            </div>
        </div>
    );
}
