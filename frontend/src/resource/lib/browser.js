/**
 * Browser and Device Detection Utility Module
 * 
 * 브라우저 종류, 버전, 운영체제, 디바이스 타입을 감지하는 유틸리티 함수를 제공합니다.
 * 클립보드 복사 기능도 포함합니다.
 * 
 * @module browser
 * @example
 * import browser from '@/resource/lib/browser.js';
 * 
 * // 모바일 기기 확인
 * if (browser.isMobile()) {
 *   console.log('모바일 기기입니다');
 * }
 * 
 * // 브라우저 정보
 * const { name, version } = browser.getBrowserInfo();
 * console.log(`브라우저: ${name} ${version}`);
 * 
 * // 운영체제 정보
 * const { name: osName, version: osVersion } = browser.getOSInfo();
 * console.log(`OS: ${osName} ${osVersion}`);
 * 
 * // 클립보드 복사
 * browser.copyToClipboard('복사할 텍스트').then(success => {
 *   if (success) {
 *     console.log('복사 성공');
 *   }
 * });
 */

/**
 * 브라우저/디바이스 관련 유틸리티 함수들입니다.
 * @namespace browser
 */
const browser = {
    /**
     * 사용자가 모바일 기기를 사용하고 있는지 확인합니다.
     * @returns {boolean} 모바일 기기 여부
     * @example
     * if (browser.isMobile()) {
     *   // 모바일 기기에 대한 처리
     * }
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * 브라우저 정보를 가져옵니다.
     * @returns {Object} 브라우저 이름과 버전을 포함하는 객체
     * @example
     * const { name, version } = browser.getBrowserInfo();
     */
    getBrowserInfo: function() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        // Chrome
        if (/Chrome/.test(ua) && !/Chromium|Edge|Edg|OPR|SamsungBrowser/.test(ua)) {
            browserName = 'Chrome';
            browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)[1];
        }
        // Firefox
        else if (/Firefox/.test(ua)) {
            browserName = 'Firefox';
            browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)[1];
        }
        // Safari
        else if (/Safari/.test(ua) && !/Chrome|Chromium|Edge|Edg|OPR|SamsungBrowser/.test(ua)) {
            browserName = 'Safari';
            browserVersion = ua.match(/Version\/(\d+\.\d+)/)[1];
        }
        // Edge
        else if (/Edge|Edg/.test(ua)) {
            browserName = 'Edge';
            browserVersion = ua.match(/Edge\/(\d+\.\d+)|Edg\/(\d+\.\d+)/)[1] || ua.match(/Edge\/(\d+\.\d+)|Edg\/(\d+\.\d+)/)[2];
        }
        // IE
        else if (/MSIE|Trident/.test(ua)) {
            browserName = 'Internet Explorer';
            browserVersion = ua.match(/MSIE (\d+\.\d+)/) ? ua.match(/MSIE (\d+\.\d+)/)[1] : '11.0';
        }
        // Opera
        else if (/OPR/.test(ua)) {
            browserName = 'Opera';
            browserVersion = ua.match(/OPR\/(\d+\.\d+)/)[1];
        }
        
        return { name: browserName, version: browserVersion };
    },

    /**
     * 운영체제 정보를 가져옵니다.
     * @returns {Object} 운영체제 이름과 버전을 포함하는 객체
     * @example
     * const { name, version } = browser.getOSInfo();
     */
    getOSInfo: function() {
        const ua = navigator.userAgent;
        let osName = 'Unknown';
        let osVersion = 'Unknown';
        
        // Windows
        if (/Windows/.test(ua)) {
            osName = 'Windows';
            if (/Windows NT 10.0/.test(ua)) osVersion = '10';
            else if (/Windows NT 6.3/.test(ua)) osVersion = '8.1';
            else if (/Windows NT 6.2/.test(ua)) osVersion = '8';
            else if (/Windows NT 6.1/.test(ua)) osVersion = '7';
            else if (/Windows NT 6.0/.test(ua)) osVersion = 'Vista';
            else if (/Windows NT 5.1/.test(ua)) osVersion = 'XP';
        }
        // macOS
        else if (/Macintosh/.test(ua)) {
            osName = 'macOS';
            const versionMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
            if (versionMatch) {
                osVersion = versionMatch[1].replace(/_/g, '.');
            }
        }
        // iOS
        else if (/iPhone|iPad|iPod/.test(ua)) {
            osName = 'iOS';
            const versionMatch = ua.match(/OS (\d+[._]\d+[._]?\d*)/);
            if (versionMatch) {
                osVersion = versionMatch[1].replace(/_/g, '.');
            }
        }
        // Android
        else if (/Android/.test(ua)) {
            osName = 'Android';
            const versionMatch = ua.match(/Android (\d+\.\d+)/);
            if (versionMatch) {
                osVersion = versionMatch[1];
            }
        }
        // Linux
        else if (/Linux/.test(ua)) {
            osName = 'Linux';
        }
        
        return { name: osName, version: osVersion };
    },

    /**
     * 텍스트를 클립보드에 복사합니다.
     * @param {string} text - 복사할 텍스트
     * @returns {Promise<boolean>} 복사 성공 여부를 나타내는 Promise
     * @example
     * browser.copyToClipboard('복사할 텍스트').then(success => {
     *   if (success) {
     *     console.log('복사 성공');
     *   } else {
     *     console.log('복사 실패');
     *   }
     * });
     */
    copyToClipboard: function(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // 보안 컨텍스트에서 Clipboard API 사용
            return navigator.clipboard.writeText(text)
                .then(() => true)
                .catch(() => false);
        } else {
            // 폴백: 텍스트 영역 요소 사용
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return Promise.resolve(success);
            } catch (err) {
                return Promise.resolve(false);
            }
        }
    }
};

export default browser;