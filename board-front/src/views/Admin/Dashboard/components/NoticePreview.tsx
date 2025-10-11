import React from "react";

interface Notice {
  id: number;
  title: string;
  createdAt: string;
}

interface Props {
  latestNotices: Notice[];
}

export default function NoticePreview({ latestNotices }: Props) {
  return (
    <div className="notice-preview">
      <h3>📢 최신 공지사항</h3>
      <ul>
        {latestNotices.length === 0 ? (
          <p>공지사항이 없습니다.</p>
        ) : (
          latestNotices.map((notice) => (
            <li key={notice.id}>
              <span className="admin-notice-title">{notice.title}</span>
              <span className="notice-date">{notice.createdAt}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
