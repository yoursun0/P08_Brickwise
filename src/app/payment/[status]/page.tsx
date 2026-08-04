export default async function PaymentPage({ params }: { params: Promise<{ status: string }> }) {
  const { status } = await params;
  const success = status === "success";
  return (
    <div className="wf-page">
      <div className="wf-center-card wf-card" style={{ textAlign: "center" }}>
        <h1 className="wf-title" style={{ fontSize: 32 }}>{success ? "付款成功" : "付款未完成"}</h1>
        <p className="wf-subtitle" style={{ margin: "12px auto 0" }}>
          {success ? "你的 credits 已經增加。返回項目繼續分析。" : "付款流程已取消，你可返回重新購買。"}
        </p>
        <div className="wf-inline" style={{ justifyContent: "center", marginTop: 20 }}>
          <a href="/dashboard" className="wf-button">返回 Dashboard</a>
        </div>
      </div>
    </div>
  );
}