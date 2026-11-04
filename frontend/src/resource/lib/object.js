/**
 * Object Manipulation Utility Module
 * 
 * JavaScript 객체를 다루기 위한 다양한 유틸리티 함수를 제공합니다.
 * 깊은 복사, 병합, 비교, 선택, 제외, 변환 등의 기능을 포함합니다.
 * 
 * @module object
 * @example
 * import object from '@/resource/lib/object.js';
 * 
 * // 객체 깊은 복사
 * const original = { a: 1, b: { c: 2 } };
 * const cloned = object.deepClone(original);
 * 
 * // 객체 병합
 * const merged = object.deepMerge({ a: 1 }, { b: 2, c: 3 });
 * 
 * // 객체 비교
 * const isEqual = object.deepEqual({ a: 1 }, { a: 1 }); // true
 * 
 * // 특정 속성만 선택
 * const picked = object.pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }
 * 
 * // 특정 속성 제외
 * const omitted = object.omit({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }
 * 
 * // 중첩된 속성 접근
 * const value = object.get({ user: { name: 'John' } }, 'user.name'); // 'John'
 */

/**
 * 자바스크립트 객체 조작을 위한 유틸리티 객체입니다.
 * 객체 복제, 병합, 비교 등의 기능을 제공합니다.
 * @namespace object
 */
const object = {
    /**
     * 객체를 확장합니다. (deepMerge의 별칭)
     * @param {Object} target - 대상 객체
     * @param {...Object} sources - 소스 객체들 (대상 객체에 병합될 객체들)
     * @returns {Object} 병합된 객체
     */
    extend: function(target, ...sources) {
        let result = target;
        for (const source of sources) {
            result = this.deepMerge(result, source);
        }
        return result;
    },

    /**
     * 객체의 깊은 복사본을 생성합니다.
     * @param {Object} obj - 복사할 객체
     * @returns {Object} 복사된 객체
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // 날짜 객체 처리
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        // 배열 처리
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }

        // 일반 객체 처리
        const clonedObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    },

    /**
     * 두 객체를 깊게 병합합니다.
     * @param {Object} target - 대상 객체
     * @param {Object} source - 소스 객체 (대상 객체에 병합될 객체)
     * @returns {Object} 병합된 객체
     */
    deepMerge: function(target, source) {
        const output = Object.assign({}, target);

        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }

        return output;
    },

    /**
     * 값이 객체인지 확인합니다.
     * @param {*} item - 확인할 값
     * @returns {boolean} 객체 여부
     */
    isObject: function(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    },

    /**
     * 두 객체가 깊게 동일한지 비교합니다.
     * @param {Object} obj1 - 첫 번째 객체
     * @param {Object} obj2 - 두 번째 객체
     * @returns {boolean} 두 객체가 동일한지 여부
     */
    deepEqual: function(obj1, obj2) {
        // 기본 비교
        if (obj1 === obj2) return true;

        // null 또는 undefined 비교
        if (obj1 == null || obj2 == null) return false;

        // 타입 비교
        if (typeof obj1 !== typeof obj2) return false;

        // 원시 타입 비교
        if (typeof obj1 !== 'object') return obj1 === obj2;

        // 날짜 객체 비교
        if (obj1 instanceof Date && obj2 instanceof Date) {
            return obj1.getTime() === obj2.getTime();
        }

        // 배열 비교
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) return false;
            return obj1.every((val, idx) => this.deepEqual(val, obj2[idx]));
        }

        // 객체 키 비교
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        return keys1.every(key => 
            Object.prototype.hasOwnProperty.call(obj2, key) && 
            this.deepEqual(obj1[key], obj2[key])
        );
    },

    /**
     * 객체에서 지정된 키들만 선택하여 새 객체를 생성합니다.
     * @param {Object} obj - 원본 객체
     * @param {Array<string>} keys - 선택할 키 배열
     * @returns {Object} 선택된 키만 포함하는 새 객체
     */
    pick: function(obj, keys) {
        return keys.reduce((result, key) => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    },

    /**
     * 객체에서 지정된 키들을 제외한 새 객체를 생성합니다.
     * @param {Object} obj - 원본 객체
     * @param {Array<string>} keys - 제외할 키 배열
     * @returns {Object} 지정된 키가 제외된 새 객체
     */
    omit: function(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },

    /**
     * 객체의 모든 키-값 쌍에 함수를 적용합니다.
     * @param {Object} obj - 대상 객체
     * @param {Function} fn - 적용할 함수 (key, value) => [newKey, newValue]
     * @returns {Object} 변환된 새 객체
     */
    mapEntries: function(obj, fn) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => fn(key, value))
        );
    },

    /**
     * 객체의 값들에 함수를 적용합니다.
     * @param {Object} obj - 대상 객체
     * @param {Function} fn - 적용할 함수 (value, key) => newValue
     * @returns {Object} 변환된 새 객체
     */
    mapValues: function(obj, fn) {
        const result = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = fn(obj[key], key);
            }
        }
        return result;
    },

    /**
     * 객체가 비어있는지 확인합니다.
     * @param {Object} obj - 확인할 객체
     * @returns {boolean} 객체가 비어있는지 여부
     */
    isEmpty: function(obj) {
        return obj === null || obj === undefined || Object.keys(obj).length === 0;
    },

    /**
     * 객체에서 중첩된 속성 값을 가져옵니다.
     * @param {Object} obj - 대상 객체
     * @param {string} path - 속성 경로 (예: 'user.profile.name')
     * @param {*} [defaultValue=undefined] - 값이 없을 경우 반환할 기본값
     * @returns {*} 찾은 값 또는 기본값
     */
    get: function(obj, path, defaultValue) {
        const keys = path.split('.');
        let result = obj;

        for (const key of keys) {
            if (result === null || result === undefined || typeof result !== 'object') {
                return defaultValue;
            }
            result = result[key];
        }

        return result === undefined ? defaultValue : result;
    },

    /**
     * 객체에 중첩된 속성 값을 설정합니다.
     * @param {Object} obj - 대상 객체
     * @param {string} path - 속성 경로 (예: 'user.profile.name')
     * @param {*} value - 설정할 값
     * @returns {Object} 수정된 객체
     */
    set: function(obj, path, value) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const result = this.deepClone(obj);
        const keys = path.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
        return result;
    }
}

export default object;
