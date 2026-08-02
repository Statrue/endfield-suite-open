import type { CSSProperties } from "react";
import Link from "next/link";

import { CharacterAvatar } from "../../../../components/character-avatar";
import { StateBlock } from "../../../../components/state-block";
import { fetchApiServer } from "../../../../lib/api/server";
import type { BossCharacterStatisticsResponse } from "../../../../lib/api/types";
import { formatBossDisplayName, formatBossEyebrow } from "../../../../lib/format/boss-display";

type StatisticsRange = BossCharacterStatisticsResponse["range"];
type StatisticsMetric = BossCharacterStatisticsResponse["metric"];
type StatisticsPotential = BossCharacterStatisticsResponse["potential"];
type StatisticsRow = BossCharacterStatisticsResponse["rows"][number];

type BossStatisticsPageProps = {
  params: Promise<{ bossSlug: string }>;
  searchParams: Promise<{ metric?: StatisticsMetric; range?: StatisticsRange; potential?: StatisticsPotential }>;
};

const rangeOptions: { key: StatisticsRange; label: string }[] = [
  { key: "7d", label: "最近 7 天" },
  { key: "14d", label: "最近 14 天" },
  { key: "30d", label: "最近 30 天" },
  { key: "all", label: "全部时间" },
];

const potentialOptions: { key: StatisticsPotential; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "0", label: "0潜" },
  { key: "1-5", label: "1～5潜" },
];

const chartColors = [
  "#b98cff",
  "#58c79a",
  "#f08aa9",
  "#70a8ff",
  "#f4bd62",
  "#60d4d0",
  "#ed8585",
  "#8bc66f",
  "#d997ff",
  "#ff986c",
  "#7cc4ff",
  "#e6d273",
  "#a7a1ff",
  "#66d097",
  "#ee9aca",
];

function parseRange(value: string | undefined): StatisticsRange {
  return value === "7d" || value === "14d" || value === "30d" ? value : "all";
}

function parsePotential(value: string | undefined): StatisticsPotential {
  return value === "0" || value === "1-5" ? value : "all";
}

function formatMetricValue(value: number | null): string {
  return value === null ? "—" : Math.round(value).toLocaleString("zh-CN");
}

function buildChartDomain(rows: StatisticsRow[]): { min: number; max: number } {
  const values = rows.flatMap((row) =>
    [row.lowerWhisker, row.upperWhisker].filter(
      (value): value is number => value !== null && Number.isFinite(value),
    ),
  );
  if (values.length === 0) {
    return { min: 0, max: 100 };
  }
  const observedMin = Math.min(...values);
  const observedMax = Math.max(...values);
  const observedSpan = Math.max(observedMax - observedMin, observedMax * 0.08, 1);
  return {
    min: Math.max(0, observedMin - observedSpan * 0.06),
    max: observedMax + observedSpan * 0.08,
  };
}

function chartPosition(
  value: number | null,
  domain: { min: number; max: number },
  scaleEnd = 100,
): number {
  if (value === null || domain.max <= domain.min) {
    return 0;
  }
  return Math.min(scaleEnd, Math.max(0, ((value - domain.min) / (domain.max - domain.min)) * scaleEnd));
}

function buildChartStyle(
  row: StatisticsRow,
  index: number,
  domain: { min: number; max: number },
  scaleEnd: number,
): CSSProperties {
  const rawP25 = chartPosition(row.p25, domain, scaleEnd);
  const rawP75 = chartPosition(row.p75, domain, scaleEnd);
  const boxCenter = (rawP25 + rawP75) / 2;
  const minimumBoxWidth = 1.4;
  const visibleP25 =
    rawP75 - rawP25 < minimumBoxWidth ? Math.max(0, boxCenter - minimumBoxWidth / 2) : rawP25;
  const visibleP75 =
    rawP75 - rawP25 < minimumBoxWidth ? Math.min(scaleEnd, boxCenter + minimumBoxWidth / 2) : rawP75;
  return {
    "--statistics-color": chartColors[index % chartColors.length],
    "--statistics-p10": `${chartPosition(row.p10, domain, scaleEnd)}%`,
    "--statistics-p25": `${visibleP25}%`,
    "--statistics-p50": `${chartPosition(row.median, domain, scaleEnd)}%`,
    "--statistics-p75": `${visibleP75}%`,
    "--statistics-p90": `${chartPosition(row.p90, domain, scaleEnd)}%`,
    "--statistics-max": `${chartPosition(row.upperWhisker, domain, scaleEnd)}%`,
  } as CSSProperties;
}

