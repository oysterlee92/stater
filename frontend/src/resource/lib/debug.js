/**
 * Debugging and Logging Utility Module
 * 
 * 디버깅 및 로깅을 위한 유틸리티를 제공합니다.
 * 다양한 로그 레벨(log, info, warn, error)을 지원하며 타임스탬프를 자동으로 추가합니다.
 * 각 로그 메시지는 색상이 지정되어 콘솔에서 쉽게 구분할 수 있습니다.
 * 
 * @module debug
 * @example
 * import debug from '@/resource/lib/debug.js';
 * 
 * // 정보 로그
 * debug.info('애플리케이션 시작됨');
 * 
 * // 데이터와 함께 로그
 * debug.log('사용자 정보', { id: 1, name: 'John' });
 * 
 * // 경고 로그
 * debug.warn('API 응답 지연');
 * 
 * // 에러 로그
 * debug.error('요청 실패', error);
 * 
 * // 성능 측정
 * debug.time('데이터 로드');
 * await loadData();
 * debug.timeEnd('데이터 로드');
 */

/**
 * Debug Utility Module
 * 
 * 디버깅 및 로깅을 위한 유틸리티 객체입니다.
 * 다양한 로그 레벨(log, info, warn, error)을 지원하며 타임스탬프를 자동으로 추가합니다.
 * 코드 실행 시간 측정을 위한 time/timeEnd 메서드도 제공합니다.
 * 
 * @module debug
 * @namespace debug
 * @example
 * import debug from '@/resource/lib/debug.js';
 * 
 * // 일반 로그
 * debug.log('처리 시작');
 * 
 * // 정보 로그
 * debug.info('사용자 데이터:', { name: 'John', age: 30 });
 * 
 * // 경고 로그
 * debug.warn('유효하지 않은 입력');
 * 
 * // 에러 로그
 * debug.error('API 호출 실패:', error);
 * 
 * // 성능 측정
 * debug.time('데이터 로드');
 * await loadData();
 * debug.timeEnd('데이터 로드'); // "데이터 로드: 1234.56ms" 출력
 */
const debug = {
    /**
     * 현재 시간을 HH:MM:SS.mmm 형식으로 반환합니다.
     * @private
     * @returns {string} 형식화된 타임스탬프 문자열
     */
    _getTimeStamp: function() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    },

    /**
     * 일반 로그 메시지를 콘솔에 출력합니다.
     * @param {string} message - 출력할 로그 메시지
     * @param {*} [data=null] - 함께 출력할 추가 데이터 (객체, 배열 등)
     */
    log: function(message, data = null) {
        const timestamp = this._getTimeStamp();
        if (data === null) {
            console.log('%c[log]', 'color: #0066cc; font-weight: bold;', `${timestamp} | ${message}`);
        } else {
            console.log('%c[log]', 'color: #0066cc; font-weight: bold;', `${timestamp} | ${message}`, data);
        }
    },

    /**
     * 정보 로그 메시지를 콘솔에 출력합니다.
     * @param {string} message - 출력할 정보 메시지
     * @param {*} [data=null] - 함께 출력할 추가 데이터 (객체, 배열 등)
     */
    info: function(message, data = null) {
        const timestamp = this._getTimeStamp();
        if (data === null) {
            console.info('%c[info]', 'color: #009900; font-weight: bold;', `${timestamp} | ${message}`);
        } else {
            console.info('%c[info]', 'color: #009900; font-weight: bold;', `${timestamp} | ${message}`, data);
        }
    },

    /**
     * 경고 로그 메시지를 콘솔에 출력합니다.
     * @param {string} message - 출력할 경고 메시지
     * @param {*} [data=null] - 함께 출력할 추가 데이터 (객체, 배열 등)
     */
    warn: function(message, data = null) {
        const timestamp = this._getTimeStamp();
        if (data === null) {
            console.warn('%c[warn]', 'color: #ff9900; font-weight: bold;', `${timestamp} | ${message}`);
        } else {
            console.warn('%c[warn]', 'color: #ff9900; font-weight: bold;', `${timestamp} | ${message}`, data);
        }
    },

    /**
     * 오류 로그 메시지를 콘솔에 출력합니다.
     * @param {string} message - 출력할 오류 메시지
     * @param {*} [data=null] - 함께 출력할 추가 데이터 (객체, 배열 등)
     */
    error: function(message, data = null) {
        const timestamp = this._getTimeStamp();
        if (data === null) {
            console.error('%c[error]', 'color: #cc0000; font-weight: bold;', `${timestamp} | ${message}`);
        } else {
            console.error('%c[error]', 'color: #cc0000; font-weight: bold;', `${timestamp} | ${message}`, data);
        }
    },

    /**
     * 타이머를 시작합니다. timeEnd()와 함께 사용하여 코드 실행 시간을 측정합니다.
     * 브라우저의 console.time() API를 사용하여 정확한 시간 측정을 제공합니다.
     * @param {string} label - 타이머의 고유 식별자. 동일한 식별자로 timeEnd()를 호출해야 합니다.
     * @example
     * debug.time('operation');
     * // 시간이 걸리는 작업 수행
     * debug.timeEnd('operation'); // "operation: 1234.56ms" 형식으로 출력
     */
    time: function(label) {
        const timestamp = this._getTimeStamp();
        console.time(label);
        console.log('%c[time]', 'color: #9900cc; font-weight: bold;', `${timestamp} | Timer started: ${label}`);
    },

    /**
     * 타이머를 종료하고 경과 시간을 출력합니다.
     * time() 메서드로 시작한 타이머의 경과 시간을 밀리초 단위로 콘솔에 출력합니다.
     * @param {string} label - time() 메서드에서 사용한 타이머의 고유 식별자
     * @example
     * debug.time('operation');
     * // 시간이 걸리는 작업 수행
     * debug.timeEnd('operation'); // "operation: 1234.56ms" 형식으로 출력
     */
    timeEnd: function(label) {
        const timestamp = this._getTimeStamp();
        console.timeEnd(label);
        console.log('%c[time]', 'color: #9900cc; font-weight: bold;', `${timestamp} | Timer ended: ${label}`);
    },
}

export default debug;
