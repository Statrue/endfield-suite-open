"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AboutDialog } from "./about-dialog";

const NAV_ITEMS = [
  { href: "/", label: "首页", match: (pathname: string) => pathname === "/" },
];

const CLIENT_DOWNLOAD_URL = "/downloads/EndfieldLogsClient_2.10.81_20260802.zip";

const RANKING_MENU_ITEMS = [
  {
    href: "/statistics",
    label: "角色统计总榜",
    match: (pathname: string) => pathname === "/statistics",
  },
  {
    href: "/boss/dung01_group_bossrush01",
    label: "危境再现",
    match: (pathname: string) =>
      pathname.startsWith("/boss/dung01_group_bossrush") || pathname.startsWith("/boss/dung02_group_bossrush"),
  },
  {
    href: "/boss/dung02_group_minibossrush01",
    label: "危境碎片",
    match: (pathname: string) => pathname.startsWith("/boss/dung02_group_minibossrush"),
  },
  {
    href: "/boss/indie_group_ccdg",
    label: "危机合约",
    match: (pathname: string) => pathname.startsWith("/boss/indie_group_ccdg"),
  },
  {
    href: "/boss/indie_battletower001_ex",
    label: "战争回响",
    match: (pathname: string) => /^\/boss\/indie_battletower00[1-8]_ex$/.test(pathname),
  },
  {
    href: "/boss/indie_hard007_s",
    label: "影拓丰碑1期",
    match: (pathname: string) => /^\/boss\/indie_hard00[1-9]_s$/.test(pathname),
  },
  {
    href: "/boss/indie_hard013_s",
    label: "影拓丰碑2期",
    match: (pathname: string) => /^\/boss\/indie_hard01[0-5]_s$/.test(pathname),
  },
  {
    href: "/boss/indie_hard016_s",
    label: "影拓丰碑3期",
    match: (pathname: string) => /^\/boss\/indie_hard0(?:1[6-9]|2[0-1])_s$/.test(pathname),
  },
  {
    href: "/boss/indie_hard022_s",
    label: "影拓丰碑4期",
    match: (pathname: string) => /^\/boss\/indie_hard02[2-5]_s$/.test(pathname),
  },
];

export function SiteNavLinks() {
  const pathname = usePathname();
  const [rankingMenuOpen, setRankingMenuOpen] = useState(false);
  const rankingMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rankingMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rankingMenuRef.current?.contains(event.target as Node)) {
        setRankingMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRankingMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rankingMenuOpen]);

  return (
    <>
      <AboutDialog />
      {NAV_ITEMS.map((item) => (
        <Link
          className={`nav-link${item.match(pathname) ? " is-active" : ""}`}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
      <a className="nav-link" href={CLIENT_DOWNLOAD_URL}>
        下载客户端
      </a>
      <div className="ranking-menu" ref={rankingMenuRef}>
        <button
          aria-expanded={rankingMenuOpen}
          aria-haspopup="menu"
          className={`nav-link ranking-menu-trigger${pathname.startsWith("/boss/") || pathname === "/statistics" ? " is-active" : ""}${
            rankingMenuOpen ? " is-open" : ""
          }`}
          onClick={() => setRankingMenuOpen((current) => !current)}
          type="button"
        >
          <span>竞速榜单</span>
          <span className="ranking-menu-caret" aria-hidden="true">
            ▾
          </span>
        </button>
        {rankingMenuOpen ? (
          <div className="ranking-menu-panel">
            {RANKING_MENU_ITEMS.map((item) => (
              <Link
                className={`ranking-menu-item${item.match(pathname) ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setRankingMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
