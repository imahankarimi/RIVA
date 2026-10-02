"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, FileText, FileJson, FileSpreadsheet, FileX, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { DATE_RANGES, DATE_RANGE_LABEL_KEY, withinDateRange, type DateRange } from "@/lib/dateRange";
import { toCsv, parseCsvPreview, downloadTextFile } from "@/lib/importExport/csv";
import { toXml, toTxt, downloadSpreadsheet, downloadPdf, downloadZip } from "@/lib/importExport/formats";
import { formatCurrency, type BackendCurrency } from "@/lib/currency";
import type { Transaction } from "@/lib/types";

type ExportFormat = "csv" | "json" | "xlsx" | "pdf" | "xml" | "ods" | "txt" | "zip";
const EXPORT_FORMATS: { id: ExportFormat; label: string; available: boolean }[] = [
  { id: "csv", label: "CSV", available: true },
  { id: "json", label: "JSON", available: true },
  { id: "xlsx", label: "XLSX", available: true },
  { id: "pdf", label: "PDF", available: true },
  { id: "xml", label: "XML", available: true },
  { id: "ods", label: "ODS", available: true },
  { id: "txt", label: "TXT", available: true },
  { id: "zip", label: "ZIP", available: true },
];

const RECOGNIZED_IMPORT_EXTENSIONS = ["csv", "json", "xlsx", "pdf", "xml", "ods", "txt", "zip"];
const PARSEABLE_PREVIEW_EXTENSIONS = ["csv", "json"];
const MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function extensionOf(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : "";
}

