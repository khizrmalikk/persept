import type { ReactNode } from "react";

// Minimal, dependency-free markdown → React renderer. Supports headings (#, ##, ###),
// paragraphs, `- ` lists, **bold** and [text](url) links. No dangerouslySetInnerHTML.
// Server-usable (pure) so panels can render OFFER.md / other files inline.

// Inline pass: **bold** and [text](url), left-to-right, no nesting of links inside bold.
function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  m = re.exec(text);
  while (m !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b-${i}`}>{m[1]}</strong>);
    } else {
      nodes.push(
        <a
          key={`${keyBase}-a-${i}`}
          href={m[3]}
          target="_blank"
          rel="noreferrer noopener"
        >
          {m[2]}
        </a>,
      );
    }
    last = m.index + m[0].length;
    i++;
    m = re.exec(text);
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string | null | undefined }) {
  if (!source?.trim()) return null;
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (!para.length) return;
    const k = `p-${key++}`;
    blocks.push(<p key={k}>{inline(para.join(" "), k)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const k = `ul-${key++}`;
    blocks.push(
      <ul key={k}>
        {list.map((item, idx) => (
          <li key={`${k}-${idx}-${item.slice(0, 12)}`}>
            {inline(item, `${k}-${idx}`)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const k = `h-${key++}`;
      const text = inline(h[2], k);
      if (h[1].length === 1) blocks.push(<h3 key={k}>{text}</h3>);
      else if (h[1].length === 2) blocks.push(<h4 key={k}>{text}</h4>);
      else blocks.push(<h5 key={k}>{text}</h5>);
    } else if (li) {
      flushPara();
      list.push(li[1]);
    } else if (line.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();

  return <div className="wf-md">{blocks}</div>;
}
