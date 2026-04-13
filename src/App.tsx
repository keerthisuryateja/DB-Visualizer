import { useEffect, useMemo, useState } from "react";
import "./App.css";

type ScreenKey = "hub" | "explorer" | "command" | "analytics" | "import";

type Screen = {
  key: ScreenKey;
  label: string;
  section: string;
  subtitle: string;
};

type Scalar = string | number | boolean | null;
type DataRow = Record<string, Scalar>;

type DataSet = {
  name: string;
  rows: DataRow[];
  columns: string[];
  importedAt: string;
};

type ImportEvent = {
  fileName: string;
  rows: number;
  columns: number;
  status: "loaded" | "error";
  note: string;
  at: string;
};

type QueryResult = {
  columns: string[];
  rows: DataRow[];
  error?: string;
};

type ColumnProfile = {
  column: string;
  type: string;
  nullPercent: number;
  uniqueCount: number;
};

type SortDirection = "asc" | "desc";

type InteractionMap = Record<string, number>;

type PersistedAppState = {
  dataSet: DataSet | null;
  importEvents: ImportEvent[];
  queryHistory: string[];
  interactionMap: InteractionMap;
};

const APP_STATE_KEY = "db_visualizer_state_v2";

const screens: Screen[] = [
  {
    key: "hub",
    label: "Dashboard",
    section: "Database Overview",
    subtitle: "Visual control center for ingestion, quality, and query operations.",
  },
  {
    key: "explorer",
    label: "Explorer",
    section: "Table Explorer",
    subtitle: "Inspect rows, column distributions, and data quality signals.",
  },
  {
    key: "command",
    label: "SQL",
    section: "SQL Console",
    subtitle: "Run SELECT queries against the current in-memory dataset.",
  },
  {
    key: "analytics",
    label: "Analytics",
    section: "Schema Analytics",
    subtitle: "Review column types, completeness, and dataset health metrics.",
  },
  {
    key: "import",
    label: "Import",
    section: "Data Import",
    subtitle: "Load CSV or JSON, infer schema, and populate the workspace.",
  },
];

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString();
}

function scalarToString(value: Scalar): string {
  if (value === null) {
    return "NULL";
  }
  return String(value);
}

function parseScalar(raw: string): Scalar {
  const value = raw.trim();
  if (!value || /^null$/i.test(value) || /^n\/a$/i.test(value) || /^undefined$/i.test(value)) {
    return null;
  }
  if (/^(true|false)$/i.test(value)) {
    return value.toLowerCase() === "true";
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  const parsedDate = Date.parse(value);
  if (!Number.isNaN(parsedDate) && /[-/:T]/.test(value)) {
    return new Date(parsedDate).toISOString();
  }
  return value;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function detectDelimiter(headerLine: string): string {
  const delimiters = [",", ";", "\t"];
  let selected = ",";
  let maxParts = 0;

  delimiters.forEach((delimiter) => {
    const parts = parseCsvLine(headerLine, delimiter).length;
    if (parts > maxParts) {
      maxParts = parts;
      selected = delimiter;
    }
  });
  return selected;
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((h, index) => h.trim() || `column_${index + 1}`);

  const rows: DataRow[] = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line, delimiter);
    const row: DataRow = {};
    headers.forEach((header, index) => {
      row[header] = parseScalar(cells[index] ?? "");
    });
    return row;
  });

  return { columns: headers, rows };
}

function parseJson(text: string) {
  const parsed = JSON.parse(text) as unknown;
  let records: unknown[];

  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    const candidate = (parsed as Record<string, unknown>).data ?? (parsed as Record<string, unknown>).rows;
    if (Array.isArray(candidate)) {
      records = candidate;
    } else {
      records = [parsed];
    }
  } else {
    throw new Error("JSON must contain an object or array.");
  }

  const rows = records.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { value: parseScalar(String(item)) };
    }

    const row: DataRow = {};
    Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
      if (value === null) {
        row[key] = null;
      } else if (typeof value === "string") {
        row[key] = parseScalar(value);
      } else if (typeof value === "number" || typeof value === "boolean") {
        row[key] = value;
      } else {
        row[key] = JSON.stringify(value);
      }
    });
    return row;
  });

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  return { columns, rows };
}

