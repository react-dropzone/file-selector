"use client";

import {useCallback, useRef, useState} from "react";
import {fromEvent} from "../../src";

interface Row {
  path: string;
  type: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export function Playground() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const filesInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);

  const parse = useCallback(async (evt: Event | React.SyntheticEvent) => {
    try {
      setError(null);
      const result = await fromEvent(evt as Event);
      const files = result.filter((f): f is File => f instanceof File);
      setRows(
        files.map(f => ({
          path: (f as {path?: string}).path ?? f.name,
          type: f.type || "—",
          size: f.size
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows(null);
    }
  }, []);

  const clear = useCallback(() => {
    if (filesInput.current) filesInput.current.value = "";
    if (dirInput.current) dirInput.current.value = "";
    setRows(null);
    setError(null);
  }, []);

  return (
    <div className="fsp">
      <style>{styles}</style>

      <div
        className={active ? "fsp-drop fsp-drop--active" : "fsp-drop"}
        onDragEnter={e => {
          e.preventDefault();
          setActive(true);
        }}
        onDragOver={e => {
          e.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={e => {
          e.preventDefault();
          setActive(false);
          parse(e);
        }}
      >
        <p className="fsp-hint">Drag &amp; drop here</p>
        <p className="fsp-sub">Files or an entire folder — nothing is uploaded.</p>
        <div className="fsp-buttons">
          <button type="button" onClick={() => filesInput.current?.click()}>
            Select files
          </button>
          <button type="button" onClick={() => dirInput.current?.click()}>
            Select folder
          </button>
        </div>
      </div>

      <input ref={filesInput} type="file" multiple hidden onChange={parse} />
      {/* `webkitdirectory` is not in React's typings; set it on the DOM node directly. */}
      <input
        ref={el => {
          if (el) el.setAttribute("webkitdirectory", "");
          (dirInput as {current: HTMLInputElement | null}).current = el;
        }}
        type="file"
        hidden
        onChange={parse}
      />

      <div className="fsp-results">
        <div className="fsp-results-head">
          <strong>Parsed files</strong>
          {rows && rows.length > 0 && (
            <>
              <span className="fsp-count">
                {rows.length} File object{rows.length === 1 ? "" : "s"}
              </span>
              <button type="button" className="fsp-clear" onClick={clear}>
                Clear
              </button>
            </>
          )}
        </div>

        {error ? (
          <p className="fsp-error">{error}</p>
        ) : rows === null ? (
          <p className="fsp-empty">No files yet. Drop something above or use the buttons.</p>
        ) : rows.length === 0 ? (
          <p className="fsp-empty">No File objects were produced.</p>
        ) : (
          <div className="fsp-table-wrap">
            <table className="fsp-table">
              <thead>
                <tr>
                  <th>path</th>
                  <th>type</th>
                  <th>size</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.path}-${i}`}>
                    <td className="fsp-path">{r.path}</td>
                    <td>
                      <span className="fsp-badge">{r.type}</span>
                    </td>
                    <td className="fsp-size">{formatSize(r.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
.fsp { --fsp-border: rgba(128,128,128,0.3); --fsp-accent: #4d8dff; --fsp-accent-soft: rgba(77,141,255,0.1); --fsp-muted: rgba(128,128,128,0.9); margin: 1.5rem 0; }
.fsp-drop { border: 2px dashed var(--fsp-border); border-radius: 14px; padding: 2.5rem 1.5rem; text-align: center; transition: border-color .15s, background .15s; }
.fsp-drop--active { border-color: var(--fsp-accent); background: var(--fsp-accent-soft); }
.fsp-hint { font-size: 1.1rem; font-weight: 600; margin: 0 0 .25rem; }
.fsp-sub { color: var(--fsp-muted); font-size: .9rem; margin: 0 0 1.25rem; }
.fsp-buttons { display: flex; gap: .625rem; justify-content: center; flex-wrap: wrap; }
.fsp button { font: inherit; font-size: .9rem; font-weight: 500; color: inherit; background: transparent; border: 1px solid var(--fsp-border); border-radius: 8px; padding: .5rem 1rem; cursor: pointer; transition: border-color .15s, background .15s; }
.fsp button:hover { border-color: var(--fsp-accent); background: var(--fsp-accent-soft); }
.fsp-results { margin-top: 1.75rem; }
.fsp-results-head { display: flex; align-items: baseline; gap: .75rem; margin-bottom: .75rem; }
.fsp-count { font-size: .85rem; color: var(--fsp-muted); }
.fsp-clear { margin-left: auto; font-size: .8rem !important; padding: .2rem .625rem !important; }
.fsp-empty, .fsp-error { font-size: .9rem; padding: .5rem 0; }
.fsp-empty { color: var(--fsp-muted); }
.fsp-error { color: #ff6b6b; }
.fsp-table-wrap { overflow-x: auto; }
.fsp-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.fsp-table th { text-align: left; color: var(--fsp-muted); font-weight: 600; font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; padding: .375rem .625rem; border-bottom: 1px solid var(--fsp-border); }
.fsp-table td { padding: .5rem .625rem; border-bottom: 1px solid var(--fsp-border); vertical-align: top; }
.fsp-table tbody tr:last-child td { border-bottom: none; }
.fsp-path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
.fsp-size { color: var(--fsp-muted); white-space: nowrap; }
.fsp-badge { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .75rem; background: rgba(128,128,128,0.15); border-radius: 5px; padding: .05rem .375rem; }
`;