function outlierPosition(
  row: StatisticsRow,
  outlierIndex: number,
  domain: { min: number; max: number },
  scaleEnd: number,
): number {
  const outlier = row.outliers[outlierIndex];
  if (outlier.value >= domain.min && outlier.value <= domain.max) {
    return chartPosition(outlier.value, domain, scaleEnd);
  }
  const sameSide = row.outliers.filter((entry) =>
    outlier.value > domain.max ? entry.value > domain.max : entry.value < domain.min,
  );
  const sideIndex = sameSide.findIndex((entry) => entry.value === outlier.value);
  const progress = (sideIndex + 1) / (sameSide.length + 1);
  if (outlier.value > domain.max) {
    return scaleEnd + 1.5 + (100 - scaleEnd - 3) * progress;
  }
  return Math.max(0.8, 5.5 * progress);
}

export const dynamic = "force-dynamic";

export default async function BossCharacterStatisticsPage({ params, searchParams }: BossStatisticsPageProps) {
  const { bossSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const metric: StatisticsMetric = resolvedSearchParams.metric === "rdps" ? "rdps" : "dps";
  const timeRange = parseRange(resolvedSearchParams.range);
  const potentialRange = parsePotential(resolvedSearchParams.potential);
  const isAllScope = bossSlug === "__all__";
  const statisticsHref = (
    nextMetric: StatisticsMetric,
    nextRange: StatisticsRange,
    nextPotential: StatisticsPotential,
  ) =>
    isAllScope
      ? `/statistics?metric=${nextMetric}&range=${nextRange}&potential=${nextPotential}`
      : `/boss/${bossSlug}/statistics?metric=${nextMetric}&range=${nextRange}&potential=${nextPotential}`;

  try {
    const statistics = await fetchApiServer<BossCharacterStatisticsResponse>(
      isAllScope
        ? `/api/bosses/character-statistics?metric=${metric}&range=${timeRange}&potential=${potentialRange}`
        : `/api/bosses/${bossSlug}/character-statistics?metric=${metric}&range=${timeRange}&potential=${potentialRange}`,
    );
    const displayTitle = isAllScope ? "角色统计总榜" : formatBossDisplayName(statistics);
    const displayEyebrow = isAllScope ? "全部副本" : formatBossEyebrow(statistics);
    const metricLabel = metric === "rdps" ? "rDPS" : "DPS";
    const domain = buildChartDomain(statistics.rows);
    const hasOverflowOutliers = statistics.rows.some((row) =>
      row.outliers.some((outlier) => outlier.value < domain.min || outlier.value > domain.max),
    );
    const scaleEnd = hasOverflowOutliers ? 92 : 100;
    const axisTickCount = 9;
    const axisTicks = Array.from(
      { length: axisTickCount },
      (_, index) => domain.min + ((domain.max - domain.min) * index) / (axisTickCount - 1),
    );

    return (
      <div className="page-stack">
        <section className="panel panel-muted boss-ranking-hero">
          <div className="breadcrumbs">
            {isAllScope ? "首页 / 竞速榜单 / 角色统计总榜" : `首页 / 竞速榜单 / ${displayTitle} / 角色统计`}
          </div>
          <div className="section-heading boss-ranking-hero-heading">
            <div>
              <div className="eyebrow">{displayEyebrow}</div>
              <h1>{isAllScope ? displayTitle : `${displayTitle} · 角色统计`}</h1>
              <p className="muted boss-ranking-copy">
                {isAllScope
                  ? "汇总网站现有全部非危机合约副本的公开有效最高难度通关记录；每场中的六星角色各产生一个样本，同账号不去重。"
                  : "统计所有公开、有效且确认通关的最高难度记录；每场中的六星角色各产生一个样本，同账号不去重。"}
              </p>
            </div>
            <div className="boss-filter-row">
              {isAllScope ? (
                <Link className="button-secondary" href="/">
                  返回首页
                </Link>
              ) : (
                <>
                  <Link className="button-secondary" href={`/boss/${bossSlug}?metric=${metric}`}>
                    返回竞速榜
                  </Link>
                  <Link className="button-secondary" href={`/statistics?metric=${metric}&range=${timeRange}&potential=${potentialRange}`}>
                    全部副本总榜
                  </Link>
                </>
              )}
              <Link
                className={metric === "dps" ? "button-primary" : "button-secondary"}
                href={statisticsHref("dps", timeRange, potentialRange)}
              >
                DPS
              </Link>
              <Link
                className={metric === "rdps" ? "button-primary" : "button-secondary"}
                href={statisticsHref("rdps", timeRange, potentialRange)}
              >
                rDPS
              </Link>
            </div>
          </div>
          <div className="boss-filter-row character-statistics-range-row" aria-label="统计时间范围">
            {rangeOptions.map((option) => (
              <Link
                className={`button-chip${timeRange === option.key ? " is-active" : ""}`}
                href={statisticsHref(metric, option.key, potentialRange)}
                key={option.key}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <div className="boss-filter-row character-statistics-range-row" aria-label="角色潜能筛选">
            <span className="character-statistics-filter-label">角色潜能</span>
            {potentialOptions.map((option) => (
              <Link
                className={`button-chip${potentialRange === option.key ? " is-active" : ""}`}
                href={statisticsHref(metric, timeRange, option.key)}
                key={option.key}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="panel character-statistics-summary">
          <div className="table-toolbar">
            <div>
              <div className="eyebrow">六星角色分布</div>
              <h2 style={{ margin: "6px 0 0" }}>按照 {metricLabel} 排序</h2>
            </div>
            <div className="boss-filter-row">
              <span className="pill">潜能：{potentialOptions.find((option) => option.key === statistics.potential)?.label}</span>
              {isAllScope ? <span className="pill">覆盖副本：{statistics.includedBossCount}</span> : null}
              <span className="pill">有效战斗：{statistics.eligibleBattleCount}</span>
              <span className="pill">角色样本：{statistics.totalSampleCount}</span>
              <span className="pill">离群样本：{statistics.totalOutlierCount}</span>
              <span className="pill">最低正式样本：{statistics.minimumSampleCount}</span>
            </div>
          </div>
          <p className="muted character-statistics-note">
            箱体为非离群样本 P25～P75，中线为中位数，须线为 P10～P90，圆点为正常最高值和离群值。
            角色内按 1.5×IQR、全体样本按 3×IQR 识别离群值；离群值不拉伸主坐标轴，也不参与正式排序。
            “全部”只包含潜能明确为 0～5 的样本，潜能未知的旧记录不参与统计。
            {metric === "rdps" ? " rDPS 仅统计 raw-log-parser-v25 及以上记录。" : ""}
          </p>

          <div className="character-statistics-chart-scroll">
            <div className="character-statistics-chart">
              {statistics.rows.map((row, index) => (
                <div
                  className={`character-statistics-chart-row${row.insufficientSamples ? " is-insufficient" : ""}`}
                  key={row.characterKey}
                  style={buildChartStyle(row, index, domain, scaleEnd)}
                >
                  <div className="character-statistics-character">
                    <CharacterAvatar
                      avatarUrl={row.characterAvatarUrl}
                      name={row.characterName}
                      size="sm"
                    />
                    <div>
                      <strong>{row.characterName}</strong>
                      <small>
                        {row.characterProfession} · {row.normalSampleCount} 样本
                        {row.outlierCount > 0 ? ` · ${row.outlierCount} 离群` : ""}
                      </small>
                    </div>
                  </div>
                  {row.sampleCount > 0 ? (
                    <div
                      aria-label={`${row.characterName} ${metricLabel} 分布：P10 ${formatMetricValue(row.p10)}，中位数 ${formatMetricValue(row.median)}，P90 ${formatMetricValue(row.p90)}，离群 ${row.outlierCount} 个`}
                      className="character-statistics-track"
                    >
                      {axisTicks.map((_, tickIndex) => (
                        <span
                          className="character-statistics-grid-line"
                          key={`${row.characterKey}-grid-${tickIndex}`}
                          style={{ left: `${(tickIndex * scaleEnd) / (axisTickCount - 1)}%` }}
                        />
                      ))}
                      <span className="character-statistics-whisker" />
                      <span className="character-statistics-whisker-cap is-start" />
                      <span className="character-statistics-whisker-cap is-end" />
                      <span className="character-statistics-box" />
                      <span className="character-statistics-median" />
                      <span
                        className="character-statistics-maximum"
                        title={`非离群样本最高 ${formatMetricValue(row.upperWhisker)}`}
                      />
                      {row.outliers.map((outlier, outlierIndex) => (
                        <span
                          className="character-statistics-outlier"
                          key={`${row.characterKey}-outlier-${outlier.value}`}
                          style={
                            {
                              "--statistics-outlier-size": "8px",
                              left: `${outlierPosition(row, outlierIndex, domain, scaleEnd)}%`,
                              top: "50%",
                            } as CSSProperties
                          }
                          title={`离群值 ${formatMetricValue(outlier.value)}${outlier.count > 1 ? ` × ${outlier.count}` : ""}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="character-statistics-track is-empty">暂无有效样本</div>
                  )}
                </div>
              ))}
              <div className="character-statistics-axis" aria-hidden="true">
                <span />
                <div className="character-statistics-axis-track">
                  {axisTicks.map((tick, index) => (
                    <span
                      className={`character-statistics-axis-tick${index === 0 ? " is-first" : ""}${index === axisTickCount - 1 ? " is-last" : ""}`}
                      key={`axis-${index}`}
                      style={{ left: `${(index * scaleEnd) / (axisTickCount - 1)}%` }}
                    >
                      {formatMetricValue(tick)}
                    </span>
                  ))}
                  <strong className="character-statistics-axis-title">{metricLabel === "DPS" ? "秒伤" : "rDPS"}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="table-toolbar">
            <div>
              <div className="eyebrow">统计明细</div>
              <h2 style={{ margin: "6px 0 0" }}>{metricLabel} 分位数</h2>
            </div>
            <span className="muted">少于 {statistics.minimumSampleCount} 个样本的角色不参与正式排名。</span>
          </div>
          <div className="table-wrap">
            <table className="data-table character-statistics-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>角色</th>
                  <th>样本</th>
                  <th>P10</th>
                  <th>P25</th>
                  <th>中位数</th>
                  <th>P75</th>
                  <th>P90</th>
                  <th>最高</th>
                </tr>
              </thead>
              <tbody>
                {statistics.rows.map((row) => (
                  <tr className={row.insufficientSamples ? "is-insufficient" : undefined} key={`table-${row.characterKey}`}>
                    <td>{row.rank ?? "—"}</td>
                    <td>
                      <div className="ranking-character-cell">
                        <CharacterAvatar
                          avatarUrl={row.characterAvatarUrl}
                          name={row.characterName}
                          size="sm"
                        />
                        <div>
                          <strong>{row.characterName}</strong>
                          <small>{row.characterProfession}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{row.sampleCount}</strong>
                      <small>正常 {row.normalSampleCount}</small>
                      {row.outlierCount > 0 ? <small className="character-statistics-outlier-count">离群 {row.outlierCount}</small> : null}
                      {row.insufficientSamples ? <small className="character-statistics-warning">样本不足</small> : null}
                    </td>
                    <td>{formatMetricValue(row.p10)}</td>
                    <td>{formatMetricValue(row.p25)}</td>
                    <td className="character-statistics-median-cell">{formatMetricValue(row.median)}</td>
                    <td>{formatMetricValue(row.p75)}</td>
                    <td>{formatMetricValue(row.p90)}</td>
                    <td>{formatMetricValue(row.maximum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    return (
      <StateBlock
        title="角色统计暂时不可用"
        description={error instanceof Error ? error.message : "角色统计加载失败。"}
      />
    );
  }
}

export const revalidate = 0;
