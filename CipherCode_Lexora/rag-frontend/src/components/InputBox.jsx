export default function InputBox({ value, onChange, onSend, loading }) {
  return (
    <div className="input-box">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask about the documentation..."
        disabled={loading}
      />
      <button onClick={onSend} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}
