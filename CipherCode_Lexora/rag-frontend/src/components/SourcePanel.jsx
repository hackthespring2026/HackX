export default function SourcePanel({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources">
      <h4>Sources</h4>
      <ul>
        {sources.map((s, i) => (
          <li key={i}>
            {s.source} — page {s.page}
          </li>
        ))}
      </ul>
    </div>
  );
}
