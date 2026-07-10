import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from "lucide-react";
import { StatusBanner } from "@admin/components/AdminUi";
import {
  SPREADSHEET_COLUMNS,
  dbExportFilename,
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
  countRowsBySource,
} from "@admin/services/adminDreamDb";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";

/** 업로드 행 — Firestore에 항상 새 문서로 추가 */
function stripIdsForImport(rows: DreamSpreadsheetRow[]): DreamSpreadsheetRow[] {
  return rows.map(({ id: _id, ...row }) => row);
}

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
  const [sourceFilter, setSourceFilter] = useState<"all" | "user" | "seed">("all");

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
    setMessage(null);
    const buf = await file.arrayBuffer();
    const parsed = stripIdsForImport(parseWorkbookToRows(buf));
    if (parsed.length === 0) {
      setError("시트가 비었거나 열 이름을 확인하세요. (제목·꿈내용·키워드…)");
      return;
    }
    const invalid = parsed.filter((r) => r._errors?.length).length;
    setPendingImport(parsed);
    setMessage(
      invalid > 0
        ? `업로드 ${parsed.length}건 준비 — ${invalid}행 오류 있음. 확인 후 「추가 저장」하세요.`
        : `업로드 ${parsed.length}건 준비 — 기존 DB ${rows.length}건은 그대로 두고 추가됩니다.`,
    );
  };

  const commitImport = async () => {
    if (!pendingImport?.length || !user) return;
    setBusy(true);
    setError(null);
    const beforeCount = rows.length;
    try {
      const result = await importSpreadsheetRows(stripIdsForImport(pendingImport), user.uid);
      setPendingImport(null);
      setMessage(
        `${result.imported}건 추가 저장 완료 · DB ${beforeCount} → ${beforeCount + result.imported}건${
          result.failed ? ` (실패 ${result.failed}건)` : ""
        }`,
      );
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
    const beforeCount = rows.filter((r) => r.id).length;
    try {
      const result = await importSpreadsheetRows(stripIdsForImport(newRows), user.uid);
      setMessage(`${result.imported}건 추가 저장 · DB ${beforeCount} → ${beforeCount + result.imported}건`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const cancelImport = () => {
    setPendingImport(null);
    setMessage(null);
    setError(null);
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

  const filteredEntries = useMemo(() => {
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (sourceFilter === "all") return true;
        return sourceFilter === "user" ? row.source === "user" : row.source !== "user";
      });
  }, [rows, sourceFilter]);

  const rowCounts = useMemo(() => countRowsBySource(rows), [rows]);

  const pendingPreview = pendingImport?.slice(0, 3) ?? [];

  return (
    <div className="space-y-4">
      <section className="card p-4 space-y-3 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text">DB 파일</h3>
          <p className="text-[0.6875rem] text-text-muted">
            업로드는 <strong className="text-text">기존 데이터를 대체하지 않고</strong> 새로
            추가됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => downloadTemplate()}
          >
            <FileSpreadsheet size={14} className="inline mr-1" />
            DB 양식
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => downloadRowsAsXlsx(rows, dbExportFilename())}
            disabled={rows.length === 0 || loading}
          >
            <Download size={14} className="inline mr-1" />
            DB 다운로드
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} className="inline mr-1" />
            DB 업로드
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
        </div>
      </section>

      {pendingImport && (
        <div className="card p-4 space-y-3 border border-accent/30 bg-accent/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text">
                업로드 {pendingImport.length}건 — 추가 저장 대기
              </p>
              <p className="text-xs text-text-muted copy-lines">
                Firestore에 새 문서로 들어갑니다. 현재 DB {rows.length}건은 삭제·수정되지
                않습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={busy}
                onClick={() => void commitImport()}
              >
                {busy ? "추가 저장 중…" : `${pendingImport.length}건 추가 저장`}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={busy}
                onClick={cancelImport}
              >
                취소
              </button>
            </div>
          </div>
          {pendingPreview.length > 0 && (
            <ul className="text-xs text-text-secondary space-y-1 border-t border-border pt-3">
              {pendingPreview.map((row, i) => (
                <li key={i} className="truncate">
                  · {row.title || row.content.slice(0, 40)}
                  {row._errors?.length ? (
                    <span className="text-red-400 ml-1">({row._errors.join(", ")})</span>
                  ) : null}
                </li>
              ))}
              {pendingImport.length > 3 && (
                <li className="text-text-muted">… 외 {pendingImport.length - 3}건</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-sm" onClick={handleLoadClick}>
          <RefreshCw size={14} className="inline mr-1" />
          새로고침
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={() => addBlankRows(10)}>
          + 10행 추가
        </button>
        {!pendingImport && (
          <button
            type="button"
            className="btn-secondary text-sm ml-auto"
            disabled={busy}
            onClick={() => void commitNewRows()}
          >
            {busy ? "저장 중…" : "화면 새 행 추가 저장"}
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

      {message && !pendingImport && <StatusBanner type="success">{message}</StatusBanner>}
      {error && <StatusBanner type="warn">{error}</StatusBanner>}

      <p className="text-[0.6875rem] text-text-muted copy-lines">
        <strong className="text-text">DB 양식</strong>으로 채운 뒤{" "}
        <strong className="text-text">DB 업로드</strong> → 추가 저장.{" "}
        <strong className="text-text">DB 다운로드</strong>는 현재 Firestore 목록 전체를
        xlsx로 받습니다.
      </p>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-text-muted tabular-nums">
            총 {rowCounts.total}건 · 회원 {rowCounts.user} · 시드/기타 {rowCounts.seed}
          </span>
          <span className="text-text-muted">|</span>
          {(["all", "user", "seed"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`chip !text-xs ${sourceFilter === key ? "chip-primary" : ""}`}
              onClick={() => setSourceFilter(key)}
            >
              {key === "all" ? "전체" : key === "user" ? "회원 작성" : "시드·업로드"}
            </button>
          ))}
        </div>
      )}

      <div className="dream-spreadsheet card overflow-hidden border border-border">
        <div className="overflow-auto max-h-[min(70vh,720px)]">
          <table className="w-full border-collapse text-xs min-w-[1800px]">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                <th className="spreadsheet-th w-10">#</th>
                <th className="spreadsheet-th w-8">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    checked={
                      filteredEntries.length > 0 &&
                      filteredEntries.every(({ index }) => selected.has(index))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(filteredEntries.map(({ index }) => index)));
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
              {loading && filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={SPREADSHEET_COLUMNS.length + 3} className="p-8 text-center text-text-muted">
                    Firestore에서 꿈 기록 불러오는 중…
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={SPREADSHEET_COLUMNS.length + 3} className="p-8 text-center text-text-muted">
                    {rows.length > 0
                      ? "필터 조건에 맞는 행이 없습니다."
                      : "데이터 없음 — DB 양식을 받아 채운 뒤 DB 업로드하세요."}
                  </td>
                </tr>
              ) : (
                filteredEntries.map(({ row, index: rowIndex }) => {
                  const isPersisted = Boolean(row.id);
                  const isEditable = !isPersisted;

                  return (
                    <tr
                      key={row.id ?? `new-${rowIndex}`}
                      className={`spreadsheet-tr ${row._errors ? "bg-red-500/5" : ""} ${isPersisted ? "" : "bg-primary/5"}`}
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
                            rows={col.key === "content" || col.key === "afterStory" ? 3 : 2}
                            readOnly={!isEditable}
                            className={`spreadsheet-cell ${isPersisted ? "spreadsheet-cell--readonly" : ""}`}
                            onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                          />
                        </td>
                      ))}
                      <td
                        className="spreadsheet-td text-[0.625rem] text-text-muted font-mono"
                        title={row.id}
                      >
                        {row.id ? row.id.slice(0, 8) : "NEW"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
