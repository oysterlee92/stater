/**
 * Array Manipulation Utility Module
 * 
 * 배열 조작 및 변환을 위한 유틸리티 함수를 제공합니다.
 * 청크 분할, 중복 제거, 그룹화, 섞기, 평탄화 등의 기능을 포함합니다.
 * 
 * @module array
 * @example
 * import array from '@/resource/lib/array.js';
 * 
 * // 배열 청크 분할
 * array.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * 
 * // 중복 제거
 * array.unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
 * 
 * // 그룹화
 * const data = [
 *   { type: 'A', value: 1 },
 *   { type: 'B', value: 2 },
 *   { type: 'A', value: 3 }
 * ];
 * array.groupBy(data, 'type');
 * // { A: [{ type: 'A', value: 1 }, { type: 'A', value: 3 }], B: [{ type: 'B', value: 2 }] }
 * 
 * // 배열 섞기
 * array.shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4] (무작위)
 * 
 * // 배열 평탄화
 * array.flatten([1, [2, [3, 4]], 5], Infinity); // [1, 2, 3, 4, 5]
 */

/**
 * 배열 관련 유틸리티 함수들입니다.
 * @namespace array
 */
const array = {
    /**
     * 배열을 지정된 크기의 청크로 분할합니다.
     * @param {Array} array - 분할할 배열
     * @param {number} [size=1] - 청크 크기
     * @returns {Array} 청크 배열의 배열
     * @example
     * array.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
     */
    chunk: function(array, size = 1) {
        if (!Array.isArray(array)) return [];
        if (size < 1) size = 1;
        
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    },

    /**
     * 배열에서 중복 항목을 제거합니다.
     * @param {Array} array - 중복을 제거할 배열
     * @returns {Array} 중복이 제거된 배열
     * @example
     * array.unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
     */
    unique: function(array) {
        if (!Array.isArray(array)) return [];
        return [...new Set(array)];
    },

    /**
     * 배열 항목을 키 또는 함수를 기준으로 그룹화합니다.
     * @param {Array} array - 그룹화할 배열
     * @param {string|Function} keyOrFn - 그룹화 기준 키 또는 함수
     * @returns {Object} 그룹화된 객체
     * @example
     * array.groupBy([{type: 'A', value: 1}, {type: 'B', value: 2}, {type: 'A', value: 3}], 'type');
     * // {A: [{type: 'A', value: 1}, {type: 'A', value: 3}], B: [{type: 'B', value: 2}]}
     */
    groupBy: function(array, keyOrFn) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((result, item) => {
            const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(item);
            return result;
        }, {});
    },

    /**
     * 배열을 무작위로 섞습니다.
     * @param {Array} array - 섞을 배열
     * @returns {Array} 섞인 배열
     * @example
     * array.shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4] (무작위)
     */
    shuffle: function(array) {
        if (!Array.isArray(array)) return [];
        
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * 중첩된 배열을 평탄화합니다.
     * @param {Array} array - 평탄화할 배열
     * @param {number} [depth=1] - 평탄화 깊이
     * @returns {Array} 평탄화된 배열
     * @example
     * array.flatten([1, [2, [3, 4]], 5]); // [1, 2, [3, 4], 5]
     * array.flatten([1, [2, [3, 4]], 5], Infinity); // [1, 2, 3, 4, 5]
     */
    flatten: function(array, depth = 1) {
        if (!Array.isArray(array)) return [];
        
        if (depth === 0) return array.slice();
        
        return array.reduce((result, item) => {
            if (Array.isArray(item)) {
                result.push(...(depth > 1 ? this.flatten(item, depth - 1) : item));
            } else {
                result.push(item);
            }
            return result;
        }, []);
    }
};

export default array;