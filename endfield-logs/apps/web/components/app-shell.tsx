import type { ReactNode } from "react";

import { AuthNav } from "../features/auth/auth-nav";
import { SiteNavLinks } from "./site-nav-links";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  return (
    <div>
      <header className="site-header">
        <div className="page-shell">
          <div className="site-header-inner">
            <div className="site-brand">
              <div className="site-brand-title">终末地战斗日志</div>
              <div className="site-brand-subtitle">Endfield Battle Reports</div>
            </div>
            <nav className="site-nav">
              <SiteNavLinks />
              <AuthNav />
            </nav>
          </div>
          <div className="site-status-row">
            <span className="pill pill-accent">测试环境</span>
            <span>站点当前仍为测试入口，但公开榜单、竞速记录与整场战斗报告只展示真实上传数据。</span>
          </div>
        </div>
      </header>
      <main className="page-shell page-content">{children}</main>
    </div>
  );
}
