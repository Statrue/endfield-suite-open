import Link from "next/link";

import { StateBlock } from "../../../components/state-block";
import { AccountRankingsPanel } from "../../../features/records/user-battles-dashboard";
import { fetchApiServer } from "../../../lib/api/server";
import type { PublicUserRankingsResponse } from "../../../lib/api/types";

type AccountRecordsPageProps = {
  params: Promise<{ accountId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AccountRecordsPage({ params }: AccountRecordsPageProps) {
  const { accountId } = await params;

  try {
    const response = await fetchApiServer<PublicUserRankingsResponse>(
      `/api/battles/users/${encodeURIComponent(accountId)}/rankings`,
    );

    return (
      <div className="page-stack">
        <section className="panel panel-muted">
          <div className="section-heading">
            <div>
              <div className="breadcrumbs">首页 / 账号排名 / {response.accountDisplayName}</div>
              <div className="eyebrow" style={{ marginTop: 14 }}>
                公开账号
              </div>
              <h1 style={{ margin: "6px 0 0" }}>{response.accountDisplayName}</h1>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                这里展示该账号在公开竞速榜单中的当前最好通关排名。
              </p>
            </div>
            <Link className="button-chip" href="/">
              返回首页
            </Link>
          </div>
        </section>

        <AccountRankingsPanel
          rankings={response.rankings}
          title={`${response.accountDisplayName}在各首领中的排名`}
        />
      </div>
    );
  } catch (error) {
    return (
      <StateBlock
        title="账号排名暂时不可用"
        description={error instanceof Error ? error.message : "暂时无法加载这个账号的排名。"}
      />
    );
  }
}
