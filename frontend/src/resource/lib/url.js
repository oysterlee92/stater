/**
 * URL Manipulation Utility Module
 * 
 * URL 파싱, 쿼리 파라미터 조작, 인코딩/디코딩 등의 유틸리티 함수를 제공합니다.
 * 브라우저 히스토리 관리 기능도 포함합니다.
 * 
 * @module url
 * @example
 * import url from '@/resource/lib/url.js';
 * 
 * // 쿼리 파라미터 조회
 * const params = url.getQueryParams(); // { name: 'John', age: '30' }
 * 
 * // 쿼리 파라미터 업데이트
 * const newUrl = url.updateQueryParam('page', '2');
 * 
 * // 히스토리 푸시
 * url.pushQueryParams({ page: '2', sort: 'desc' });
 * 
 * // 히스토리 대체
 * url.replaceQueryParams({ filter: 'active' });
 * 
 * // URL 유효성 확인
 * url.isValid('https://example.com'); // true
 * 
 * // 인코딩/디코딩
 * const encoded = url.encode('안녕하세요'); // '%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94'
 * const decoded = url.decode(encoded); // '안녕하세요'
 */

/**
 * URL 관련 유틸리티 함수들입니다.
 * @namespace url
 */
const url = {
    /**
     * URL에서 쿼리 파라미터를 파싱합니다.
     * @param {string} [url=window.location.href] - 파싱할 URL
     * @returns {Object} 쿼리 파라미터 객체
     * @example
     * // URL이 'https://example.com?name=John&age=30'인 경우
     * url.getQueryParams(); // { name: 'John', age: '30' }
     */
    getQueryParams: function(url = window.location.href) {
        const params = {};
        const queryString = url.split('?')[1];
        
        if (!queryString) return params;
        
        const searchParams = new URLSearchParams(queryString);
        for (const [key, value] of searchParams.entries()) {
            // 이미 키가 존재하고 배열이 아니면 배열로 변환
            if (params[key] !== undefined && !Array.isArray(params[key])) {
                params[key] = [params[key]];
            }
            
            // 이미 배열인 경우 값 추가
            if (Array.isArray(params[key])) {
                params[key].push(value);
            } else {
                params[key] = value;
            }
        }
        
        return params;
    },

    /**
     * URL의 쿼리 파라미터를 업데이트합니다.
     * @param {string} key - 업데이트할 파라미터 키
     * @param {string} value - 업데이트할 파라미터 값
     * @param {string} [url=window.location.href] - 업데이트할 URL
     * @returns {string} 업데이트된 URL
     * @example
     * // URL이 'https://example.com?name=John'인 경우
     * url.updateQueryParam('age', '30'); // 'https://example.com?name=John&age=30'
     */
    updateQueryParam: function(key, value, url = window.location.href) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(key, value);
        return urlObj.toString();
    },

    /**
     * URL에서 지정된 쿼리 파라미터를 제거합니다.
     * @param {string} key - 제거할 파라미터 키
     * @param {string} [url=window.location.href] - 수정할 URL
     * @returns {string} 파라미터가 제거된 URL
     * @example
     * // URL이 'https://example.com?name=John&age=30'인 경우
     * url.removeQueryParam('age'); // 'https://example.com?name=John'
     */
    removeQueryParam: function (key, url = window.location.href) {
        const urlObj = new URL(url);
        urlObj.searchParams.delete(key);
        return urlObj.toString();
    },

    /**
     * 브라우저 URL의 쿼리 파라미터를 업데이트하고 히스토리에 추가합니다.
     * @param {Object} params - 업데이트할 쿼리 파라미터 객체
     * @param {string} [url=window.location.href] - 업데이트할 URL
     * @example
     * url.pushQueryParams({ page: '2', sort: 'desc' });
     * url.pushQueryParams({ page: '2', sort: 'desc' }, 'https://example.com');
     */
    pushQueryParams: function (params, url = window.location.href) {
        const urlObj = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
            urlObj.searchParams.set(key, value);
        });
        window.history.pushState({}, '', urlObj.toString());
    },

    /**
     * 브라우저 URL의 쿼리 파라미터를 업데이트하고 현재 히스토리를 대체합니다.
     * @param {Object} params - 업데이트할 쿼리 파라미터 객체
     * @param {string} [url=window.location.href] - 업데이트할 URL
     * @example
     * url.replaceQueryParams({ page: '2', sort: 'desc' });
     * url.replaceQueryParams({ page: '2', sort: 'desc' }, 'https://example.com');
     */
    replaceQueryParams: function (params, url = window.location.href) {
        const urlObj = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
            urlObj.searchParams.set(key, value);
        });
        window.history.replaceState({}, '', urlObj.toString());
    },

    /**
     * 문자열이 유효한 URL인지 확인합니다.
     * @param {string} url - 확인할 URL 문자열
     * @returns {boolean} 유효한 URL 여부
     * @example
     * url.isValid('https://example.com'); // true
     * url.isValid('invalid-url'); // false
     */
    isValid: function(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 문자열을 URL 인코딩합니다. 특수 문자를 퍼센트 인코딩으로 변환합니다.
     * encodeURIComponent를 사용하여 URL 컴포넌트(쿼리 파라미터 등)에 안전하게 사용할 수 있도록 합니다.
     * @param {string} str - 인코딩할 문자열
     * @returns {string} 인코딩된 문자열
     * @example
     * url.encode('안녕하세요?'); // '%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94%3F'
     * url.encode('name=John Doe'); // 'name%3DJohn%20Doe'
     */
    encode: function(str) {
        if (str === null || str === undefined) {
            return '';
        }
    
        try {
            return encodeURIComponent(str);
        } catch (e) {
            console.error('URL 인코딩 중 오류가 발생했습니다:', e);
            return String(str);
        }
    },

    /**
     * URL 인코딩된 문자열을 디코딩합니다. 퍼센트 인코딩을 원래 문자로 변환합니다.
     * decodeURIComponent를 사용하여 URL 컴포넌트를 디코딩합니다.
     * @param {string} str - 디코딩할 인코딩된 문자열
     * @returns {string} 디코딩된 문자열
     * @example
     * url.decode('%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94%3F'); // '안녕하세요?'
     * url.decode('name%3DJohn%20Doe'); // 'name=John Doe'
     */
    decode: function(str) {
        if (str === null || str === undefined) {
            return '';
        }
    
        try {
            return decodeURIComponent(str);
        } catch (e) {
            console.error('URL 디코딩 중 오류가 발생했습니다:', e);
            return String(str);
        }
    },

    /**
     * 전체 URL 문자열을 인코딩합니다.
     * encodeURI를 사용하여 URL의 특수 문자를 인코딩하되, URL의 기능적 문자(/, :, &, ? 등)는 보존합니다.
     * @param {string} uri - 인코딩할 URL 문자열
     * @returns {string} 인코딩된 URL 문자열
     * @example
     * url.encodeURI('https://example.com/path?name=홍길동'); // 'https://example.com/path?name=%ED%99%8D%EA%B8%B8%EB%8F%99'
     */
    encodeURI: function(uri) {
        if (uri === null || uri === undefined) {
            return '';
        }
    
        try {
            return window.encodeURI(uri);
        } catch (e) {
            console.error('URI 인코딩 중 오류가 발생했습니다:', e);
            return String(uri);
        }
    },

    /**
     * 인코딩된 전체 URL 문자열을 디코딩합니다.
     * decodeURI를 사용하여 인코딩된 URL을 원래 형태로 복원합니다.
     * @param {string} uri - 디코딩할 인코딩된 URL 문자열
     * @returns {string} 디코딩된 URL 문자열
     * @example
     * url.decodeURI('https://example.com/path?name=%ED%99%8D%EA%B8%B8%EB%8F%99'); // 'https://example.com/path?name=홍길동'
     */
    decodeURI: function(uri) {
        if (uri === null || uri === undefined) {
            return '';
        }
    
        try {
            return window.decodeURI(uri);
        } catch (e) {
            console.error('URI 디코딩 중 오류가 발생했습니다:', e);
            return String(uri);
        }
    }
};

export default url;