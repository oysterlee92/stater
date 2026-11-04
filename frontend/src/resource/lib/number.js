/**
 * Number Formatting and Manipulation Utility Module
 * 
 * 숫자 포맷팅, 통화 형식 변환, 범위 제한, 랜덤 생성 등의 유틸리티 함수를 제공합니다.
 * 
 * @module number
 * @example
 * import number from '@/resource/lib/number.js';
 * 
 * // 천 단위 구분자 포맷팅
 * number.format(1234567); // '1,234,567'
 * 
 * // 통화 형식 포맷팅
 * number.formatCurrency(1234567); // '₩1,234,567'
 * number.formatCurrency(1234567, '$'); // '$1,234,567'
 * 
 * // 범위 제한
 * number.clamp(5, 1, 10); // 5
 * number.clamp(0, 1, 10); // 1
 * number.clamp(15, 1, 10); // 10
 * 
 * // 랜덤 정수 생성
 * number.randomInt(1, 10); // 1과 10 사이의 랜덤 정수
 */

/**
 * 숫자 관련 유틸리티 함수들입니다.
 * @namespace number
 */
const number = {
    /**
     * 숫자를 천 단위 구분자가 있는 형식으로 포맷팅합니다.
     * @param {number} num - 포맷팅할 숫자
     * @param {string} [separator=','] - 천 단위 구분자
     * @returns {string} 포맷팅된 숫자 문자열
     * @example
     * number.format(1234567); // '1,234,567'
     */
    format: function(num, separator = ',') {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    },

    /**
     * 숫자를 통화 형식으로 포맷팅합니다.
     * @param {number} num - 포맷팅할 숫자
     * @param {string} [currency='₩'] - 통화 기호
     * @param {string} [separator=','] - 천 단위 구분자
     * @returns {string} 포맷팅된 통화 문자열
     * @example
     * number.formatCurrency(1234567); // '₩1,234,567'
     */
    formatCurrency: function(num, currency = '₩', separator = ',') {
        if (typeof num !== 'number' || isNaN(num)) return `${currency}0`;
        return `${currency}${this.format(num, separator)}`;
    },

    /**
     * 숫자를 지정된 범위 내로 제한합니다.
     * @param {number} num - 제한할 숫자
     * @param {number} min - 최소값
     * @param {number} max - 최대값
     * @returns {number} 제한된 숫자
     * @example
     * number.clamp(5, 1, 10); // 5
     * number.clamp(0, 1, 10); // 1
     * number.clamp(15, 1, 10); // 10
     */
    clamp: function(num, min, max) {
        if (typeof num !== 'number' || isNaN(num)) return min;
        return Math.min(Math.max(num, min), max);
    },

    /**
     * 지정된 범위 내의 랜덤 정수를 생성합니다.
     * @param {number} min - 최소값 (포함)
     * @param {number} max - 최대값 (포함)
     * @returns {number} 생성된 랜덤 정수
     * @example
     * number.randomInt(1, 10); // 1과 10 사이의 랜덤 정수
     */
    randomInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

export default number;