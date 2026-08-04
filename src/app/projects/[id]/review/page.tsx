export default function ReviewPage() {
  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Extraction Review</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>確認抽取結果</h1>
        <p className="wf-subtitle">系統對抽取結果信心不足，請協助確認少量欄位。</p>
      </div>
      <div className="wf-note warn">
        <strong>稍後推出：</strong>Extraction Review 修正功能將於稍後推出。
      </div>
    </div>
  );
}