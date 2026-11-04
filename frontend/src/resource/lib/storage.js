/**
 * Browser Storage Utility Module
 * 
 * 브라우저의 localStorage와 sessionStorage를 쉽게 사용할 수 있는 유틸리티를 제공합니다.
 * 객체는 자동으로 JSON으로 직렬화되어 저장되고, 조회 시 자동으로 파싱됩니다.
 * 
 * @module storage
 * @example
 * import storage from '@/resource/lib/storage.js';
 * 
 * // 데이터 저장
 * storage.set('user', { name: 'John', age: 30 });
 * storage.setSession('tempData', 'temporary value');
 * 
 * // 데이터 조회
 * const user = storage.get('user'); // { name: 'John', age: 30 }
 * const tempData = storage.getSession('tempData', 'default'); // 'temporary value'
 * 
 * // 데이터 삭제
 * storage.remove('user');
 * storage.clearLocal(); // 모든 localStorage 데이터 삭제
 */

/**
 * 브라우저 스토리지(localStorage, sessionStorage) 작업을 위한 유틸리티 객체입니다.
 * @namespace storage
 */
const storage = {
    /**
     * 스토리지에 데이터를 저장합니다.
     * @param {string} key - 저장할 데이터의 키
     * @param {*} value - 저장할 데이터 값 (객체는 자동으로 JSON으로 변환됨)
     * @param {string} [type='local'] - 스토리지 타입 ('local' 또는 'session')
     * @returns {boolean} 저장 성공 여부
     */
    set: function(key, value, type = 'local') {
        return type === 'session' ? this.setSession(key, value) : this.setLocal(key, value);
    },

    /**
     * 스토리지에서 데이터를 가져옵니다.
     * @param {string} key - 가져올 데이터의 키
     * @param {string} [type='local'] - 스토리지 타입 ('local' 또는 'session')
     * @param {*} [defaultValue=null] - 데이터가 없을 경우 반환할 기본값
     * @returns {*} 저장된 데이터 값 (JSON 형식이면 자동으로 파싱됨)
     */
    get: function(key, type = 'local', defaultValue = null) {
        return type === 'session' ? this.getSession(key, defaultValue) : this.getLocal(key, defaultValue);
    },

    /**
     * 스토리지에서 특정 키의 데이터를 삭제합니다.
     * @param {string} key - 삭제할 데이터의 키
     * @param {string} [type='local'] - 스토리지 타입 ('local' 또는 'session')
     * @returns {boolean} 삭제 성공 여부
     */
    remove: function(key, type = 'local') {
        return type === 'session' ? this.removeSession(key) : this.removeLocal(key);
    },
    /**
     * localStorage에 데이터를 저장합니다.
     * @param {string} key - 저장할 데이터의 키
     * @param {*} value - 저장할 데이터 값 (객체는 자동으로 JSON으로 변환됨)
     * @returns {boolean} 저장 성공 여부
     */
    setLocal: function(key, value) {
        try {
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('localStorage에 데이터를 저장하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * localStorage에서 데이터를 가져옵니다.
     * @param {string} key - 가져올 데이터의 키
     * @param {*} [defaultValue=null] - 데이터가 없을 경우 반환할 기본값
     * @returns {*} 저장된 데이터 값 (JSON 형식이면 자동으로 파싱됨)
     */
    getLocal: function(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;

            // JSON 형식인지 확인하고 파싱 시도
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
            return value;
        } catch (error) {
            console.error('localStorage에서 데이터를 가져오는 중 오류가 발생했습니다:', error);
            return defaultValue;
        }
    },

    /**
     * localStorage에서 특정 키의 데이터를 삭제합니다.
     * @param {string} key - 삭제할 데이터의 키
     * @returns {boolean} 삭제 성공 여부
     */
    removeLocal: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('localStorage에서 데이터를 삭제하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * localStorage의 모든 데이터를 삭제합니다.
     * @returns {boolean} 삭제 성공 여부
     */
    clearLocal: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('localStorage를 초기화하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * sessionStorage에 데이터를 저장합니다.
     * @param {string} key - 저장할 데이터의 키
     * @param {*} value - 저장할 데이터 값 (객체는 자동으로 JSON으로 변환됨)
     * @returns {boolean} 저장 성공 여부
     */
    setSession: function(key, value) {
        try {
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            sessionStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('sessionStorage에 데이터를 저장하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * sessionStorage에서 데이터를 가져옵니다.
     * @param {string} key - 가져올 데이터의 키
     * @param {*} [defaultValue=null] - 데이터가 없을 경우 반환할 기본값
     * @returns {*} 저장된 데이터 값 (JSON 형식이면 자동으로 파싱됨)
     */
    getSession: function(key, defaultValue = null) {
        try {
            const value = sessionStorage.getItem(key);
            if (value === null) return defaultValue;

            // JSON 형식인지 확인하고 파싱 시도
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
            return value;
        } catch (error) {
            console.error('sessionStorage에서 데이터를 가져오는 중 오류가 발생했습니다:', error);
            return defaultValue;
        }
    },

    /**
     * sessionStorage에서 특정 키의 데이터를 삭제합니다.
     * @param {string} key - 삭제할 데이터의 키
     * @returns {boolean} 삭제 성공 여부
     */
    removeSession: function(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('sessionStorage에서 데이터를 삭제하는 중 오류가 발생했습니다:', error);
            return false;
        }
    },

    /**
     * sessionStorage의 모든 데이터를 삭제합니다.
     * @returns {boolean} 삭제 성공 여부
     */
    clearSession: function() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('sessionStorage를 초기화하는 중 오류가 발생했습니다:', error);
            return false;
        }
    }
}

export default storage;
