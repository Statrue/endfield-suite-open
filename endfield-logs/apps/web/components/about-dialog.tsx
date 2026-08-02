"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const AFDIAN_URL = "https://afdian.com/a/zhfdy";

export function AboutDialog() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        aria-controls="about-dialog"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`nav-link about-dialog-trigger${open ? " is-active" : ""}`}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        关于
      </button>
      {open
        ? createPortal(
            <div
              className="about-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div
                aria-describedby="about-dialog-description"
                aria-labelledby="about-dialog-title"
                aria-modal="true"
                className="about-dialog"
                id="about-dialog"
                ref={dialogRef}
                role="dialog"
              >
                <header className="about-dialog-header">
                  <div>
                    <span className="eyebrow">关于本站</span>
                    <h2 id="about-dialog-title">终末地战斗日志</h2>
                    <p>Endfield Battle Reports</p>
                  </div>
                  <button
                    aria-label="关闭关于窗口"
                    className="about-dialog-close"
                    onClick={() => setOpen(false)}
                    ref={closeButtonRef}
                    type="button"
                  >
                    ×
                  </button>
                </header>

                <p className="about-dialog-description" id="about-dialog-description">
                  由玩家维护的战斗数据工具，提供公开竞速榜单、战斗报告与 rDPS 分析。
                </p>

                <ul className="about-dialog-features" aria-label="本站功能">
                  <li>公开竞速榜单</li>
                  <li>战斗报告与数据分析</li>
                  <li>玩家真实上传记录</li>
                </ul>

                <section className="about-dialog-support" aria-labelledby="about-dialog-support-title">
                  <div>
                    <span className="eyebrow">支持维护</span>
                    <h3 id="about-dialog-support-title">喜欢这个项目？</h3>
                    <p>你的支持会用于网站和客户端的持续维护。</p>
                  </div>
                  <a className="afdian-support-link" href={AFDIAN_URL} rel="noreferrer noopener" target="_blank">
                    <span className="afdian-support-mark" aria-hidden="true">
                      ⚡
                    </span>
                    <span>在爱发电支持我</span>
                    <span className="afdian-support-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </section>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
