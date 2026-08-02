"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buildApiUrl } from "../../lib/api/client";
import type { AdminDashboardResponse } from "../../lib/api/types";
import { formatDurationMs } from "../../lib/format/duration";

type AdminDashboardProps = {
  initialData: AdminDashboardResponse;
};

type AdminBattle = AdminDashboardResponse["battles"][number];

const numberFormatter = new Intl.NumberFormat("zh-CN");
const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDateTime(value: string | null) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateTimeFormatter.format(date);
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [dashboard, setDashboard] = useState(initialData);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "deleted">("valid");
  const [query, setQuery] = useState("");
  const [pendingBattleId, setPendingBattleId] = useState<string | null>(null);
  const [pendingUserAction, setPendingUserAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const selectedUser = useMemo(
    () => dashboard.users.find((user) => user.id === selectedUserId) ?? null,
    [dashboard.users, selectedUserId],
  );

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) {
      return dashboard.users;
    }
    return dashboard.users.filter((user) =>
      [user.nickname, user.email ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [dashboard.users, normalizedQuery]);

  const filteredBattles = useMemo(() => {
    return dashboard.battles.filter((battle) => {
      if (selectedUserId !== "all" && battle.uploaderUserId !== selectedUserId) {
        return false;
      }
      if (statusFilter !== "all" && battle.status !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return [
        battle.uploaderNickname,
        battle.uploaderEmail ?? "",
        battle.bossName,
        battle.dungeonName,
        battle.id,
        battle.rosterSummary.join(" "),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [dashboard.battles, normalizedQuery, selectedUserId, statusFilter]);

  async function handleDeleteBattle(battle: AdminBattle) {
    if (battle.status === "deleted" || pendingBattleId) {
      return;
    }
    const confirmed = window.confirm(`确定要删除 ${battle.uploaderNickname} 的这条战斗记录吗？`);
    if (!confirmed) {
      return;
    }

    setPendingBattleId(battle.id);
    setMessage(null);
    try {
      const response = await fetch(buildApiUrl(`/api/admin/battles/${battle.id}`), {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "删除战斗记录失败。");
      }

      setDashboard((current) => {
        const target = current.battles.find((item) => item.id === battle.id);
        if (!target || target.status === "deleted") {
          return current;
        }
        return {
          overview: {
            ...current.overview,
            validBattles: Math.max(0, current.overview.validBattles - 1),
            deletedBattles: current.overview.deletedBattles + 1,
          },
          users: current.users.map((user) =>
            user.id === target.uploaderUserId
              ? {
                  ...user,
                  validBattles: Math.max(0, user.validBattles - 1),
                  deletedBattles: user.deletedBattles + 1,
                }
              : user,
          ),
          battles: current.battles.map((item) =>
            item.id === battle.id
              ? {
                  ...item,
                  status: "deleted",
                }
              : item,
          ),
        };
      });
      setMessage(`已删除记录 ${battle.id}。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除战斗记录失败。");
    } finally {
      setPendingBattleId(null);
    }
  }

  async function handleToggleDisabled() {
    if (!selectedUser || pendingUserAction) {
      return;
    }
    const nextDisabled = !selectedUser.isDisabled;
    const confirmed = window.confirm(
      nextDisabled
        ? `确定要禁用账号 ${selectedUser.nickname} 吗？`
        : `确定要恢复账号 ${selectedUser.nickname} 吗？`,
    );
    if (!confirmed) {
      return;
    }

    setPendingUserAction(`disable:${selectedUser.id}`);
    setMessage(null);
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUser.id}/disabled`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ disabled: nextDisabled }),
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "更新账号状态失败。");
      }
      setDashboard((current) => ({
        ...current,
        users: current.users.map((user) =>
          user.id === selectedUser.id ? { ...user, isDisabled: nextDisabled } : user,
        ),
      }));
      setMessage(nextDisabled ? "账号已禁用。" : "账号已恢复。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新账号状态失败。");
    } finally {
      setPendingUserAction(null);
    }
  }

  async function handleToggleAdmin() {
    if (!selectedUser || pendingUserAction) {
      return;
    }
    const nextIsAdmin = !selectedUser.isAdmin;
    const confirmed = window.confirm(
      nextIsAdmin
        ? `确定要把 ${selectedUser.nickname} 提升为管理员吗？`
        : `确定要移除 ${selectedUser.nickname} 的管理员权限吗？`,
    );
    if (!confirmed) {
      return;
    }

    setPendingUserAction(`admin:${selectedUser.id}`);
    setMessage(null);
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUser.id}/admin`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAdmin: nextIsAdmin }),
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "更新管理员权限失败。");
      }
      setDashboard((current) => ({
        overview: {
          ...current.overview,
          adminUsers: current.overview.adminUsers + (nextIsAdmin ? 1 : -1),
        },
        users: current.users.map((user) =>
          user.id === selectedUser.id ? { ...user, isAdmin: nextIsAdmin } : user,
        ),
        battles: current.battles,
      }));
      setMessage(nextIsAdmin ? "管理员权限已授予。" : "管理员权限已移除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新管理员权限失败。");
    } finally {
      setPendingUserAction(null);
    }
  }

  async function handleResetPassword() {
    if (!selectedUser || pendingUserAction) {
      return;
    }
    const newPassword = window.prompt(`给 ${selectedUser.nickname} 设置一个新密码（至少 8 位）`, "");
    if (!newPassword) {
      return;
    }

    setPendingUserAction(`password:${selectedUser.id}`);
    setMessage(null);
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUser.id}/reset-password`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "重置密码失败。");
      }
      setMessage(`已为 ${selectedUser.nickname} 更新密码。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重置密码失败。");
    } finally {
      setPendingUserAction(null);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser || pendingUserAction) {
      return;
    }
    const confirmed = window.confirm(
      `确定要删除账号 ${selectedUser.nickname} 吗？这会同时清掉这个账号的登录能力，并把它的战斗记录标记为已删除。`,
    );
    if (!confirmed) {
      return;
    }

    setPendingUserAction(`delete:${selectedUser.id}`);
    setMessage(null);
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUser.id}`), {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "删除账号失败。");
      }

      setDashboard((current) => ({
        overview: {
          ...current.overview,
          totalUsers: Math.max(0, current.overview.totalUsers - 1),
          adminUsers: current.overview.adminUsers - (selectedUser.isAdmin ? 1 : 0),
          validBattles:
            current.overview.validBattles -
            current.battles.filter(
              (battle) => battle.uploaderUserId === selectedUser.id && battle.status === "valid",
            ).length,
          deletedBattles:
            current.overview.deletedBattles +
            current.battles.filter(
              (battle) => battle.uploaderUserId === selectedUser.id && battle.status === "valid",
            ).length,
        },
        users: current.users.filter((user) => user.id !== selectedUser.id),
        battles: current.battles.map((battle) =>
          battle.uploaderUserId === selectedUser.id
            ? {
                ...battle,
                status: "deleted",
              }
            : battle,
        ),
      }));
      setSelectedUserId("all");
      setMessage(`账号 ${selectedUser.nickname} 已删除。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除账号失败。");
    } finally {
      setPendingUserAction(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel panel-muted admin-hero">
        <div>
          <div className="eyebrow">后台管理</div>
          <h1 style={{ margin: "8px 0 10px" }}>账号与战斗记录总览</h1>
          <p className="muted" style={{ margin: 0, maxWidth: 880 }}>
            这里汇总真实上传账号和 battle 记录。你可以按账号筛选、搜索首领或角色，并直接删除异常记录。
          </p>
        </div>
        <div className="stat-grid stat-grid-4">
          <div className="metric-card">
            <span className="metric-label">账号总数</span>
            <strong>{dashboard.overview.totalUsers}</strong>
            <span className="metric-note">含管理员账号</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">管理员</span>
            <strong>{dashboard.overview.adminUsers}</strong>
            <span className="metric-note">拥有后台权限</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">有效记录</span>
            <strong>{dashboard.overview.validBattles}</strong>
            <span className="metric-note">当前仍对外可见</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">已删除</span>
            <strong>{dashboard.overview.deletedBattles}</strong>
            <span className="metric-note">后台保留审计状态</span>
          </div>
        </div>
      </section>

      <section className="admin-layout">
        <aside className="panel admin-sidebar">
          <div className="section-heading">
            <div>
              <div className="eyebrow">账号列表</div>
              <h2>上传账号</h2>
            </div>
            <span className="muted">共 {filteredUsers.length} 个账号</span>
          </div>

          <button
            className={`admin-user-card${selectedUserId === "all" ? " is-active" : ""}`}
            onClick={() => setSelectedUserId("all")}
            type="button"
          >
            <div>
              <strong>全部账号</strong>
              <div className="admin-user-meta">查看所有 battle</div>
            </div>
            <span>{dashboard.overview.totalBattles}</span>
          </button>

          <div className="admin-user-list">
            {filteredUsers.map((user) => (
              <button
                className={`admin-user-card${selectedUserId === user.id ? " is-active" : ""}`}
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                type="button"
              >
                <div>
                  <div className="admin-user-title">
                    <strong>{user.nickname}</strong>
                    {user.isAdmin ? <span className="status-pill is-admin">管理员</span> : null}
                    {user.isDisabled ? <span className="status-pill is-disabled">已禁用</span> : null}
                  </div>
                  <div className="admin-user-meta">{user.email ?? "未知邮箱"}</div>
                  <div className="admin-user-meta">
                    有效 {user.validBattles} / 删除 {user.deletedBattles}
                  </div>
                </div>
                <span>{user.totalBattles}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="page-stack">
          {selectedUser ? (
            <section className="panel panel-muted">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">账号控制</div>
                  <h2>{selectedUser.nickname}</h2>
                </div>
                <div className="admin-chip-row">
                  {selectedUser.isAdmin ? <span className="status-pill is-admin">管理员</span> : null}
                  {selectedUser.isDisabled ? <span className="status-pill is-disabled">已禁用</span> : null}
                </div>
              </div>

              <div className="stat-grid stat-grid-4">
                <div className="metric-card">
                  <span className="metric-label">邮箱</span>
                  <strong>{selectedUser.email ?? "--"}</strong>
                  <span className="metric-note">登录主标识</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">注册时间</span>
                  <strong>{formatDateTime(selectedUser.createdAt)}</strong>
                  <span className="metric-note">账号创建时间</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">记录数</span>
                  <strong>{selectedUser.totalBattles}</strong>
                  <span className="metric-note">
                    有效 {selectedUser.validBattles} / 删除 {selectedUser.deletedBattles}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">最近上传</span>
                  <strong>{formatDateTime(selectedUser.lastBattleAt)}</strong>
                  <span className="metric-note">最后一条 battle 时间</span>
                </div>
              </div>

              <div className="admin-actions" style={{ marginTop: 16 }}>
                <button
                  className="button-secondary"
                  disabled={Boolean(pendingUserAction)}
                  onClick={handleToggleDisabled}
                  type="button"
                >
                  {selectedUser.isDisabled ? "恢复账号" : "禁用账号"}
                </button>
                <button
                  className="button-secondary"
                  disabled={Boolean(pendingUserAction)}
                  onClick={handleResetPassword}
                  type="button"
                >
                  重置密码
                </button>
                <button
                  className="button-secondary"
                  disabled={Boolean(pendingUserAction)}
                  onClick={handleToggleAdmin}
                  type="button"
                >
                  {selectedUser.isAdmin ? "移除管理员" : "提升为管理员"}
                </button>
                <button
                  className="button-danger"
                  disabled={Boolean(pendingUserAction)}
                  onClick={handleDeleteUser}
                  type="button"
                >
                  删除账号
                </button>
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="section-heading">
              <div>
                <div className="eyebrow">当前筛选</div>
                <h2>{selectedUser ? `${selectedUser.nickname} 的战斗记录` : "全站战斗记录"}</h2>
              </div>
              <span className="muted">
                {selectedUser
                  ? `最近战斗：${formatDateTime(selectedUser.lastBattleAt)}`
                  : `总记录：${dashboard.overview.totalBattles}`}
              </span>
            </div>

            <div className="admin-toolbar">
              <label className="field-stack admin-search">
                <span>搜索账号 / 首领 / 角色</span>
                <input
                  className="field-input"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="例如：洛茜、聂菲斯、某个邮箱"
                  value={query}
                />
              </label>
              <div className="admin-chip-row">
                <button
                  className={`button-chip${statusFilter === "valid" ? " is-active" : ""}`}
                  onClick={() => setStatusFilter("valid")}
                  type="button"
                >
                  仅有效
                </button>
                <button
                  className={`button-chip${statusFilter === "deleted" ? " is-active" : ""}`}
                  onClick={() => setStatusFilter("deleted")}
                  type="button"
                >
                  仅已删除
                </button>
                <button
                  className={`button-chip${statusFilter === "all" ? " is-active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                  type="button"
                >
                  全部状态
                </button>
              </div>
            </div>

            {message ? (
              <div className="panel-inset">
                <span className="muted">{message}</span>
              </div>
            ) : null}

            <div className="table-wrap">
              <table className="data-table admin-table">
                <thead>
                  <tr>
                    <th>账号</th>
                    <th>首领</th>
                    <th>阵容</th>
                    <th>结束时间</th>
                    <th>DPS</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBattles.length ? (
                    filteredBattles.map((battle) => (
                      <tr
                        className={battle.status === "deleted" ? "admin-row-deleted" : undefined}
                        key={battle.id}
                      >
                        <td>
                          <div className="admin-cell-stack">
                            <strong>{battle.uploaderNickname}</strong>
                            <span>{battle.uploaderEmail ?? battle.uploaderUserId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-cell-stack">
                            <strong>{battle.bossName}</strong>
                            <span>{battle.dungeonName}</span>
                          </div>
                        </td>
                        <td>{battle.rosterSummary.join(" / ") || "-"}</td>
                        <td>
                          <div className="admin-cell-stack">
                            <strong>{formatDateTime(battle.battleEndAt)}</strong>
                            <span>{formatDurationMs(battle.durationMs)}</span>
                          </div>
                        </td>
                        <td>{formatNumber(battle.totalDps)}</td>
                        <td>
                          <span className={`status-pill ${battle.status === "deleted" ? "is-deleted" : "is-valid"}`}>
                            {battle.status === "deleted" ? "已删除" : "有效"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            {battle.status === "valid" ? (
                              <Link className="button-chip" href={`/battle/${battle.id}`}>
                                查看
                              </Link>
                            ) : null}
                            <button
                              className="button-danger"
                              disabled={battle.status === "deleted" || pendingBattleId === battle.id}
                              onClick={() => handleDeleteBattle(battle)}
                              type="button"
                            >
                              {pendingBattleId === battle.id ? "删除中..." : battle.status === "deleted" ? "已删除" : "删除"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="panel-inset" style={{ margin: "8px 0" }}>
                          当前筛选下没有匹配的战斗记录。
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
