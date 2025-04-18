import React from 'react';

// 공유 버튼 컴포넌트
interface ShareButtonProps {
  targetId: string;            // 캡처할 DOM 요소의 id
  fileName: string;            // 저장될 파일명 (확장자 제외)
  label?: string;              // 버튼 라벨
  className?: string;          // 추가 클래스명
  showIcon?: boolean;          // 아이콘 표시 여부
  compact?: boolean;           // 컴팩트 모드 (인라인 배치용)
}

/**
 * 결과 카드 캡처 & 다운로드 / SNS 공유 (dom-to-image-more 기반)
 */
const ShareButton: React.FC<ShareButtonProps> = ({ 
  targetId, 
  fileName, 
  label = '저장/공유', 
  className = '',
  showIcon = true,
  compact = false
}) => {
  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { saveAs } = await import('file-saver');

      const node = document.getElementById(targetId);
      if (!node) return;

      // 클론 후 스타일 변환(onclone)
      const canvas = await html2canvas(node as HTMLElement, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        onclone: (doc: Document) => {
          const all = doc.querySelectorAll<HTMLElement>('*');
          all.forEach((el) => {
            const cs = doc.defaultView?.getComputedStyle(el);
            if (!cs) return;
            // 주요 스타일 인라인 처리
            el.style.backgroundColor = cs.backgroundColor;
            el.style.color = cs.color;
            el.style.borderColor = cs.borderColor;
            el.style.backgroundImage = cs.backgroundImage;
          });
        }
      });

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        saveAs(blob, `${fileName}.png`);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      alert('공유 실패');
    }
  };

  // 인라인 버튼 (공유 버튼 그룹 내 배치용)
  if (compact) {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center justify-center px-3 py-2 rounded-md bg-white text-blue-500 shadow-sm hover:bg-blue-50 transition-colors ${className}`}
        title="결과 이미지로 저장"
      >
        {showIcon && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L12 9.586V4a1 1 0 011-1z" />
            <path d="M4 12a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1h-2a1 1 0 100 2h1v2H5v-2h1a1 1 0 100-2H4z" />
          </svg>
        )}
        {!showIcon && <span>{label}</span>}
      </button>
    );
  }

  // 기본 버튼 (전체 너비, 그라데이션)
  const baseButtonStyle =
    'w-full bg-gradient-to-r text-white py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center justify-center gap-2';
  const defaultButtonStyle =
    'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';

  return (
    <button
      onClick={handleShare}
      className={`${baseButtonStyle} ${className || defaultButtonStyle} mt-4`}
    >
      {showIcon && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L12 9.586V4a1 1 0 011-1z" />
          <path d="M4 12a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1h-2a1 1 0 100 2h1v2H5v-2h1a1 1 0 100-2H4z" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
};

export default ShareButton; 