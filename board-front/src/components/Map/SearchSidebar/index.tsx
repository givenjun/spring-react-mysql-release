import React, { useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { BOARD_PATH, USER_PATH } from 'constant';

interface Place {
  id: string;
  place_name: string;
  x: string;
  y: string;
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
  phone?: string;
}

interface SearchSidebarProps {
  searchResults: Place[];
  onClickItem: (index: number) => void;
  selectedIndex: number | null;
  isOpen: boolean;
  toggleOpen: () => void;
  onSearch: (start: string, goal: string) => void;
}

export default function SearchSidebar({
  isOpen,
  toggleOpen,
  searchResults,
  onClickItem,
  selectedIndex,
  onSearch,
}: SearchSidebarProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const onBoardClickHandler = () => navigate(BOARD_PATH());
  const onUserClickHandler = () => navigate(USER_PATH(''));

  const onKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const onKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearchClick();
  };

  const onSearchClick = () => {
    if (!keyword.trim()) return;
    onSearch(keyword.trim(), ''); // 두 번째 인자는 도착지 등 확장 대비
  };

  return (
    <div className={`slideContainer ${isOpen ? 'active' : ''}`}>
      {/* 열기/닫기 버튼 */}
      <div className="slideBtnContainer">
        <div className={`slideBtn ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
          <div className="icon-box">
            <div className={`icon ${isOpen ? 'expand-left-icon' : 'expand-right-icon'}`} />
          </div>
        </div>
      </div>

      {/* 사이드바 내용 */}
      <div className="sidebar-content" >
        <div className="sidebar-title">{`Hanbat Map`}</div>

        {/* 검색창 */}
        <div className="sidebar-search-input-box">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="장소, 주소 검색"
              value={keyword}
              onChange={onKeywordChange}
              onKeyDown={onKeywordKeyDown}
            />
            <div className="search-icon" onClick={onSearchClick}>
              <div className="icon search-light-icon" />
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="button-group">
          <button className="button" onClick={onSearchClick}>탐색</button>
          <button className="button">{`길찾기`}</button>
          <button className="button" onClick={onBoardClickHandler}>커뮤니티</button>
          <button className="button" onClick={onUserClickHandler}>MY</button>
        </div>
</div>
        {/* 검색 결과 리스트 */}
        {searchResults.length > 0 && (
          <div className="search-result-list">
            {searchResults.map((place, index) => (
              <div
                key={place.id || index}
                className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => onClickItem(index)}
                onMouseEnter={() => onClickItem(index)}
              >
                <div className="place-name">{place.place_name}</div>
                <div className="place-address">{place.road_address_name || place.address_name}</div>
                {place.phone && <div className="place-phone">{place.phone}</div>}
              </div>
            ))}
          </div>
        )}
      
    </div>
  );
}
