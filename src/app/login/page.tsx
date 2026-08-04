"use client";

import { useState } from "react";
import { getClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請再試一次。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wf-page">
      <div className="wf-center-card wf-card">
        <span className="wf-kicker">登入</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>以 Email 登入</h1>
        <p className="wf-subtitle">輸入你的 email，我們會寄出 magic link 畀你登入。登入後可保存分析結果與 credits。</p>
        {sent ? (
          <div className="wf-note" style={{ marginTop: 20 }}>
            已寄出登入連結到 <strong>{email}</strong>。請檢查你的信箱並點擊連結完成登入。
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: 20, display: "grid", gap: 12 }}>
            <input
              type="email"
              className="wf-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="wf-button" disabled={loading}>
              <Mail size={16} style={{ marginRight: 6 }} />
              {loading ? "寄出中…" : "發送 magic link"}
            </button>
            {error && <div className="wf-note error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}