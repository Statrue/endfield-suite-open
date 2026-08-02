"use client";

import { useEffect, useMemo, useState } from "react";

import type { EndaxisImportPayload } from "../../../../lib/endaxis-project";

type EndaxisPreloadProps = {
  payload: EndaxisImportPayload;
};

const ENDAXIS_EDITOR_URL = "/endaxis/timeline";

export function EndaxisPreload({ payload }: EndaxisPreloadProps) {
  const [message, setMessage] = useState("正在写入排轴工程...");

  const projectJson = useMemo(() => JSON.stringify(payload.project, null, 2), [payload.project]);

  useEffect(() => {
    try {
      window.localStorage.setItem(payload.storageKey, JSON.stringify(payload.project));
      // 输入式：施法意图交给 Endaxis 引擎在编辑器里自建动作（有则写，无则清理旧残留）
      if (payload.castInputs.length > 0) {
        window.localStorage.setItem(
          payload.castInputKey,
          JSON.stringify({ tracks: payload.castInputs, hasEnergySignal: payload.hasEnergySignal }),
        );
      } else {
        window.localStorage.removeItem(payload.castInputKey);
      }
      setMessage("工程已写入，正在打开 Endaxis 编辑器...");
      window.setTimeout(() => {
        window.location.replace(ENDAXIS_EDITOR_URL);
      }, 250);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "浏览器暂时无法写入本地工程。");
    }
  }, [payload.project, payload.storageKey, payload.castInputKey, payload.castInputs]);

  function handleDownloadProject() {
    const blob = new Blob([projectJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `endaxis_${payload.summary.battleId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      <section className="panel panel-muted" style={{ display: "grid", gap: 16 }}>
        <div className="breadcrumbs">首页 / 战斗记录 / 排轴编辑器</div>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Endaxis</div>
            <h1>正在打开排轴编辑器</h1>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              {message}
            </p>
          </div>
          <a className="button-secondary" href={`/axis/${payload.summary.battleId}`}>
            返回排轴视图
          </a>
        </div>
        <div className="stat-grid stat-grid-4">
          <div className="metric-card">
            <span className="metric-label">战斗</span>
            <strong>{payload.summary.battleTitle}</strong>
            <span className="metric-note">{payload.summary.battleId}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">角色</span>
            <strong>{payload.summary.rosterCount}</strong>
            <span className="metric-note">{payload.summary.recognizedCharacterCount} 个已匹配 Endaxis</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">动作块</span>
            <strong>{payload.summary.actionCount}</strong>
            <span className="metric-note">
              {payload.summary.sourceKind === "casts"
                ? "完整施法序列（含普攻）"
                : "旧版战斗：按伤害命中近似分组"}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">备用导入</span>
            <button className="button-secondary" onClick={handleDownloadProject} type="button">
              下载 JSON
            </button>
            <span className="metric-note">可在 Endaxis 中手动导入</span>
          </div>
        </div>
        <div className="panel-inset">
          <span className="muted">
            如果没有自动跳转，可以直接打开{" "}
            <a className="text-link" href={ENDAXIS_EDITOR_URL}>
              Endaxis 编辑器
            </a>
            。
          </span>
        </div>
      </section>
    </div>
  );
}
