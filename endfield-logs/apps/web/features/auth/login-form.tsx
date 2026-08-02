"use client";

import { FormEvent, useEffect, useState } from "react";

import { buildApiUrl } from "../../lib/api/client";

type AuthResponse = {
  status: "authenticated";
  user: {
    id: string;
    email: string;
    nickname: string;
    isAdmin: boolean;
  };
};

type SendCodeResponse = {
  ok: boolean;
  cooldownSeconds: number;
  debugCode?: string | null;
};

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);

  useEffect(() => {
    if (codeCooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCodeCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [codeCooldown]);

  async function handleSendCode() {
    if (!email) {
      setMessage("请先填写邮箱。");
      return;
    }

    setCodeSending(true);
    setMessage(null);
    try {
      const response = await fetch(buildApiUrl("/api/auth/send-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          purpose: "web_login",
        }),
      });
      const data = (await response.json()) as SendCodeResponse | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(("error" in data && data.error?.message) || "验证码发送失败。");
      }
      const sendData = data as SendCodeResponse;
      setCodeCooldown(sendData.cooldownSeconds || 60);
      setMessage(sendData.debugCode ? `验证码已发送。开发验证码：${sendData.debugCode}` : "验证码已发送，请查收邮箱。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "验证码发送失败。");
    } finally {
      setCodeSending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "register" && !verificationCode) {
      setMessage("请先输入邮箱验证码。");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          nickname: mode === "register" ? nickname : undefined,
          code: mode === "register" ? verificationCode : undefined,
          purpose: "web_login",
        }),
      });
      const data = (await response.json()) as AuthResponse | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(("error" in data && data.error?.message) || "登录失败。");
      }
      const authData = data as AuthResponse;
      setMessage(
        `已登录：${authData.user.nickname}${authData.user.isAdmin ? "，正在进入后台。" : "，正在进入管理页。"}`
      );
      window.location.assign(authData.user.isAdmin ? "/admin" : "/manage");
      return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel auth-panel" style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="eyebrow">账号入口</div>
        <h2 style={{ margin: "6px 0 8px" }}>{mode === "login" ? "邮箱密码登录" : "注册新账号"}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {mode === "login"
            ? "使用邮箱和密码直接登录网站，管理员账号会进入全局控制后台，普通账号会进入自己的管理页。"
            : "注册时需要先接收邮箱验证码，验证通过后会创建账号并直接登录当前站点。"}
        </p>
      </div>

      <div className="auth-tab-row">
        <button
          className={`button-chip${mode === "login" ? " is-active" : ""}`}
          onClick={() => {
            setMode("login");
            setMessage(null);
          }}
          type="button"
        >
          登录
        </button>
        <button
          className={`button-chip${mode === "register" ? " is-active" : ""}`}
          onClick={() => {
            setMode("register");
            setMessage(null);
          }}
          type="button"
        >
          注册
        </button>
      </div>

      <form className="panel-inset auth-form" onSubmit={handleSubmit}>
        <label className="field-stack">
          <span>邮箱</span>
          <input
            autoComplete="email"
            className="field-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="请输入邮箱地址"
            type="email"
            value={email}
          />
        </label>

        {mode === "register" ? (
          <label className="field-stack">
            <span>昵称</span>
            <input
              autoComplete="nickname"
              className="field-input"
              onChange={(event) => setNickname(event.target.value)}
              placeholder="请输入公开显示昵称"
              value={nickname}
            />
          </label>
        ) : null}

        <label className="field-stack">
          <span>密码</span>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="field-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "login" ? "请输入密码" : "至少 8 位密码"}
            type="password"
            value={password}
          />
        </label>

        {mode === "register" ? (
          <label className="field-stack">
            <span>邮箱验证码</span>
            <div className="auth-code-row">
              <input
                autoComplete="one-time-code"
                className="field-input"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 位验证码"
                value={verificationCode}
              />
              <button
                className="button-secondary"
                disabled={loading || codeSending || codeCooldown > 0 || !email}
                onClick={handleSendCode}
                type="button"
              >
                {codeSending ? "发送中..." : codeCooldown > 0 ? `${codeCooldown}s` : "发送验证码"}
              </button>
            </div>
          </label>
        ) : null}

        <button
          className="button-primary"
          disabled={loading || !email || !password || (mode === "register" && (!nickname || !verificationCode))}
          type="submit"
        >
          {loading ? (mode === "login" ? "登录中..." : "注册中...") : mode === "login" ? "登录" : "注册并登录"}
        </button>
      </form>

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
    </section>
  );
}
