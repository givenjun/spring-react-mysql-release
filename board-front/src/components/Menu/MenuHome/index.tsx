import './style.css';
import RoutePickLogoIcon from 'assets/image/routepick-logo-icon.png'

export default function MenuHome() {
    return (
        <div className='menu-home-container'>
            <img src={RoutePickLogoIcon} className='menu-home-logo-icon'></img>
            <h1 className='menu-home-title'>RoutePick에 오신 것을 환영합니다!</h1>
            <div className='menu-home-body'>
                <p>나만 알고 있던 장소, 친구와 함께 가고 싶은 곳, 이제</p>
                <p>RoutePick 지도 위에 나만의 루트를 만들고 공유해</p>
                <p>보세요. 당신이 가는 모든 길이 새로운 이야기가 됩니다</p>
            </div>
        </div>
    )
}