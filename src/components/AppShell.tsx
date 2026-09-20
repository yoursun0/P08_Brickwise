import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";

export function AppShell({
  children,
  credits,
  email,
}: {
  children: React.ReactNode;
  credits?: number | null;
  email?: string | null;
}) {
  return (
    <div className="wireframe-body">
      <div className="wf-shell">
        <div className="wf-topbar">
          <Link href="/" className="wf-brand">
            Brickwise 磚研
            <small>一手樓價單分析工具</small>
          </Link>
          <div className="wf-actions">
            {credits != null && (
              <span className="wf-pill-count">{credits} credits</span>
            )}
            <Link href="/dashboard" className="wf-secondary-button">
              <LayoutDashboard size={16} style={{ marginRight: 6 }} /> Dashboard
            </Link>
            {email ? (
              <span className="wf-muted" style={{ fontSize: 13 }}>{email}</span>
            ) : (
              <Link href="/login" className="wf-button">
                <LogIn size={16} style={{ marginRight: 6 }} /> 登入
              </Link>
            )}
          </div>
        </div>
        {children}
        <div className="wf-footer">
          本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。用戶應自行核對原始價單並向專業人士查詢。
        </div>
      </div>
    </div>
  );
}
