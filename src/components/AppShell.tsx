import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="wireframe-body">
      <div className="wf-shell">
        <div className="wf-topbar">
          <Link href="/" className="wf-brand">
            Brickwise 磚研
            <small>一手樓價單分析工具</small>
          </Link>
          <div className="wf-actions">
            <Link href="/dashboard" className="wf-secondary-button">
              <LayoutDashboard size={16} style={{ marginRight: 6 }} /> Dashboard
            </Link>
            <Link href="/pricing" className="wf-secondary-button">購買 Credits</Link>
            <Link href="/login" className="wf-button">
              <LogIn size={16} style={{ marginRight: 6 }} /> 登入
            </Link>
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