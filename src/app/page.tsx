import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="wf-page">
      <div className="wf-card" style={{ textAlign: "center", padding: "48px 28px" }}>
        <span className="wf-kicker">Brickwise 磚研</span>
        <h1 className="wf-title">將混亂價單，變成你睇得明嘅比較表</h1>
        <p className="wf-subtitle" style={{ margin: "16px auto 0" }}>
          上載一手樓價單，系統自動整理成可排序、可篩選、可匯出嘅單位清單，幫你自助揀樓。
        </p>
        <div className="wf-inline" style={{ justifyContent: "center", marginTop: 24 }}>
          <Link href="/login" className="wf-button">開始使用</Link>
          <Link href="/dashboard" className="wf-secondary-button">查看項目</Link>
        </div>
        <div className="wf-note warn" style={{ marginTop: 24, textAlign: "left" }}>
          <strong>重要提示：</strong>本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。
        </div>
      </div>
    </div>
  );
}