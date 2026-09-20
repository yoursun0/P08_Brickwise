"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UploadForm({ projectId, credits }: { projectId: string; credits: number | null }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [kind, setKind] = useState<"ok" | "warn" | "error">("warn");

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST", body });
      const raw = await res.text();
      let data: {
        ok?: boolean;
        cached?: boolean;
        charged?: number;
        redirect?: string;
        message?: string;
      } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setKind("error");
        setMessage(res.ok ? "伺服器回傳無法解析。" : `伺服器錯誤 (${res.status})。`);
        return;
      }
      if (res.status === 401) {
        router.push(`/login?next=/projects/${projectId}/upload`);
        return;
      }
      if (res.status === 402) {
        setKind("error");
        setMessage(data.message ?? "credits 不足。");
        return;
      }
      if (!res.ok || data.ok === false) {
        setKind("error");
        setMessage(data.message ?? "解析失敗。");
        return;
      }
      setKind("ok");
      setMessage(data.cached ? "已使用先前解析結果（不扣 credits）。" : `已扣除 ${data.charged} credit。`);
      router.push(data.redirect ?? `/projects/${projectId}/results`);
      router.refresh();
    } catch (err) {
      setKind("error");
      setMessage(err instanceof Error ? err.message : "網絡錯誤，請再試一次。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Upload</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>上載價單</h1>
        <p className="wf-subtitle">
          只接受有文字層的價單表格 PDF（例如 芊御 3號價單）。攻略圖 / 掃描檔暫不支援。
        </p>
        {credits != null && (
          <p className="wf-muted" style={{ marginTop: 8 }}>目前餘額：{credits} credits。PDF 每 5 頁扣 1 credit；同一檔案不重覆扣。</p>
        )}
      </div>
      <label className="wf-dropzone" style={{ cursor: "pointer" }}>
        <input
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <strong>{file ? file.name : "拖放或點擊選擇 PDF"}</strong>
        <span className="wf-muted">{file ? `${Math.round(file.size / 1024)} KB` : "支援 PDF，最多 10 頁"}</span>
      </label>
      {message && (
        <div className={`wf-note ${kind === "error" ? "error" : kind === "ok" ? "" : "warn"}`}>
          {message}
        </div>
      )}
      <button className="wf-button" type="button" disabled={!file || busy} onClick={analyze}>
        {busy ? "分析中…" : "開始分析"}
      </button>
    </div>
  );
}