export function ImportExportModal({
  open,
  onClose,
  transactions,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: BackendCurrency;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"export" | "import">("export");

  return (
    <Modal open={open} onClose={onClose} title={t("importExport.title")} maxWidthClassName="max-w-xl">
      <div className="mb-4 flex gap-1.5 rounded-lg bg-surfaceMuted p-1">
        {(["export", "import"] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-colors duration-150 ${
              tab === id ? "bg-surface text-ink shadow-subtle" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {t(id === "export" ? "importExport.export" : "importExport.import")}
          </button>
        ))}
      </div>

      {tab === "export" ? (
        <ExportPanel transactions={transactions} currency={currency} />
      ) : (
        <ImportPanel />
      )}
    </Modal>
  );
}

function ExportPanel({ transactions, currency }: { transactions: Transaction[]; currency: BackendCurrency }) {
  const { t, locale } = useI18n();
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [range, setRange] = useState<DateRange>("all");
  const [result, setResult] = useState<{ filename: string; count: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  const scoped = useMemo(() => transactions.filter((tx) => withinDateRange(tx.date, range)), [transactions, range]);
  const activeFormat = EXPORT_FORMATS.find((f) => f.id === format)!;

  const handleExport = useCallback(async () => {
    if (!activeFormat.available || scoped.length === 0 || exporting) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `riva-transactions-${stamp}`;
    const rows = scoped.map((tx) => ({
      date: tx.date,
      description: tx.description,
      category: tx.category,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
    }));

    setExporting(true);
    try {
      let filename = `${base}.${format}`;
      switch (format) {
        case "csv":
          downloadTextFile(filename, toCsv(rows), "text/csv;charset=utf-8");
          break;
        case "json":
          downloadTextFile(filename, JSON.stringify(rows, null, 2), "application/json");
          break;
        case "xml":
          downloadTextFile(filename, toXml(rows), "application/xml;charset=utf-8");
          break;
        case "txt":
          downloadTextFile(filename, toTxt(rows), "text/plain;charset=utf-8");
          break;
        case "xlsx":
          await downloadSpreadsheet(rows, filename, "xlsx");
          break;
        case "ods":
          await downloadSpreadsheet(rows, filename, "ods");
          break;
        case "pdf":
          await downloadPdf(rows, filename, t("importExport.title"));
          break;
        case "zip":
          await downloadZip(rows, base, currency);
          filename = `${base}.zip`;
          break;
      }
      setResult({ filename, count: scoped.length });
    } finally {
      setExporting(false);
    }
  }, [activeFormat.available, format, scoped, exporting, currency, t]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[12.5px] font-medium text-ink-faint">{t("importExport.format")}</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPORT_FORMATS.map((f) => (
            <Chip
              key={f.id}
              active={f.id === format}
              disabled={!f.available}
              onClick={() => {
                if (f.available) {
                  setFormat(f.id);
                  setResult(null);
                }
              }}
              className={!f.available ? "cursor-not-allowed opacity-40" : ""}
              title={!f.available ? t("common.comingSoon") : undefined}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12.5px] font-medium text-ink-faint">{t("importExport.scope")}</p>
        <div className="flex flex-wrap gap-1.5">
          {DATE_RANGES.map((r) => (
            <Chip
              key={r}
              active={r === range}
              onClick={() => {
                setRange(r);
                setResult(null);
              }}
            >
              {t(DATE_RANGE_LABEL_KEY[r])}
            </Chip>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-line-soft bg-surfaceMuted/50 p-3.5 text-[13px] text-ink-soft">
        {scoped.length === 0
          ? t("importExport.nothingToExport")
          : t("importExport.willExport", {
              count: scoped.length,
              total: formatCurrency(
                scoped.reduce((sum, tx) => sum + tx.amount, 0),
                currency,
                locale
              ),
            })}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-md bg-moss-100 px-3 py-2.5 text-[12.5px] font-medium text-moss-700"
        >
          <CheckCircle2 size={15} />
          {t("importExport.exportedTo", { filename: result.filename })}
        </motion.div>
      )}

      <Button variant="primary" onClick={handleExport} disabled={scoped.length === 0 || exporting}>
        <Download size={15} />
        {exporting ? t("common.loading") : t("importExport.exportAction")}
      </Button>
    </div>
  );
}

type ImportStage = "idle" | "invalid" | "preview" | "unsupported";

function ImportPanel() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<ImportStage>("idle");
  const [fileMeta, setFileMeta] = useState<{ name: string; sizeKb: number; ext: string } | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = extensionOf(file.name);
      setFileMeta({ name: file.name, sizeKb: Math.round(file.size / 1024), ext });
      setPreview(null);

      if (!RECOGNIZED_IMPORT_EXTENSIONS.includes(ext)) {
        setStage("invalid");
        setErrorReason(t("importExport.unrecognizedFormat"));
        return;
      }
      if (file.size > MAX_IMPORT_SIZE_BYTES) {
        setStage("invalid");
        setErrorReason(t("importExport.tooLarge"));
        return;
      }
      if (!PARSEABLE_PREVIEW_EXTENSIONS.includes(ext)) {
        setStage("unsupported");
        return;
      }

      const text = await file.text();
      if (ext === "csv") {
        setPreview(parseCsvPreview(text));
      } else {
        try {
          const parsed = JSON.parse(text);
          const rows = Array.isArray(parsed) ? parsed.slice(0, 5) : [parsed];
          const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
          setPreview({ headers, rows: rows.map((r: Record<string, unknown>) => headers.map((h) => String(r[h] ?? ""))) });
        } catch {
          setStage("invalid");
          setErrorReason(t("importExport.parseError"));
          return;
        }
      }
      setStage("preview");
    },
    [t]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setStage("idle");
    setFileMeta(null);
    setPreview(null);
    setErrorReason(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors duration-150 ${
          dragging ? "border-signal-500 bg-signal-50" : "border-line hover:border-signal-300"
        }`}
      >
        <Upload size={22} className="text-ink-faint" />
        <p className="text-[13.5px] font-medium text-ink">{t("importExport.dropzoneTitle")}</p>
        <p className="text-[12px] text-ink-faint">{t("importExport.dropzoneBody")}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={RECOGNIZED_IMPORT_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {fileMeta && (
        <div className="flex items-center justify-between rounded-md border border-line-soft px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileIcon ext={fileMeta.ext} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{fileMeta.name}</p>
              <p className="text-[11.5px] text-ink-faint">{fileMeta.sizeKb} KB</p>
            </div>
          </div>
          <button onClick={reset} className="text-[12px] font-medium text-signal-600 hover:text-signal-700">
            {t("common.close")}
          </button>
        </div>
      )}

      {stage === "invalid" && errorReason && (
        <div className="flex items-start gap-2 rounded-md border border-rose-100 bg-rose-100/40 px-3.5 py-2.5 text-[13px] text-rose-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{errorReason}</span>
        </div>
      )}

      {stage === "unsupported" && (
        <div className="flex items-start gap-2 rounded-md border border-amber-100 bg-amber-100/40 px-3.5 py-2.5 text-[13px] text-amber-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{t("importExport.previewUnsupported")}</span>
        </div>
      )}

      {stage === "preview" && preview && (
        <div className="overflow-hidden rounded-md border border-line-soft">
          <div className="max-h-40 overflow-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-surfaceMuted text-ink-faint">
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-2.5 py-1.5 text-start font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="whitespace-nowrap px-2.5 py-1.5 text-ink-soft">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(stage === "preview" || stage === "unsupported") && (
        <div className="rounded-md border border-line-soft bg-surfaceMuted/50 p-3.5 text-[12.5px] text-ink-soft">
          {t("importExport.notConnectedYet")}
        </div>
      )}

      <Button variant="primary" disabled>
        {t("importExport.importAction")}
      </Button>
    </div>
  );
}

function FileIcon({ ext }: { ext: string }) {
  if (ext === "csv" || ext === "txt") return <FileText size={18} className="shrink-0 text-ink-faint" />;
  if (ext === "json" || ext === "xml") return <FileJson size={18} className="shrink-0 text-ink-faint" />;
  if (ext === "xlsx" || ext === "ods") return <FileSpreadsheet size={18} className="shrink-0 text-ink-faint" />;
  return <FileX size={18} className="shrink-0 text-ink-faint" />;
}
