import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import { HudPanel } from "./HudPanel";

const URL_RE = /(https?:\/\/[^\s)]+)/;

// scout's watch list (SOURCES.md) as a name / why table. Any URL in a row is pulled
// out of the visible text into a small link anchor. Collapsed by default.
export async function SourcesPanel({
  agentId = "scout",
}: {
  agentId?: string;
}) {
  const file = await getAgentFile(agentId, "SOURCES.md");
  const table = parseMarkdownTable(file?.content);

  if (!file || !table.rows.length) {
    return (
      <HudPanel title="sources">
        <p className="empty">{agentId} has not written its source list yet</p>
      </HudPanel>
    );
  }

  const nameCol = table.columns.includes("name") ? "name" : table.columns[0];
  const whyCol = table.columns.includes("why")
    ? "why"
    : (table.columns.find((c) => c !== nameCol) ?? table.columns[0]);

  return (
    <HudPanel
      collapsible
      title={`sources (${table.rows.length})`}
      right="watch list"
    >
      <table className="table wf-sources-table">
        <thead>
          <tr>
            <th>name</th>
            <th>why</th>
            <th aria-label="link" />
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => {
            const nameRaw = row[nameCol] ?? "";
            const whyRaw = row[whyCol] ?? "";
            const url =
              URL_RE.exec(nameRaw)?.[1] ?? URL_RE.exec(whyRaw)?.[1] ?? "";
            const name =
              nameRaw
                .replace(URL_RE, "")
                .replace(/[[\]()]/g, "")
                .trim() || "—";
            const why = whyRaw
              .replace(URL_RE, "")
              .replace(/[[\]()]/g, "")
              .trim();
            return (
              <tr key={`${i}-${name}`}>
                <td>{name}</td>
                <td className="muted">{why || "—"}</td>
                <td>
                  {url ? (
                    <a
                      className="wf-src-link"
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`open ${name}`}
                      title={url}
                    >
                      ↗
                    </a>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </HudPanel>
  );
}
