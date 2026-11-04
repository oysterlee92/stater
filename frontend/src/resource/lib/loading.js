/**
 * Loading Indicator Utility Module
 * 
 * 로딩바를 생성하고 제어하는 유틸리티 함수입니다.
 * 전역 오버레이 형태의 로딩 스피너를 표시하거나 숨깁니다.
 * ID가 주어지면 해당 로딩바를 찾아 제어하고, 없으면 새로 생성합니다.
 * 
 * @module loading
 * @param {string} [containerId] - 로딩바의 ID (선택사항, 미지정 시 기본 ID 사용)
 * @returns {Object} 로딩바 제어 객체
 * @returns {Function} return.show - 로딩바를 표시하는 함수
 * @returns {Function} return.hide - 로딩바를 숨기는 함수
 * 
 * @example
 * // 기본 로딩바 사용
 * const loader = oyster.loading();
 * loader.show();
 * // 비동기 작업 수행
 * setTimeout(() => {
 *   loader.hide();
 * }, 2000);
 * 
 * @example
 * // 자동 숨김 기능 사용
 * const loader = oyster.loading();
 * loader.show(3000); // 3초 후 자동으로 숨김
 * 
 * @example
 * // 커스텀 ID를 가진 로딩바
 * const customLoader = oyster.loading('my-custom-loader');
 * customLoader.show();
 * // 나중에 동일한 ID로 재사용 가능
 * 
 * @example
 * // Promise와 함께 사용
 * const loader = oyster.loading();
 * loader.show();
 * fetch('/api/data')
 *   .then(response => response.json())
 *   .then(data => {
 *     console.log(data);
 *   })
 *   .finally(() => {
 *     loader.hide();
 *   });
 */
const loading = (containerId) => {
    let loadingElement = null;
    let autoHideTimer = null;
    const defaultId = 'oyster-loading-spinner';
    const targetId = containerId || defaultId;

    // 기존 로딩바 찾기
    loadingElement = document.getElementById(targetId);

    // 로딩바가 없으면 새로 생성
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = targetId;
        loadingElement.className = 'oyster-loading-overlay';
        loadingElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const spinner = document.createElement('div');
        spinner.className = 'oyster-loading-spinner';
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: oyster-spin 1s linear infinite;
        `;

        // CSS 애니메이션 추가
        if (!document.getElementById('oyster-loading-styles')) {
            const style = document.createElement('style');
            style.id = 'oyster-loading-styles';
            style.textContent = `
                @keyframes oyster-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        loadingElement.appendChild(spinner);
        document.body.appendChild(loadingElement);
    }

    return {
        /**
         * 로딩바를 표시합니다.
         * @param {number} [duration] - 자동으로 닫힐 시간(밀리초) (옵션)
         */
        show: (duration) => {
            if (loadingElement) {
                loadingElement.style.display = 'flex';

                // 기존 타이머가 있다면 제거
                if (autoHideTimer) {
                    clearTimeout(autoHideTimer);
                    autoHideTimer = null;
                }

                // duration이 있으면 자동으로 숨기기
                if (duration && duration > 0) {
                    autoHideTimer = setTimeout(() => {
                        if (loadingElement) {
                            loadingElement.style.display = 'none';
                        }
                        autoHideTimer = null;
                    }, duration);
                }
            }
        },

        /**
         * 로딩바를 숨깁니다.
         */
        hide: () => {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            // 자동 숨김 타이머가 있다면 제거
            if (autoHideTimer) {
                clearTimeout(autoHideTimer);
                autoHideTimer = null;
            }
        }
    };
};

export default loading;