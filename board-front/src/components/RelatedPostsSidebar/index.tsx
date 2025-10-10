
// components/RelatedPostsSidebar/index.tsx
import React from 'react';
import './style.css';
import { BoardListItem } from 'types/interface';

type Props = {
  placeName: string;
  relatedPosts: BoardListItem[];
  loading?: boolean;
  error?: string | null;
  open: boolean;
  onClose: () => void;
  // 게시글 상세로 이동
  onClickPost?: (boardNumber: string | number) => void;
  // 글쓰기 이동 (우측 하단 + 버튼)
  // onClickCompose?: (placeName: string) => void;
};

export default function RelatedPostsSidebar({
  placeName,
  relatedPosts,
  loading,
  error,
  open,
  onClose,
  onClickPost,
  // onClickCompose,
}: Props) {
  return (
    <aside className={`related-posts-sidebar ${open ? 'open' : ''}`}>
      {/* <header className="related-header">
        <strong className="related-header-title">연관 게시물</strong>
        <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header> */}

      <div className="related-caption">
        <b>{placeName}</b>과(와) 연관된 게시물이 {relatedPosts.length}개 있습니다.
      </div>

      {loading && <div className="related-loading">불러오는 중…</div>}
      {error && !loading && <div className="related-error">{error}</div>}

      {!loading && !error && (
        <ul className="related-list">
          {relatedPosts.map((p, i) => (
            <li key={p.boardNumber}>
              <button
                type="button"
                className="related-item-btn"
                onClick={() => onClickPost?.(p.boardNumber)}
                aria-label={`게시물 ${i + 1} 열기`}
              >
                <span className="idx">{i + 1}.</span>
                <span className="title">{p.title ?? '(제목 없음)'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 우측 하단 + FAB */}
      {/* <button
        type="button"
        className="related-fab"
        title="이 장소에 대해 글쓰기"
        aria-label="이 장소에 대해 글쓰기"
        onClick={() => onClickCompose?.(placeName)}
      >
        +
      </button> */}
    </aside>
  );
}





