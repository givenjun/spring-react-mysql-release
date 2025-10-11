import React from 'react';
import { PlaceInfo } from 'hooks/chatbot.hook'; // chatbot.hook.ts에서 PlaceInfo 타입을 가져옵니다.
import './style.css';
import { useAiSearchStore } from 'hooks/Map/useKakaoSearch.hook';
import { searchPlaceOnMapRequest } from 'apis';

interface Props {
  info: PlaceInfo;
}

const PlaceInfoCard = ({ info }: Props) => {

  // const { setAiSearchResults } = useAiSearchStore();
  // 
  // const handleRoutePick = async() => {
  //   console.log("Route Pick 버튼 클릭:", info.place_name);
  //   // 주소 또는 장소 이름으로 검색 쿼리를 결정합니다. 주소가 더 정확할 확률이 높습니다.
  //   const searchQuery = info.place_name || info.address;
    
  //   // API를 호출하여 장소 목록(좌표 포함)을 받아옵니다.
  //   const places = await searchPlaceOnMapRequest(searchQuery);
    
  //   if (places && places.length > 0) {
  //     // 검색된 장소 목록으로 지도 상태를 업데이트합니다.
  //     setAiSearchResults(places);
  //     console.log("지도에 마커를 표시합니다:", places);
  //   } else {
  //     console.log("검색 결과가 없습니다.");
  //     // 사용자에게 검색 결과가 없음을 알리는 UI를 추가하면 더 좋습니다.
  //     alert(`'${searchQuery}'에 대한 검색 결과가 없습니다.`);
  //   }
  // };

  return (
    <div className="place-info-card">
      <h3 className="place-name">{info.place_name}</h3>
      <p className="address">{info.address}</p>
      
      <div className="info-section">
        <strong>추천 메뉴</strong>
        <p>{info.menu}</p>
      </div>

      <div className="info-section">
        <strong>특징</strong>
        <p>{info.reason}</p>
      </div>

      <div className="info-section">
        <strong>방문자 리뷰</strong>
        <p>{info.review_summary}</p>
      </div>

      <div className='info-divider'></div>
      {/* <button onClick={handleRoutePick} className="route-pick-button">
        Route Pick
      </button> */}
    </div>
  );
};

export default PlaceInfoCard;