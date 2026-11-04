/**
 * Cookie Management Utility Module
 * 
 * 브라우저 쿠키를 생성, 조회, 삭제하는 유틸리티를 제공합니다.
 * 만료일, 경로, 도메인, 보안 옵션 등을 설정할 수 있습니다.
 * 
 * @module cookie
 * @example
 * import cookie from '@/resource/lib/cookie.js';
 * 
 * // 쿠키 설정 (7일 후 만료)
 * cookie.set('username', 'John', { expires: 7 });
 * 
 * // 쿠키 조회
 * const username = cookie.get('username'); // 'John'
 * 
 * // 모든 쿠키 조회
 * const allCookies = cookie.getAll(); // { username: 'John', ... }
 * 
 * // 쿠키 존재 확인
 * if (cookie.exists('username')) {
 *   console.log('사용자 이름 쿠키가 존재합니다');
 * }
 * 
 * // 쿠키 삭제
 * cookie.remove('username');
 * 
 * // 보안 쿠키 설정 (HTTPS에서만)
 * cookie.set('token', 'abc123', {
 *   expires: 1,
 *   secure: true,
 *   sameSite: 'strict'
 * });
 */

/**
 * 쿠키 관리를 위한 유틸리티 객체입니다.
 * 쿠키 설정, 조회, 삭제 및 만료일 관리 기능을 제공합니다.
 * @namespace cookie
 */
const cookie = {
    /**
     * 쿠키를 설정합니다.
     * @param {string} name - 쿠키 이름
     * @param {string} value - 쿠키 값
     * @param {Object} [options={}] - 쿠키 옵션
     * @param {number|Date} [options.expires] - 쿠키 만료 시간 (일 수 또는 Date 객체)
     * @param {string} [options.path='/'] - 쿠키 경로
     * @param {string} [options.domain] - 쿠키 도메인
     * @param {boolean} [options.secure=false] - 보안 쿠키 여부 (HTTPS에서만 전송)
     * @param {string} [options.sameSite] - SameSite 속성 ('strict', 'lax', 'none')
     * @returns {boolean} 쿠키 설정 성공 여부
     */
    set: function(name, value, options = {}) {
        try {
            options = {
                path: '/',
                ...options
            };

            // 만료일 처리
            if (options.expires) {
                if (options.expires instanceof Date) {
                    options.expires = options.expires.toUTCString();
                } else {
                    // 숫자인 경우 일 수로 간주
                    const days = options.expires;
                    const date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    options.expires = date.toUTCString();
                }
            }

            // 쿠키 문자열 생성
            let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
            
            // 옵션 추가
            for (const [key, val] of Object.entries(options)) {
                if (val === true) {
                    cookieString += `; ${key}`;
                } else if (val) {
                    cookieString += `; ${key}=${val}`;
                }
            }
            
            // 쿠키 설정
            document.cookie = cookieString;
            return true;
        } catch (error) {
            console.error('쿠키를 설정하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * 쿠키 값을 가져옵니다.
     * @param {string} name - 가져올 쿠키 이름
     * @returns {string|null} 쿠키 값 또는 쿠키가 없는 경우 null
     */
    get: function(name) {
        try {
            const cookieName = `${encodeURIComponent(name)}=`;
            const cookies = document.cookie.split(';');
            
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.indexOf(cookieName) === 0) {
                    return decodeURIComponent(cookie.substring(cookieName.length));
                }
            }
            return null;
        } catch (error) {
            console.error('쿠키를 가져오는 중 오류가 발생했습니다:', error);
            return null;
        }
    },

    /**
     * 쿠키를 삭제합니다.
     * @param {string} name - 삭제할 쿠키 이름
     * @param {Object} [options={}] - 쿠키 옵션 (path, domain 등)
     * @param {string} [options.path='/'] - 쿠키 경로
     * @param {string} [options.domain] - 쿠키 도메인
     * @returns {boolean} 쿠키 삭제 성공 여부
     */
    remove: function(name, options = {}) {
        try {
            // 만료일을 과거로 설정하여 쿠키 삭제
            options = {
                path: '/',
                ...options,
                expires: new Date(0) // 1970년 1월 1일로 설정
            };
            
            return this.set(name, '', options);
        } catch (error) {
            console.error('쿠키를 삭제하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * 모든 쿠키를 가져옵니다.
     * @returns {Object} 모든 쿠키를 포함하는 객체 (키-값 쌍)
     */
    getAll: function() {
        try {
            const cookies = {};
            const cookieString = document.cookie;
            
            if (cookieString === '') {
                return cookies;
            }
            
            const cookiePairs = cookieString.split(';');
            for (let pair of cookiePairs) {
                pair = pair.trim();
                const separatorIndex = pair.indexOf('=');
                if (separatorIndex > 0) {
                    const name = decodeURIComponent(pair.substring(0, separatorIndex));
                    const value = decodeURIComponent(pair.substring(separatorIndex + 1));
                    cookies[name] = value;
                }
            }
            
            return cookies;
        } catch (error) {
            console.error('모든 쿠키를 가져오는 중 오류가 발생했습니다:', error);
            return {};
        }
    },

    /**
     * 특정 쿠키가 존재하는지 확인합니다.
     * @param {string} name - 확인할 쿠키 이름
     * @returns {boolean} 쿠키 존재 여부
     */
    exists: function(name) {
        return this.get(name) !== null;
    },

    /**
     * 날짜 객체로부터 쿠키 만료일 문자열을 생성합니다.
     * @param {Date} date - 만료일 날짜 객체
     * @returns {string} 쿠키 만료일 문자열 (UTC 형식)
     */
    getExpiresString: function(date) {
        return date.toUTCString();
    },

    /**
     * 지정된 일 수 후의 만료일 날짜 객체를 생성합니다.
     * @param {number} days - 만료까지의 일 수
     * @returns {Date} 만료일 날짜 객체
     */
    createExpirationDate: function(days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        return date;
    }
}

export default cookie;