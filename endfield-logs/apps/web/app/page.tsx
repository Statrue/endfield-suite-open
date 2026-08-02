import Link from "next/link";
import type { CSSProperties } from "react";

import { CharacterAvatar } from "../components/character-avatar";
import { ContractTagSummary } from "../components/contract-tag-summary";
import { StateBlock } from "../components/state-block";
import { fetchPublicApiServer } from "../lib/api/public-server";
import type { HotBossCard } from "../lib/api/types";
import { hasContractTagData } from "../lib/contract-tags";
import { formatBossDisplayName, formatBossEyebrow } from "../lib/format/boss-display";
import { formatDurationMs } from "../lib/format/duration";

function getRankTone(scorePercent: number): string {
  if (scorePercent >= 100) {
    return "is-gold";
  }
  if (scorePercent >= 95) {
    return "is-orange";
  }
  if (scorePercent >= 75) {
    return "is-purple";
  }
  if (scorePercent >= 50) {
    return "is-blue";
  }
  if (scorePercent >= 25) {
    return "is-green";
  }
  return "is-gray";
}

const bossCardBackgrounds: Record<string, string> = {
  dung01_group_bossrush01: "/images/boss-bg/dung01_group_bossrush01.webp",
  dung01_group_bossrush02: "/images/boss-bg/dung01_group_bossrush02.webp",
  dung01_group_bossrush03: "/images/boss-bg/dung01_group_bossrush03.webp",
  dung02_group_bossrush01: "/images/boss-bg/dung02_group_bossrush01.webp",
  dung02_group_bossrush02: "/images/boss-bg/dung02_group_bossrush02.webp",
  dung02_group_bossrush03: "/images/boss-bg/dung02_group_bossrush03.webp",
  dung02_group_minibossrush01: "/images/boss-bg/dung02_group_minibossrush01.webp",
  dung02_group_minibossrush02: "/images/boss-bg/dung02_group_minibossrush02.webp",
  indie_group_ccdg: "/images/boss-bg/indie_group_ccdg.webp",
  indie_battletower001_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower002_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower003_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower004_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower005_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower006_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower007_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_battletower008_ex: "/images/boss-bg/indie_group_twdg.svg",
  indie_hard001: "/images/boss-bg/indie_hard001_s.webp",
  indie_hard001_s: "/images/boss-bg/indie_hard001_s.webp",
  indie_hard002: "/images/boss-bg/indie_hard002_s.webp",
  indie_hard002_s: "/images/boss-bg/indie_hard002_s.webp",
  indie_hard003: "/images/boss-bg/indie_hard003_s.webp",
  indie_hard003_s: "/images/boss-bg/indie_hard003_s.webp",
  indie_hard004: "/images/boss-bg/indie_hard004_s.webp",
  indie_hard004_s: "/images/boss-bg/indie_hard004_s.webp",
  indie_hard005: "/images/boss-bg/indie_hard005_s.webp",
  indie_hard005_s: "/images/boss-bg/indie_hard005_s.webp",
  indie_hard006: "/images/boss-bg/indie_hard006_s.webp",
  indie_hard006_s: "/images/boss-bg/indie_hard006_s.webp",
  indie_hard007: "/images/boss-bg/indie_hard007_s.webp",
  indie_hard007_s: "/images/boss-bg/indie_hard007_s.webp",
  indie_hard008: "/images/boss-bg/indie_hard008_s.webp",
  indie_hard008_s: "/images/boss-bg/indie_hard008_s.webp",
  indie_hard009: "/images/boss-bg/indie_hard009_s.webp",
  indie_hard009_s: "/images/boss-bg/indie_hard009_s.webp",
  indie_hard010: "/images/boss-bg/indie_hard010_s.webp",
  indie_hard010_s: "/images/boss-bg/indie_hard010_s.webp",
  indie_hard011: "/images/boss-bg/indie_hard011_s.webp",
  indie_hard011_s: "/images/boss-bg/indie_hard011_s.webp",
  indie_hard012: "/images/boss-bg/indie_hard012_s.webp",
  indie_hard012_s: "/images/boss-bg/indie_hard012_s.webp",
  indie_hard013: "/images/boss-bg/indie_hard013_s.webp",
  indie_hard013_s: "/images/boss-bg/indie_hard013_s.webp",
  indie_hard014: "/images/boss-bg/indie_hard014_s.webp",
  indie_hard014_s: "/images/boss-bg/indie_hard014_s.webp",
  indie_hard015: "/images/boss-bg/indie_hard015_s.webp",
  indie_hard015_s: "/images/boss-bg/indie_hard015_s.webp",
  indie_hard016: "/images/boss-bg/indie_hard016_s.webp",
  indie_hard016_s: "/images/boss-bg/indie_hard016_s.webp",
  indie_hard017: "/images/boss-bg/indie_hard017_s.webp",
  indie_hard017_s: "/images/boss-bg/indie_hard017_s.webp",
  indie_hard018: "/images/boss-bg/indie_hard018_s.webp",
  indie_hard018_s: "/images/boss-bg/indie_hard018_s.webp",
  indie_hard019: "/images/boss-bg/indie_hard019_s.webp",
  indie_hard019_s: "/images/boss-bg/indie_hard019_s.webp",
  indie_hard020: "/images/boss-bg/indie_hard020_s.webp",
  indie_hard020_s: "/images/boss-bg/indie_hard020_s.webp",
  indie_hard021: "/images/boss-bg/indie_hard021_s.webp",
  indie_hard021_s: "/images/boss-bg/indie_hard021_s.webp",
  indie_hard022: "/images/boss-bg/indie_hard022_s.webp",
  indie_hard022_s: "/images/boss-bg/indie_hard022_s.webp",
  indie_hard023: "/images/boss-bg/indie_hard023_s.webp",
  indie_hard023_s: "/images/boss-bg/indie_hard023_s.webp",
  indie_hard024: "/images/boss-bg/indie_hard024_s.webp",
  indie_hard024_s: "/images/boss-bg/indie_hard024_s.webp",
  indie_hard025: "/images/boss-bg/indie_hard025_s.webp",
  indie_hard025_s: "/images/boss-bg/indie_hard025_s.webp",
};

