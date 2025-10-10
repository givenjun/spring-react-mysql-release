// src/components/CTA(Call to Action)/index.tsx

import './style.css';
import CloseButtonIcon from 'assets/image/close-button-icon.png'

type Props = {
    onClose: () => void;
}

export default function CTA({ onClose }: Props) {

    const onCloseClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className='call-to-action-container'>
            <div className='cta-header'>
                <h4 className='cta-title'>다음 기능들을 사용하여 보세요</h4>
                 <button className='cta-close-button' onClick={onCloseClickHandler}>
                    <img src={CloseButtonIcon} alt='닫기' />
                </button>
            </div>  
            <div className='cta-body'>
                <p>· AI에게 장소 물어보기</p>
                <p>· 현재 보고있는 장소와 관련된 게시글 보기</p>
            </div>
        </div>
    );
}