import Link from "next/link";

import { ContractTagSummary } from "../../../components/contract-tag-summary";
import { StateBlock } from "../../../components/state-block";
import { fetchApiServer } from "../../../lib/api/server";
import type { ShareSummaryResponse } from "../../../lib/api/types";
import { hasContractTagData } from "../../../lib/contract-tags";
import { formatBossDisplayName, formatBossEyebrow } from "../../../lib/format/boss-display";
import { formatDurationMs } from "../../../lib/format/duration";

type SharePageProps = {
  params: Promise<{ battleId: string }>;
};

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: SharePageProps) {
  const { battleId } = await params;
  try {
    const summary = await fetchApiServer<ShareSummaryResponse>(`/api/battles/${battleId}/share-summary`);
    const hasContractTags = hasContractTagData(summary.contractTagScore, summary.contractTags);
    const displayTitle = formatBossDisplayName(summary);
    const displayEyebrow = formatBossEyebrow(summary);
    return (
      <div className="page-stack">
        <section className="panel panel-muted" style={{ display: "grid", gap: 16, maxWidth: 860 }}>
          <div className="breadcrumbs">首页 / 分享摘要 / {displayTitle}</div>
          <div className="eyebrow">{displayEyebrow}</div>
          <div>
            <h1 style={{ margin: "0 0 10px" }}>{displayTitle}</h1>
            <p className="muted" style={{ margin: 0 }}>
              这是面向外部转发的摘要卡页面，保留最核心的战斗信息，并提供进入完整报告的入口。
            </p>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="muted">通关时长</span>
              <strong>{formatDurationMs(summary.durationMs)}</strong>
            </div>
            <div className="summary-item">
              <span className="muted">上传者</span>
              <strong>{summary.uploaderNickname}</strong>
            </div>
            <div className="summary-item" style={{ gridColumn: "1 / -1" }}>
              <span className="muted">队伍阵容</span>
              <strong>{summary.rosterSummary.join(" / ")}</strong>
            </div>
            {hasContractTags ? (
              <div className="summary-item" style={{ gridColumn: "1 / -1" }}>
                <span className="muted">所选 tag</span>
                <ContractTagSummary score={summary.contractTagScore} tags={summary.contractTags} />
              </div>
            ) : null}
          </div>
          <div className="hero-actions">
            <Link className="button-primary" href={`/battle/${summary.battleId}`}>
              查看完整报告
            </Link>
            <Link className="button-secondary" href={`/boss/dung01_group_bossrush01`}>
              返回竞速榜单
            </Link>
          </div>
        </section>

        <section className="panel" style={{ maxWidth: 860 }}>
          <div className="table-toolbar">
            <div>
              <div className="eyebrow">摘要说明</div>
              <h2 style={{ margin: "6px 0 0" }}>这页包含什么</h2>
            </div>
          </div>
          <div className="info-list">
            <span>适合把一场 battle 的最小关键信息直接发给队友或群聊。</span>
            <span>如果要看完整时间轴、技能构成和角色统计，请进入“完整报告”。</span>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    return (
      <StateBlock
        title="分享摘要暂时不可用"
        description={error instanceof Error ? error.message : "分享摘要加载失败。"}
      />
    );
  }
}

export const revalidate = 0;
