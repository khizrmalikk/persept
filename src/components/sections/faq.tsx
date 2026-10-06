// Shared FAQ accordion list. Native <details>, the "+" rotates 45° when open
// (see .pl-faq styles in landing.css). Used by the homepage and trade pages.

export type FaqItem = { q: string; a: string };

export function FaqList({
  items,
  defaultOpen = 0,
}: {
  items: FaqItem[];
  defaultOpen?: number;
}) {
  return (
    <div className="pl-faq-list">
      {items.map((f, i) => (
        <details className="pl-faq" key={f.q} open={i === defaultOpen}>
          <summary className="pl-faq-q">
            <span>{f.q}</span>
            <span className="pl-faq-plus">+</span>
          </summary>
          <p className="pl-faq-a">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