const bossCardPositions: Record<string, string> = {
  dung01_group_bossrush01: "center center",
  dung01_group_bossrush02: "center center",
  dung01_group_bossrush03: "center center",
  dung02_group_bossrush01: "center center",
  dung02_group_bossrush02: "center center",
  dung02_group_minibossrush01: "center center",
  indie_group_ccdg: "center center",
  indie_battletower001_ex: "center center",
  indie_battletower002_ex: "center center",
  indie_battletower003_ex: "center center",
  indie_battletower004_ex: "center center",
  indie_battletower005_ex: "center center",
  indie_battletower006_ex: "center center",
  indie_battletower007_ex: "center center",
  indie_battletower008_ex: "center center",
};

function getBossCardStyle(bossSlug: string): CSSProperties {
  return {
    "--boss-card-bg": `url(${bossCardBackgrounds[bossSlug] ?? bossCardBackgrounds.dung01_group_bossrush01})`,
    "--boss-card-position": bossCardPositions[bossSlug] ?? "center center",
  } as CSSProperties;
}

export const revalidate = 30;

export default async function HomePage() {
  try {
    const hotBosses = await fetchPublicApiServer<HotBossCard[]>("/api/home/hot-bosses", {
      next: { revalidate },
    });
    const bossOverviewRows = hotBosses
      .map((boss) => ({
        bossSlug: boss.bossSlug,
        bossName: boss.bossName,
        bossDisplayName: formatBossDisplayName(boss),
        dungeonName: boss.dungeonName,
        bestRun: boss.topSpeedRuns[0] ?? null,
      }))
      .sort((left, right) => {
        if (!left.bestRun && !right.bestRun) {
          return 0;
        }
        if (!left.bestRun) {
          return 1;
        }
        if (!right.bestRun) {
          return -1;
        }
        return left.bestRun.durationMs - right.bestRun.durationMs;
      });

    return (
      <div className="page-stack">
        <section className="hero-grid">
          <article className="panel panel-muted" style={{ display: "grid", gap: 16 }}>
            <div className="eyebrow">终末地战斗档案</div>
            <div>
              <h1 className="hero-title">公开榜单、竞速排行与整场战斗报告。</h1>
              <p className="hero-copy">
                首页按资料站方式组织入口，优先展示热门首领、最快记录和可直接进入的报告页面。
                现在已经可以浏览竞速榜单、战斗详情、分享摘要和登录流程。
              </p>
            </div>
          </article>
        </section>

        <section className="home-grid">
          <div className="panel" id="crisis-replay-overview" style={{ display: "grid", gap: 14 }}>
            <div className="section-heading">
              <div>
                <div className="eyebrow">热门首领</div>
                <h2>竞速入口</h2>
              </div>
              <span className="muted">共 {hotBosses.length} 个首领，按首页推荐顺序展示。</span>
            </div>

            <div className="grid-cards">
              {hotBosses.map((boss) => (
                <article className="panel-inset boss-card" key={boss.bossSlug} style={getBossCardStyle(boss.bossSlug)}>
                  <div className="boss-card-info">
                    <div className="boss-card-head">
                      <div>
                        <div className="eyebrow">热门首领</div>
                        <h3 style={{ margin: "6px 0 0" }}>竞速入口</h3>
                        <div className="eyebrow boss-card-dungeon">{formatBossEyebrow(boss)}</div>
                        <strong className="boss-card-name">{formatBossDisplayName(boss)}</strong>
                      </div>
                    </div>

                    <Link className="button-chip boss-card-link" href={`/boss/${boss.bossSlug}`}>
                      进入榜单
                    </Link>
                  </div>

                  <div className="table-wrap boss-card-table-wrap">
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>排名</th>
                          <th>主C</th>
                          <th>上传者</th>
                          <th>时长</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boss.topSpeedRuns.map((run, index) => (
                          <tr key={run.battleId}>
                            <td>
                              <span className={`mini-rank-badge ${getRankTone(run.scorePercent ?? 0)}`}>
                                #{index + 1}
                              </span>
                            </td>
                            <td>
                              <Link className="character-link" href={`/battle/${run.battleId}`}>
                                <CharacterAvatar
                                  avatarUrl={run.characterAvatarUrl}
                                  name={run.characterName}
                                  size="sm"
                                />
                                <span>{run.characterName}</span>
                              </Link>
                            </td>
                            <td>{run.uploaderNickname}</td>
                            <td>
                              <div style={{ display: "grid", gap: 4 }}>
                                <span>{formatDurationMs(run.durationMs)}</span>
                                {hasContractTagData(run.contractTagScore, run.contractTags) ? (
                                  <ContractTagSummary compact score={run.contractTagScore} tags={run.contractTags} />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel panel-muted" style={{ alignContent: "start", display: "grid", gap: 14 }}>
            <div>
              <div className="eyebrow">快速入口</div>
              <h2 style={{ margin: "6px 0 0" }}>从这里开始</h2>
            </div>
            <div className="directory-list">
              <Link className="directory-button" href="/boss/dung01_group_bossrush01">
                <strong>危境再现</strong>
                <small>固定收录 6 个首领</small>
              </Link>
              <Link className="directory-button" href="/boss/dung02_group_minibossrush01">
                <strong>危境碎片</strong>
                <small>巨山犼兽 / 蚀影噪雷</small>
              </Link>
              <Link className="directory-button" href="/boss/indie_group_ccdg">
                <strong>危机合约</strong>
                <small>活动榜单</small>
              </Link>
              <Link className="directory-button" href="/boss/indie_battletower001_ex">
                <strong>战争回响</strong>
                <small>全部 8 个残酷关卡</small>
              </Link>
              <Link className="directory-button" href="/boss/indie_hard007_s">
                <strong>影拓丰碑1期</strong>
                <small>收录 9 个苦难副本</small>
              </Link>
              <Link className="directory-button" href="/boss/indie_hard013_s">
                <strong>影拓丰碑2期</strong>
                <small>浊流具现 · 6 个苦难副本</small>
              </Link>
              <Link className="directory-button" href="/boss/indie_hard016_s">
                <strong>影拓丰碑3期</strong>
                <small>死寂争鸣 · 6 个苦难副本</small>
              </Link>
              <Link className="directory-button" href="/boss/indie_hard022_s">
                <strong>影拓丰碑4期</strong>
                <small>山中见犼 · 4 个苦难副本</small>
              </Link>
            </div>
          </aside>
        </section>

        <section className="panel">
          <div className="table-toolbar">
            <div>
              <div className="eyebrow">首领总览</div>
              <h2 style={{ margin: "6px 0 0" }}>最快记录速查表</h2>
            </div>
            <span className="muted">按当前首页数据中的最好通关时间排序。</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>首领</th>
                  <th>副本</th>
                  <th>当前最快</th>
                  <th>角色</th>
                  <th>上传者</th>
                  <th>入口</th>
                </tr>
              </thead>
              <tbody>
                {bossOverviewRows.map((row, index) => (
                  <tr className={index === 0 ? "is-featured" : undefined} key={row.bossSlug}>
                    <td>{row.bossDisplayName}</td>
                    <td>{row.dungeonName}</td>
                    <td>
                      {row.bestRun ? (
                        <div style={{ display: "grid", gap: 4 }}>
                          <span>{formatDurationMs(row.bestRun.durationMs)}</span>
                          {hasContractTagData(row.bestRun.contractTagScore, row.bestRun.contractTags) ? (
                            <ContractTagSummary
                              compact
                              score={row.bestRun.contractTagScore}
                              tags={row.bestRun.contractTags}
                            />
                          ) : null}
                        </div>
                      ) : (
                        "--:--"
                      )}
                    </td>
                    <td>
                      {row.bestRun ? (
                        <span className="character-inline">
                          <CharacterAvatar
                            avatarUrl={row.bestRun.characterAvatarUrl}
                            name={row.bestRun.characterName}
                            size="sm"
                          />
                          <span>{row.bestRun.characterName}</span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{row.bestRun?.uploaderNickname ?? "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link className="button-chip" href={`/boss/${row.bossSlug}`}>
                          榜单
                        </Link>
                        {row.bestRun ? (
                          <Link className="button-chip" href={`/battle/${row.bestRun.battleId}`}>
                            报告
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <footer className="site-filing-footer">
          <a href="https://beian.miit.gov.cn/" rel="noopener noreferrer nofollow" target="_blank">
            渝ICP备2025075658号
          </a>
        </footer>
      </div>
    );
  } catch (error) {
    return (
      <StateBlock
        title="首页数据暂时不可用"
        description={error instanceof Error ? error.message : "首页数据加载失败。"}
      />
    );
  }
}
