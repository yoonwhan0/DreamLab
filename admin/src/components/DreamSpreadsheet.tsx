import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { StatusBanner } from "@admin/components/AdminUi";
import {
  SPREADSHEET_COLUMNS,
  downloadRowsAsXlsx,
  downloadTemplate,
  emptyRow,
  parseWorkbookToRows,
  type DreamSpreadsheetRow,
} from "@admin/lib/dreamSpreadsheetSchema";
import {
  deleteSpreadsheetRows,
  fetchDreamSpreadsheetRows,
  importSpreadsheetRows,
} from "@admin/services/adminDreamDb";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";

export function DreamSpreadsheet() {
  const { user } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<DreamSpreadsheetRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<DreamSpreadsheetRow[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDreamSpreadsheetRows();
      setRows(data);
      setSelected(new Set());
    } catch {
      setError("Firestore 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLoadClick = () => void load();

  const updateCell = (rowIndex: number, key: keyof DreamSpreadsheetRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, [key]: value, _errors: undefined } : r)),
    );
  };

  const addBlankRows = (count = 5) => {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => emptyRow())]);
  };

  const handleFile = async (file: File) => {
    setError(null);
    const buf = await file.arrayBuffer();
    const parsed = parseWorkbookToRows(buf);
    if (parsed.length === 0) {
      setError("시트가 비었거나 열 이름을 확인하세요. (제목·꿈내용·키워드…)");
      return;
    }
    setPendingImport(parsed);
    setMessage(`업로드 ${parsed.length}행 — 아래에서 확인 후 「DB에 저장」을 누르세요.`);
  };

  const commitImport = async () => {
    if (!pendingImport?.length || !user) return;
    setBusy(true);
    setError(null);
    try {
      const result = await importSpreadsheetRows(pendingImport, user.uid);
      setMessage(`저장 완료 ${result.imported}건${result.failed ? ` · 실패 ${result.failed}건` : ""}`);
      setPendingImport(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const commitNewRows = async () => {
    if (!user) return;
    const newRows = rows.filter((r) => !r.id && r.content.trim().length >= 8);
    if (newRows.length === 0) {
      setError("저장할 새 행이 없습니다 (꿈내용 8자 이상, ID 없는 행)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await importSpreadsheetRows(newRows, user.uid);
      setMessage(`신규 ${result.imported}건 저장`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    const ids = [...selected]
      .map((i) => rows[i]?.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      setRows((prev) => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
      return;
    }
    if (!window.confirm(`${ids.length}건 Firestore에서 삭제할까요?`)) return;
    setBusy(true);
    try {
      await deleteSpreadsheetRows(ids);
      setMessage(`${ids.length}건 삭제`);
      await load();
    } catch {
      setError("삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  const displayRows = pendingImport ?? rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-sm" onClick={() => downloadTemplate()}>
          <Download size={14} className="inline mr-1" />
          빈 템플릿 (.xlsx)
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() =>
            downloadRowsAsXlsx(rows, `dreamlab-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
          }
          disabled={rows.length === 0}
        >
          <Download size={14} className="inline mr-1" />
          현재 목록 내보내기
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} className="inline mr-1" />
          엑셀 업로드
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <button type="button" className="btn-secondary text-sm" onClick={handleLoadClick}>
          <RefreshCw size={14} className="inline mr-1" />
          새로고침
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={() => addBlankRows(10)}>
          + 10행 추가
        </button>
        {pendingImport ? (
          <button
            type="button"
            className="btn-primary text-sm ml-auto"
            disabled={busy}
            onClick={() => void commitImport()}
          >
            {busy ? "저장 중…" : `업로드 ${pendingImport.length}건 DB에 저장`}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary text-sm ml-auto"
            disabled={busy}
            onClick={() => void commitNewRows()}
          >
            {busy ? "저장 중…" : "새 행 DB에 저장"}
          </button>
        )}
        {pendingImport && (
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              setPendingImport(null);
              setMessage(null);
            }}
          >
            업로드 취소
          </button>
        )}
        <button
          type="button"
          className="btn-secondary text-sm text-red-400"
          disabled={busy || selected.size === 0}
          onClick={() => void deleteSelected()}
        >
          <Trash2 size={14} className="inline mr-1" />
          선택 삭제 ({selected.size})
        </button>
      </div>

      {message && <StatusBanner type="success">{message}</StatusBanner>}
      {error && <StatusBanner type="warn">{error}</StatusBanner>}

      <p className="text-[0.6875rem] text-text-muted copy-lines">
        엑셀처럼 셀을 직접 수정하거나, 템플릿을 받아 100건 채운 뒤 업로드하세요. 30일후기를
        넣으면 바로 후기 완료로 저장됩니다. 키워드·앵커는 탐색·유사 꿈 통계에 쓰입니다.
      </p>

      <div className="dream-spreadsheet card overflow-hidden border border-border">
        <div className="overflow-auto max-h-[min(70vh,720px)]">
          <table className="w-full border-collapse text-xs min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                <th className="spreadsheet-th w-10">#</th>
                <th className="spreadsheet-th w-8">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    checked={selected.size === displayRows.length && displayRows.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(displayRows.map((_, i) => i)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                  />
                </th>
                {SPREADSHEET_COLUMNS.map((col) => (
                  <th key={col.key} className="spreadsheet-th" style={{ minWidth: col.width }}>
                    {col.header}
                  </th>
                ))}
                <th className="spreadsheet-th w-20">ID</th>
              </tr>
            </thead>
            <tbody>
              {loading && displayRows.length === 0 ? (
                <tr>
                  <td colSpan={SPREADSHEET_COLUMNS.length + 3} className="p-8 text-center text-text-muted">
                    불러오는 중…
                  </td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={SPREADSHEET_COLUMNS.length + 3} className="p-8 text-center text-text-muted">
                    데이터 없음 — 템플릿 다운로드 후 업로드하거나 +10행 추가
                  </td>
                </tr>
              ) : (
                displayRows.map((row, rowIndex) => (
                  <tr
                    key={row.id ?? `new-${rowIndex}`}
                    className={`spreadsheet-tr ${row._errors ? "bg-red-500/5" : ""} ${row.id ? "" : "bg-primary/5"}`}
                  >
                    <td className="spreadsheet-td text-text-muted tabular-nums text-center">
                      {rowIndex + 1}
                    </td>
                    <td className="spreadsheet-td text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(rowIndex)}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(rowIndex);
                            else next.delete(rowIndex);
                            return next;
                          });
                        }}
                      />
                    </td>
                    {SPREADSHEET_COLUMNS.map((col) => (
                      <td key={col.key} className="spreadsheet-td p-0">
                        <textarea
                          value={String(row[col.key as keyof DreamSpreadsheetRow] ?? "")}
                          rows={2}
                          disabled={Boolean(pendingImport)}
                          className="spreadsheet-cell"
                          onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="spreadsheet-td text-[0.625rem] text-text-muted font-mono">
                      {row.id ? row.id.slice(0, 6) : "NEW"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingImport && (
        <p className="text-xs text-accent">
          업로드 미리보기 — 저장 전까지 Firestore에 반영되지 않습니다.
        </p>
      )}
    </div>
  );
}
