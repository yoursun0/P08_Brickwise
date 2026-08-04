import Link from "next/link";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Upload</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>上載價單</h1>
        <p className="wf-subtitle">拖放 PDF / PNG / JPG 價單到下方，系統會自動解析。</p>
      </div>
      <div className="wf-dropzone">
        <strong>拖放檔案到此</strong>
        <span className="wf-muted">支援 PDF / PNG / JPG</span>
      </div>
      <div className="wf-note warn">
        <strong>稍後推出：</strong>檔案解析功能將於稍後推出。現可前往示範項目結果頁查看已解析數據。
      </div>
      <Link href={`/projects/${id}/results`} className="wf-button">查看示範結果 →</Link>
    </div>
  );
}