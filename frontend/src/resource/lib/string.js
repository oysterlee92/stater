/**
 * String Manipulation Utility Module
 * 
 * 문자열 검증, 변환, 조작을 위한 유틸리티 함수를 제공합니다.
 * null/빈 문자열 확인, 자르기, HTML 이스케이프 해제, 패딩 등의 기능을 포함합니다.
 * 
 * @module string
 * @example
 * import string from '@/resource/lib/string.js';
 * 
 * // null/빈 값 확인
 * string.isNullOrEmpty(''); // true
 * string.isNullOrEmpty('  '); // true
 * string.isNullOrEmpty('hello'); // false
 * 
 * // 문자열 자르기
 * string.truncate('안녕하세요 반갑습니다', 5); // '안녕하...'
 * 
 * // 랜덤 문자열 생성
 * const randomStr = string.generateRandom(10); // 10자 랜덤 문자열
 * 
 * // 패딩
 * string.leftPad('123', 5, '0'); // '00123'
 * string.rightPad('123', 5, '0'); // '12300'
 */

/**
 * 문자열 관련 유틸리티 함수들입니다.
 * @namespace string
 */
const string = {
    /**
     * 값이 null 또는 undefined인지 확인합니다.
     * @param {*} value - 확인할 값
     * @returns {boolean} null 또는 undefined 여부
     * @example
     * string.isNull(null); // true
     * string.isNull(undefined); // true
     * string.isNull(''); // false
     * string.isNull('hello'); // false
     */
    isNull: function (value) {
        return value === null || value === undefined;
    },

    /**
     * 값이 null, undefined, 빈 문자열 또는 공백만 포함하는지 확인합니다.
     * @param {string} str - 확인할 문자열
     * @returns {boolean} 빈 문자열 또는 공백만 포함하는지 여부
     * @example
     * string.isEmpty(null); // true
     * string.isEmpty(undefined); // true
     * string.isEmpty(''); // true
     * string.isEmpty('   '); // true
     * string.isEmpty('hello'); // false
     */
    isEmpty: function (str) {
        if (this.isNull(str)) return true;
        if (typeof str !== 'string') return false;
        return str.trim().length === 0;
    },

    /**
     * 문자열을 지정된 길이로 자르고 말줄임표를 추가합니다.
     * @param {string} str - 자를 문자열
     * @param {number} length - 최대 길이
     * @param {string} [ellipsis='...'] - 말줄임표 문자열
     * @returns {string} 잘린 문자열
     * @example
     * string.truncate('안녕하세요 반갑습니다', 5); // '안녕하...'
     */
    truncate: function (str, length, ellipsis = '...') {
        if (!str || typeof str !== 'string') return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + ellipsis;
    },

    /**
     * 이스케이프된 HTML 특수 문자를 원래대로 복원합니다.
     * @param {string} html - 복원할 이스케이프된 HTML 문자열
     * @returns {string} 복원된 문자열
     * @example
     * string.unescapeHTML('&lt;div&gt;Hello&lt;/div&gt;'); // '<div>Hello</div>'
     */
    unescapeHTML: function (html) {
        if (!html || typeof html !== 'string') return '';

        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || '';  // innerText 제거
    },

    /**
     * 지정된 길이의 랜덤 문자열을 생성합니다.
     * @param {number} [length=8] - 생성할 문자열 길이
     * @param {string} [chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'] - 사용할 문자 집합
     * @returns {string} 생성된 랜덤 문자열
     * @example
     * string.generateRandom(10); // 랜덤 10자 문자열
     */
    generateRandom: function (length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        const charsLength = chars.length;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * charsLength));
        }
        return result;
    },

    /**
     * 문자열의 왼쪽에 지정된 문자를 채워 원하는 길이로 만듭니다.
     * @param {string} str - 패딩할 문자열
     * @param {number} length - 원하는 최종 길이
     * @param {string} [padChar=' '] - 채울 문자
     * @returns {string} 왼쪽에 패딩이 추가된 문자열
     * @example
     * string.leftPad('123', 5); // '  123'
     * string.leftPad('123', 5, '0'); // '00123'
     * string.leftPad('123', 2); // '123' (원래 길이가 더 길면 그대로 반환)
     */
    leftPad: function (str, length, padChar = ' ') {
        if (!str && str !== '') return '';
        str = String(str);
        if (str.length >= length) return str;

        return padChar.repeat(length - str.length) + str;
    },

    /**
     * 문자열의 오른쪽에 지정된 문자를 채워 원하는 길이로 만듭니다.
     * @param {string} str - 패딩할 문자열
     * @param {number} length - 원하는 최종 길이
     * @param {string} [padChar=' '] - 채울 문자
     * @returns {string} 오른쪽에 패딩이 추가된 문자열
     * @example
     * string.rightPad('123', 5); // '123  '
     * string.rightPad('123', 5, '0'); // '12300'
     * string.rightPad('123', 2); // '123' (원래 길이가 더 길면 그대로 반환)
     */
    rightPad: function (str, length, padChar = ' ') {
        if (!str && str !== '') return '';
        str = String(str);
        if (str.length >= length) return str;

        return str + padChar.repeat(length - str.length);
    }
};

export default string;