function estimateColumnType(values: Scalar[]) {
  const nonNull = values.filter((value) => value !== null);
  if (nonNull.length === 0) {
    return "null";
  }
  const types = new Set(nonNull.map((value) => typeof value));
  if (types.size === 1 && types.has("number")) {
    return "number";
  }
  if (types.size === 1 && types.has("boolean")) {
    return "boolean";
  }

  const allDates = nonNull.every((value) => {
    if (typeof value !== "string") {
      return false;
    }
    const parsed = Date.parse(value);
    return !Number.isNaN(parsed) && /[-/:T]/.test(value);
  });
  if (allDates) {
    return "datetime";
  }

  if (types.size === 1 && types.has("string")) {
    return "string";
  }
  return "mixed";
}

function inferProfiles(dataSet: DataSet | null): ColumnProfile[] {
  if (!dataSet) {
    return [];
  }
  return dataSet.columns.map((column) => {
    const values = dataSet.rows.map((row) => row[column] ?? null);
    const nullCount = values.filter((value) => value === null).length;
    const uniqueCount = new Set(values.map((value) => scalarToString(value))).size;
    return {
      column,
      type: estimateColumnType(values),
      nullPercent: dataSet.rows.length > 0 ? (nullCount / dataSet.rows.length) * 100 : 0,
      uniqueCount,
    };
  });
}

function countDuplicates(dataSet: DataSet | null): number {
  if (!dataSet || dataSet.rows.length === 0) {
    return 0;
  }
  const seen = new Set<string>();
  let duplicates = 0;
  dataSet.rows.forEach((row) => {
    const signature = JSON.stringify(
      dataSet.columns.map((column) => row[column] ?? null),
    );
    if (seen.has(signature)) {
      duplicates += 1;
    } else {
      seen.add(signature);
    }
  });
  return duplicates;
}

function compareValues(left: Scalar, right: Scalar, operator: string): boolean {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const isNumericComparison = !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber);

  const lhs = isNumericComparison ? leftNumber : scalarToString(left);
  const rhs = isNumericComparison ? rightNumber : scalarToString(right);

  if (operator === "=") return lhs === rhs;
  if (operator === "!=") return lhs !== rhs;
  if (operator === ">") return lhs > rhs;
  if (operator === "<") return lhs < rhs;
  if (operator === ">=") return lhs >= rhs;
  if (operator === "<=") return lhs <= rhs;
  return false;
}

function parseWhereValue(rawValue: string): Scalar {
  const trimmed = rawValue.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return parseScalar(trimmed.slice(1, -1));
  }
  return parseScalar(trimmed);
}

function executeSqlLikeQuery(query: string, dataSet: DataSet | null): QueryResult {
  if (!dataSet) {
    return { columns: [], rows: [], error: "No dataset loaded. Import a CSV or JSON file first." };
  }

  const compact = query.trim();
  const match = compact.match(/^select\s+(.+?)(?:\s+from\s+([a-zA-Z_][\w]*))?(?:\s+where\s+(.+?))?(?:\s+limit\s+(\d+))?\s*;?$/i);
  if (!match) {
    return {
      columns: [],
      rows: [],
      error: "Supported syntax: SELECT columns FROM dataset WHERE column operator value LIMIT n",
    };
  }

  const selectedColumnsRaw = match[1].trim();
  const whereRaw = match[3]?.trim();
  const limit = match[4] ? Number(match[4]) : 50;

  const selectedColumns = selectedColumnsRaw === "*"
    ? dataSet.columns
    : selectedColumnsRaw.split(",").map((column) => column.trim()).filter(Boolean);

  const invalidColumns = selectedColumns.filter((column) => !dataSet.columns.includes(column));
  if (invalidColumns.length > 0) {
    return {
      columns: [],
      rows: [],
      error: `Unknown column(s): ${invalidColumns.join(", ")}`,
    };
  }

  let filtered = dataSet.rows;
  if (whereRaw) {
    const whereMatch = whereRaw.match(/^([a-zA-Z_][\w]*)\s*(=|!=|>=|<=|>|<)\s*(.+)$/);
    if (!whereMatch) {
      return {
        columns: [],
        rows: [],
        error: "WHERE supports a single condition, e.g. WHERE age >= 30",
      };
    }
    const [, whereColumn, whereOperator, whereValueRaw] = whereMatch;
    if (!dataSet.columns.includes(whereColumn)) {
      return {
        columns: [],
        rows: [],
        error: `Unknown column in WHERE clause: ${whereColumn}`,
      };
    }
    const whereValue = parseWhereValue(whereValueRaw);
    filtered = filtered.filter((row) => compareValues(row[whereColumn] ?? null, whereValue, whereOperator));
  }

  const rows = filtered.slice(0, Math.max(1, limit)).map((row) => {
    const projected: DataRow = {};
    selectedColumns.forEach((column) => {
      projected[column] = row[column] ?? null;
    });
    return projected;
  });

  return { columns: selectedColumns, rows };
}

