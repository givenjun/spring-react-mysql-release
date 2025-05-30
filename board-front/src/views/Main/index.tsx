// views/Main/index.tsx
import React, { useState } from 'react';
import { Map, MapMarker, MapTypeControl, ZoomControl } from 'react-kakao-maps-sdk';
import SearchSidebar from 'components/Map/SearchSidebar';
import useKakaoSearch from 'hooks/Map/useKakaoSearch.hock';
import './style.css';

export default function Main() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { searchResults, center, searchPlaces } = useKakaoSearch();

  const handleSearch = (start: string, goal: string) => {
    if (start) searchPlaces(start);
  };

  const handlePlaceClick = (index: number) => {
    setSelectedIndex(index);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className='main-wrapper'>
      <SearchSidebar
        searchResults={searchResults}
        onClickItem={handlePlaceClick}
        selectedIndex={selectedIndex}
        isOpen={isSidebarOpen}
        toggleOpen={toggleSidebar}
        onSearch={handleSearch}
      />
      <Map center={center} style={{ width: '100%', height: '100vh' }} level={4}>
        <MapTypeControl position="TOPRIGHT" />
        <ZoomControl position="RIGHT" />
        {searchResults.map((place, index) => (
          <MapMarker
            key={index}
            position={{ lat: parseFloat(place.y), lng: parseFloat(place.x) }}
            onClick={() => handlePlaceClick(index)}
            clickable={true}
          >
            {selectedIndex === index && (
              <div className="marker-info">
                <strong>{place.place_name}</strong>
              </div>
            )}
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