function valueForCompare(value: Scalar): number | string {
  if (value === null) {
    return "";
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate) && /[-/:T]/.test(value)) {
    return asDate;
  }
  return value.toLowerCase();
}

function downloadRowsAsCsv(fileName: string, columns: string[], rows: DataRow[]) {
  if (columns.length === 0) {
    return;
  }
  const escape = (value: Scalar) => {
    const raw = scalarToString(value);
    if (/[,"\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column] ?? null)).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function loadPersistedState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedAppState;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      dataSet: parsed.dataSet ?? null,
      importEvents: Array.isArray(parsed.importEvents) ? parsed.importEvents : [],
      queryHistory: Array.isArray(parsed.queryHistory) ? parsed.queryHistory : [],
      interactionMap: parsed.interactionMap ?? {},
    };
  } catch {
    return null;
  }
}

const interactionMeta: Array<{ key: string; label: string }> = [
  { key: "open_import", label: "Open Import" },
  { key: "open_explorer", label: "Open Explorer" },
  { key: "open_analytics", label: "Open Analytics" },
  { key: "file_import", label: "File Import" },
  { key: "table_filter", label: "Table Filter" },
  { key: "table_sort", label: "Table Sort" },
  { key: "pagination", label: "Pagination" },
  { key: "normalize_nulls", label: "Normalize NULL" },
  { key: "remove_duplicates", label: "Remove Duplicates" },
  { key: "run_query", label: "Run Query" },
  { key: "export_query", label: "Export Query" },
  { key: "history_load", label: "History Load" },
];

function HubPage({
  dataSet,
  duplicateCount,
  nullRate,
  setActiveScreen,
  trackInteraction,
}: {
  dataSet: DataSet | null;
  duplicateCount: number;
  nullRate: number;
  setActiveScreen: (screen: ScreenKey) => void;
  trackInteraction: (key: string) => void;
}) {
  const totalRows = dataSet?.rows.length ?? 0;
  const totalColumns = dataSet?.columns.length ?? 0;
  const qualityScore = Math.max(0, Math.round(100 - (nullRate * 0.7 + (totalRows ? (duplicateCount / totalRows) * 100 : 0) * 0.3)));
  const completeness = Math.round(100 - nullRate);

  return (
    <section className="content-grid">
      <article className="hero-card card-float">
        <div>
          <p className="eyebrow">Database Command Center</p>
          <h1>Welcome to the Data Workspace</h1>
          <p>
            Ingest structured files, inspect schema quality, and execute SQL-like
            queries over the active in-memory table.
          </p>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => {
                trackInteraction("open_import");
                setActiveScreen("import");
              }}
            >
              Import Dataset
            </button>
            <button
              className="btn-soft"
              onClick={() => {
                trackInteraction("open_analytics");
                setActiveScreen("analytics");
              }}
            >
              Open Schema Report
            </button>
          </div>
        </div>
        <div className="hero-spacer" aria-hidden="true" />
      </article>

      <div className="stats-row">
        {[
          ["Rows", String(totalRows), "#"],
          ["Columns", String(totalColumns), "∷"],
          ["Completeness", `${completeness}%`, "%"],
          ["Quality Score", `${qualityScore}%`, "Q"],
        ].map(([title, value, icon]) => (
          <article key={title} className="mini-card card-float">
            <span>{icon}</span>
            <div>
              <h3>{title}</h3>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="habitat-grid">
        <article className="card habitat-main card-float">
          <p className="chip">Active Dataset</p>
          <h2>{dataSet?.name ?? "No dataset loaded"}</h2>
          <p>
            {dataSet
              ? `Imported ${formatTimestamp(dataSet.importedAt)}. Duplicate row count: ${duplicateCount}.`
              : "Import CSV or JSON to start profiling rows and running queries."}
          </p>
          <div className="progress-shell">
            <div className="progress-bar" style={{ width: `${completeness}%` }} />
          </div>
          <button
            className="btn-tertiary"
            onClick={() => {
              trackInteraction("open_explorer");
              setActiveScreen("explorer");
            }}
          >
            Open Table Explorer
          </button>
        </article>
        <article className="card habitat-side card-float">
          <p className="chip chip-gold">Data Quality</p>
          <h2>Integrity Summary</h2>
          <ul className="metric-list">
            <li><span>Null Ratio</span><b>{nullRate.toFixed(2)}%</b></li>
            <li><span>Duplicate Rows</span><b>{duplicateCount}</b></li>
            <li><span>Dataset Status</span><b>{dataSet ? "Loaded" : "Waiting"}</b></li>
          </ul>
          <button
            className="btn-outline"
            onClick={() => {
              trackInteraction("open_analytics");
              setActiveScreen("analytics");
            }}
          >
            Inspect Columns
          </button>
        </article>
      </div>
    </section>
  );
}

function ExplorerPage({
  dataSet,
  profiles,
  onNormalizeNulls,
  onRemoveDuplicates,
  duplicateCount,
  trackInteraction,
}: {
  dataSet: DataSet | null;
  profiles: ColumnProfile[];
  onNormalizeNulls: () => void;
  onRemoveDuplicates: () => void;
  duplicateCount: number;
  trackInteraction: (key: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const bars = profiles.slice(0, 7).map((profile) => Math.max(8, Math.round(100 - profile.nullPercent)));

  const filteredRows = useMemo(() => {
    const sourceRows = dataSet?.rows ?? [];
    if (!search.trim() || !dataSet) {
      return sourceRows;
    }
    const token = search.trim().toLowerCase();
    return sourceRows.filter((row) =>
      dataSet.columns.some((column) => scalarToString(row[column] ?? null).toLowerCase().includes(token)),
    );
  }, [dataSet, search]);

  const sortedRows = useMemo(() => {
    if (!sortColumn) {
      return filteredRows;
    }
    return [...filteredRows].sort((leftRow, rightRow) => {
      const left = valueForCompare(leftRow[sortColumn] ?? null);
      const right = valueForCompare(rightRow[sortColumn] ?? null);
      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const activePage = Math.min(page, totalPages);

  const displayRows = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [activePage, sortedRows]);

  const onSortColumn = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
      trackInteraction("table_sort");
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
    trackInteraction("table_sort");
  };

  return (
    <section className="page-columns">
      <div className="stack">
        <article className="card card-float explorer-toolbar">
          <input
            className="table-search"
            placeholder="Filter rows by any value"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPage(1);
              trackInteraction("table_filter");
            }}
          />
          <button
            className="btn-soft"
            onClick={() => {
              if (!dataSet) return;
              downloadRowsAsCsv(`${dataSet.name.replace(/\.[^.]+$/, "")}_filtered.csv`, dataSet.columns, sortedRows);
            }}
            disabled={!dataSet || sortedRows.length === 0}
          >
            Export Filtered CSV
          </button>
        </article>

        <article className="card card-float">
          <div className="section-head">
            <h2>Column Completeness</h2>
            <span className="chip">Live</span>
          </div>
          {bars.length > 0 ? (
            <div className="bars">
              {bars.map((height, i) => (
                <div key={dataSet?.columns[i] ?? i} style={{ height: `${height}%` }} />
              ))}
            </div>
          ) : (
            <p>No dataset loaded. Go to Import and load a file.</p>
          )}
        </article>

        <article className="card table-card card-float">
          <table>
            <thead>
              <tr>
                {(dataSet?.columns ?? ["No Data"]).map((column) => (
                  <th key={column}>
                    <button
                      className="th-button"
                      onClick={() => onSortColumn(column)}
                      disabled={!dataSet}
                      title={column}
                    >
                      {column}
                      {sortColumn === column ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.length > 0 ? (
                displayRows.map((row, index) => (
                  <tr key={index}>
                    {dataSet?.columns.map((column) => (
                      <td key={`${index}-${column}`} title={scalarToString(row[column] ?? null)}>
                        {scalarToString(row[column] ?? null)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(1, dataSet?.columns.length ?? 1)}>No rows to display.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="card card-float explorer-pagination">
          <span>Rows: {sortedRows.length}</span>
          <div className="pager-controls">
            <button
              className="btn-soft"
              onClick={() => {
                trackInteraction("pagination");
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={activePage <= 1}
            >
              Prev
            </button>
            <span>Page {activePage} / {totalPages}</span>
            <button
              className="btn-soft"
              onClick={() => {
                trackInteraction("pagination");
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={activePage >= totalPages}
            >
              Next
            </button>
          </div>
        </article>
      </div>

      <aside className="quick-clean card card-float">
        <div className="quick-head">
          <div className="round-emoji">QC</div>
          <h3>Quality Actions</h3>
        </div>
        <p>Normalize null-like strings and remove exact duplicate rows.</p>
        <button
          className="btn-soft"
          onClick={() => {
            trackInteraction("normalize_nulls");
            onNormalizeNulls();
          }}
          disabled={!dataSet}
        >
          Normalize Null Tokens
        </button>
        <button
          className="btn-soft"
          onClick={() => {
            trackInteraction("remove_duplicates");
            onRemoveDuplicates();
          }}
          disabled={!dataSet}
        >
          Remove Exact Duplicates
        </button>
        <div>
          <div className="clutter-row">
            <span>Duplicate Rows</span>
            <b>{duplicateCount}</b>
          </div>
          <div className="progress-shell thin">
            <div
              className="progress-bar short"
              style={{
                width: `${dataSet?.rows.length ? Math.min(100, (duplicateCount / dataSet.rows.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
        <button className="btn-primary" disabled={!dataSet}>Quality Checks Applied</button>
      </aside>
    </section>
  );
}

function CommandPage({
  dataSet,
  query,
  setQuery,
  runQuery,
  result,
  queryHistory,
  clearQuery,
  exportResult,
  loadHistoryItem,
  trackInteraction,
}: {
  dataSet: DataSet | null;
  query: string;
  setQuery: (value: string) => void;
  runQuery: () => void;
  result: QueryResult | null;
  queryHistory: string[];
  clearQuery: () => void;
  exportResult: () => void;
  loadHistoryItem: (query: string) => void;
  trackInteraction: (key: string) => void;
}) {
  const resultPreview = useMemo(() => {
    if (!result || result.error) {
      return "";
    }
    if (result.rows.length === 0) {
      return "No rows returned.";
    }
    const header = result.columns.join(" | ");
    const lines = result.rows.slice(0, 12).map((row) => result.columns.map((column) => scalarToString(row[column] ?? null)).join(" | "));
    return [header, ...lines].join("\n");
  }, [result]);

  return (
    <section className="page-columns">
      <div className="stack">
        <article className="terminal card-float">
          <div className="terminal-top">
            <span />
            <span />
            <span />
            <small>SQL CONSOLE v1.0</small>
          </div>
          <div className="query-box">
            <textarea
              className="query-input"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  trackInteraction("run_query");
                  runQuery();
                }
              }}
              placeholder="SELECT * FROM dataset LIMIT 20;"
            />
          </div>
          <pre>
{result?.error
  ? `ERROR: ${result.error}`
  : resultPreview || "Run a query to see result preview."}
          </pre>
          <div className="terminal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                trackInteraction("run_query");
                runQuery();
              }}
              disabled={!dataSet}
            >
              Run Query
            </button>
            <button
              className="btn-soft"
              onClick={() => {
                trackInteraction("export_query");
                exportResult();
              }}
              disabled={!result || !!result.error || result.rows.length === 0}
            >
              Export Result CSV
            </button>
            <button className="btn-tertiary" onClick={clearQuery}>Clear</button>
          </div>
        </article>

        <article className="tip-row">
          <div className="tip card-float"><b>Query Pattern</b> SELECT col1, col2 FROM dataset WHERE col1 &gt; 10 LIMIT 50</div>
          <div className="tip card-float"><b>Execution Scope</b> Queries run in memory on the active imported dataset.</div>
          <div className="tip card-float"><b>Supported Clauses</b> SELECT, FROM, WHERE (single condition), LIMIT</div>
        </article>
      </div>

      <aside className="scroll card card-float">
        <h3>Query History</h3>
        <ul>
          {queryHistory.length > 0 ? (
            queryHistory.map((item, index) => (
              <li key={`${index}-${item}`}>
                <button
                  className="history-item"
                  onClick={() => {
                    trackInteraction("history_load");
                    loadHistoryItem(item);
                  }}
                >
                  {item}
                </button>
              </li>
            ))
          ) : (
            <li>No queries executed yet.</li>
          )}
        </ul>
        <button className="btn-outline" onClick={clearQuery}>Reset Console</button>
      </aside>
    </section>
  );
}

function AnalyticsPage({
  dataSet,
  profiles,
  nullRate,
  interactionMap,
}: {
  dataSet: DataSet | null;
  profiles: ColumnProfile[];
  nullRate: number;
  interactionMap: InteractionMap;
}) {
  const topProfiles = profiles.slice(0, 3);
  const typeBreakdown = useMemo(() => {
    return profiles.reduce<Record<string, number>>((acc, profile) => {
      acc[profile.type] = (acc[profile.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [profiles]);

  const maxInteraction = Math.max(1, ...Object.values(interactionMap));

  return (
    <section className="content-grid analytics-grid">
      <article className="card network card-float">
        <div className="section-head">
          <h2>Schema Relationship View</h2>
          <span className="chip">Inferred</span>
        </div>
        <svg viewBox="0 0 800 260" aria-label="relationship graph">
          <path d="M120 180 Q 390 40 670 180" />
          <path d="M120 180 Q 390 260 670 180" />
          <circle cx="120" cy="180" r="30" />
          <circle cx="670" cy="180" r="36" />
          <circle cx="390" cy="80" r="24" />
          <text x="58" y="230">Rows</text>
          <text x="618" y="230">Columns</text>
          <text x="333" y="35">Indexes</text>
        </svg>
      </article>

      <article className="card burn card-float">
        <h2>Column Null Ratios</h2>
        {topProfiles.length > 0 ? topProfiles.map((profile) => {
          const pct = Math.min(100, Math.round(profile.nullPercent));
          return (
            <div key={profile.column} className="burn-row">
              <span>{profile.column} ({profile.type})</span>
              <div className="progress-shell thin">
                <div className="progress-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        }) : <p>No profile data available.</p>}
      </article>

      <article className="card climb card-float">
        <h2>Type Distribution</h2>
        <div className="bars slim">
          {Object.entries(typeBreakdown).length > 0 ? Object.entries(typeBreakdown).map(([type, count]) => (
            <div key={type} style={{ height: `${Math.max(12, (count / profiles.length) * 100)}%` }} title={type} />
          )) : <div style={{ height: "12%" }} />}
        </div>
      </article>

      <article className="card zen card-float">
        <h2>Dataset Health</h2>
        <div className="zen-ring">{Math.round(100 - nullRate)}%</div>
        <div className="zen-grid">
          <div><b>{dataSet?.rows.length ?? 0}</b><span>Total Rows</span></div>
          <div><b>{dataSet?.columns.length ?? 0}</b><span>Total Columns</span></div>
          <div><b>{profiles.filter((profile) => profile.type === "number").length}</b><span>Numeric Columns</span></div>
          <div><b>{profiles.reduce((acc, profile) => acc + profile.uniqueCount, 0)}</b><span>Distinct Values (sum)</span></div>
        </div>
      </article>

      <article className="card heatmap card-float">
        <h2>Interaction Heatmap Analyzer</h2>
        <div className="heatmap-grid">
          {interactionMeta.map((item) => {
            const count = interactionMap[item.key] ?? 0;
            const intensity = Math.min(1, count / maxInteraction);
            return (
              <div
                key={item.key}
                className="heatmap-cell"
                style={{
                  background: `rgba(0, 107, 27, ${0.08 + intensity * 0.72})`,
                }}
                title={`${item.label}: ${count}`}
              >
                <span>{item.label}</span>
                <b>{count}</b>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function ImportPage({
  onSelectFile,
  importEvents,
  dataSet,
}: {
  onSelectFile: (file: File) => void;
  importEvents: ImportEvent[];
  dataSet: DataSet | null;
}) {
  return (
    <section className="content-grid import-grid">
      <article className="card helper card-float">
        <h2>Import Instructions</h2>
        <p>Load CSV or JSON to initialize the active dataset.</p>
        <ul>
          <li>Schema inference and data type detection</li>
          <li>NULL token normalization support</li>
          <li>Immediate table and query availability</li>
        </ul>
        <p>Accepted file types: .csv, .json</p>
      </article>

      <article className="drop card-float">
        <div className="drop-target">
          <div className="upload-mark">⤴</div>
          <h2>Drop Or Select Data File</h2>
          <p>Use file picker to load data into memory.</p>
          <label className="btn-primary" htmlFor="dataset-file">Select File</label>
          <input
            id="dataset-file"
            type="file"
            accept=".csv,.json,application/json,text/csv"
            style={{ display: "none" }}
            onChange={(event) => {
              const selectedFile = event.currentTarget.files?.[0];
              if (selectedFile) {
                onSelectFile(selectedFile);
              }
              event.currentTarget.value = "";
            }}
          />
          <small>{dataSet ? `Active dataset: ${dataSet.name}` : "No file loaded"}</small>
        </div>
      </article>

      <article className="card recent card-float">
        <h2>Import Activity</h2>
        <div className="recent-grid">
          {importEvents.length > 0 ? importEvents.map((event, index) => (
            <div key={`${event.fileName}-${index}`}>
              <b>{event.fileName}</b>
              <span>
                {event.status === "loaded"
                  ? `${event.rows} rows · ${event.columns} columns · ${formatTimestamp(event.at)}`
                  : `Error · ${event.note}`}
              </span>
            </div>
          )) : null}
          {importEvents.length === 0 && (
            <div>
              <b>No imports yet</b>
              <span>Select a file to initialize your workspace data.</span>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

function App() {
  const persisted = useMemo(() => loadPersistedState(), []);
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("hub");
  const [dataSet, setDataSet] = useState<DataSet | null>(persisted?.dataSet ?? null);
  const [importEvents, setImportEvents] = useState<ImportEvent[]>(persisted?.importEvents ?? []);
  const [query, setQuery] = useState("SELECT * FROM dataset LIMIT 20;");
  const [queryHistory, setQueryHistory] = useState<string[]>(persisted?.queryHistory ?? []);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [interactionMap, setInteractionMap] = useState<InteractionMap>(persisted?.interactionMap ?? {});

  const trackInteraction = (key: string) => {
    setInteractionMap((current) => ({
      ...current,
      [key]: (current[key] ?? 0) + 1,
    }));
  };

  useEffect(() => {
    const payload: PersistedAppState = {
      dataSet,
      importEvents,
      queryHistory,
      interactionMap,
    };
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
  }, [dataSet, importEvents, queryHistory, interactionMap]);

  const profiles = useMemo(() => inferProfiles(dataSet), [dataSet]);
  const duplicateCount = useMemo(() => countDuplicates(dataSet), [dataSet]);
  const nullRate = useMemo(() => {
    if (!dataSet || dataSet.rows.length === 0 || dataSet.columns.length === 0) {
      return 0;
    }
    const totalCells = dataSet.rows.length * dataSet.columns.length;
    const nullCells = dataSet.rows.reduce((count, row) => {
      return count + dataSet.columns.reduce((acc, column) => acc + ((row[column] ?? null) === null ? 1 : 0), 0);
    }, 0);
    return (nullCells / totalCells) * 100;
  }, [dataSet]);

  const onSelectFile = async (file: File) => {
    try {
      trackInteraction("file_import");
      const text = await file.text();
      const extension = file.name.split(".").pop()?.toLowerCase();
      const parsed = extension === "json" ? parseJson(text) : parseCsv(text);
      const nextDataSet: DataSet = {
        name: file.name,
        rows: parsed.rows,
        columns: parsed.columns,
        importedAt: new Date().toISOString(),
      };
      setDataSet(nextDataSet);
      setImportEvents((events) => [
        {
          fileName: file.name,
          rows: parsed.rows.length,
          columns: parsed.columns.length,
          status: "loaded" as const,
          note: "Loaded successfully",
          at: new Date().toISOString(),
        },
        ...events,
      ].slice(0, 9));
      setActiveScreen("hub");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse file";
      setImportEvents((events) => [
        {
          fileName: file.name,
          rows: 0,
          columns: 0,
          status: "error" as const,
          note: message,
          at: new Date().toISOString(),
        },
        ...events,
      ].slice(0, 9));
    }
  };

  const onNormalizeNulls = () => {
    if (!dataSet) return;
    const normalizeTokens = new Set(["null", "n/a", "na", "undefined", "-"]);
    const rows = dataSet.rows.map((row) => {
      const next: DataRow = {};
      dataSet.columns.forEach((column) => {
        const value = row[column] ?? null;
        if (typeof value === "string" && normalizeTokens.has(value.trim().toLowerCase())) {
          next[column] = null;
        } else {
          next[column] = value;
        }
      });
      return next;
    });
    setDataSet({ ...dataSet, rows });
  };

  const onRemoveDuplicates = () => {
    if (!dataSet) return;
    const seen = new Set<string>();
    const rows = dataSet.rows.filter((row) => {
      const signature = JSON.stringify(dataSet.columns.map((column) => row[column] ?? null));
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
    setDataSet({ ...dataSet, rows });
  };

  const runQuery = () => {
    const result = executeSqlLikeQuery(query, dataSet);
    setQueryResult(result);
    if (!result.error) {
      setQueryHistory((history) => [query.trim(), ...history.filter((item) => item !== query.trim())].slice(0, 12));
    }
  };

  const clearQuery = () => {
    setQuery("SELECT * FROM dataset LIMIT 20;");
    setQueryResult(null);
  };

  const exportResult = () => {
    if (!queryResult || queryResult.error || queryResult.rows.length === 0) {
      return;
    }
    downloadRowsAsCsv("query_result.csv", queryResult.columns, queryResult.rows);
  };

  const loadHistoryItem = (queryText: string) => {
    setQuery(queryText);
  };

  const selected = screens.find((screen) => screen.key === activeScreen) ?? screens[0];

  return (
    <div className="app-shell">
      <header className="topbar card-float">
        <div className="brand">DB VISUALIZER</div>
        <nav>
          {screens.map((screen) => (
            <button
              key={screen.key}
              onClick={() => {
                if (screen.key === "import") trackInteraction("open_import");
                if (screen.key === "explorer") trackInteraction("open_explorer");
                if (screen.key === "analytics") trackInteraction("open_analytics");
                setActiveScreen(screen.key);
              }}
              className={screen.key === activeScreen ? "active" : ""}
            >
              {screen.label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <span className="health-pill">Data Health: {Math.round(100 - nullRate)}%</span>
          <button className="icon-btn" aria-label="notifications">🔔</button>
          <button className="icon-btn" aria-label="settings">⚙</button>
          <div className="avatar">DB</div>
        </div>
      </header>

      <aside className="sidebar card-float">
        <div className="profile">
          <div className="avatar large">Σ</div>
          <div>
            <strong>Workspace</strong>
            <p>{dataSet?.name ?? "No active dataset"}</p>
          </div>
        </div>
        <div className="section-title">{selected.section}</div>
        <p className="subtitle">{selected.subtitle}</p>
        <ul className="rail-links">
          <li className="selected">Connect</li>
          <li>Explore</li>
          <li>Query</li>
          <li>Analyze</li>
          <li>Export</li>
        </ul>
        <button
          className="btn-primary"
          onClick={() => {
            trackInteraction("open_import");
            setActiveScreen("import");
          }}
        >
          Load Data Source
        </button>
      </aside>

      <main className="canvas">
        {activeScreen === "hub" && (
          <HubPage
            dataSet={dataSet}
            duplicateCount={duplicateCount}
            nullRate={nullRate}
            setActiveScreen={setActiveScreen}
            trackInteraction={trackInteraction}
          />
        )}
        {activeScreen === "explorer" && (
          <ExplorerPage
            dataSet={dataSet}
            profiles={profiles}
            onNormalizeNulls={onNormalizeNulls}
            onRemoveDuplicates={onRemoveDuplicates}
            duplicateCount={duplicateCount}
            trackInteraction={trackInteraction}
          />
        )}
        {activeScreen === "command" && (
          <CommandPage
            dataSet={dataSet}
            query={query}
            setQuery={setQuery}
            runQuery={runQuery}
            result={queryResult}
            queryHistory={queryHistory}
            clearQuery={clearQuery}
            exportResult={exportResult}
            loadHistoryItem={loadHistoryItem}
            trackInteraction={trackInteraction}
          />
        )}
        {activeScreen === "analytics" && (
          <AnalyticsPage
            dataSet={dataSet}
            profiles={profiles}
            nullRate={nullRate}
            interactionMap={interactionMap}
          />
        )}
        {activeScreen === "import" && (
          <ImportPage
            onSelectFile={onSelectFile}
            importEvents={importEvents}
            dataSet={dataSet}
          />
        )}
      </main>
    </div>
  );
}

export default App;
