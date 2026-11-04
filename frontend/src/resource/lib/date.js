/**
 * Date Manipulation Utility Module
 * 
 * 날짜 조작, 포맷팅, 계산을 위한 유틸리티 함수를 제공합니다.
 * 날짜 더하기/빼기, 차이 계산, 형식 변환 등의 기능을 포함합니다.
 * 
 * @module date
 * @example
 * import date from '@/resource/lib/date.js';
 * 
 * // 현재 날짜
 * const now = date.now();
 * 
 * // 날짜 포맷팅
 * const formatted = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
 * // '2024-01-15 14:30:45'
 * 
 * // 날짜 더하기
 * const tomorrow = date.addDays(new Date(), 1);
 * const nextMonth = date.addMonths(new Date(), 1);
 * const nextYear = date.addYears(new Date(), 1);
 * 
 * // 날짜 차이 계산
 * const diff = date.diffDays('2024-01-01', '2024-01-15'); // 14
 * 
 * // 날짜 유효성 확인
 * const isValid = date.isValid('2024-02-30'); // false
 * 
 * // 같은 날인지 확인
 * const isSame = date.isSameDay(new Date(), new Date()); // true
 */

/**
 * 날짜 조작 및 포맷팅을 위한 유틸리티 객체입니다.
 * @namespace date
 */
const date = {
    /**
     * 현재 날짜와 시간을 반환합니다.
     * @returns {Date} 현재 날짜와 시간
     */
    now: function() {
        // 현재 날짜와 시간을 반환합니다.
        return new Date();
    },

    /**
     * 날짜를 지정된 형식의 문자열로 포맷팅합니다.
     * @param {Date|string|number} date - 포맷팅할 날짜 (Date 객체, 타임스탬프 또는 날짜 문자열)
     * @param {string} format - 포맷 문자열 (예: 'YYYY-MM-DD HH:mm:ss')
     * @returns {string} 포맷팅된 날짜 문자열
     */
    format: function(date, format = 'YYYY-MM-DD') {
        try {
            const d = this.toDate(date);

            if (!d || isNaN(d.getTime())) {
                console.error('유효하지 않은 날짜입니다:', date);
                return '';
            }

            // 현재 날짜 정보 추출
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const hours = d.getHours();
            const minutes = d.getMinutes();
            const seconds = d.getSeconds();

            // 포맷 문자열 치환 (정규식을 사용하여 모든 발생을 치환)
            // 더 긴 패턴을 먼저 치환하여 충돌 방지
            let result = format;

            // 연도 포맷 (YYYY는 YY보다 먼저 치환)
            result = result.replace(/YYYY/g, String(year));
            result = result.replace(/YY/g, String(year).slice(-2));

            // 월 포맷 (MM은 M보다 먼저 치환)
            result = result.replace(/MM/g, month < 10 ? '0' + String(month) : String(month));
            result = result.replace(/M/g, String(month));

            // 일 포맷 (DD는 D보다 먼저 치환)
            result = result.replace(/DD/g, day < 10 ? '0' + String(day) : String(day));
            result = result.replace(/D/g, String(day));

            // 시간 포맷 (HH는 H보다 먼저 치환)
            result = result.replace(/HH/g, hours < 10 ? '0' + String(hours) : String(hours));
            result = result.replace(/H/g, String(hours));

            // 분 포맷 (mm은 m보다 먼저 치환)
            result = result.replace(/mm/g, minutes < 10 ? '0' + String(minutes) : String(minutes));
            result = result.replace(/m/g, String(minutes));

            // 초 포맷 (ss는 s보다 먼저 치환)
            result = result.replace(/ss/g, seconds < 10 ? '0' + String(seconds) : String(seconds));
            result = result.replace(/s/g, String(seconds));

            return result;
        } catch (error) {
            console.error('날짜 포맷팅 중 오류가 발생했습니다:', error);
            return '';
        }
    },

    /**
     * 다양한 형식의 입력을 Date 객체로 변환합니다.
     * @param {Date|string|number} input - 변환할 입력 (Date 객체, 타임스탬프 또는 날짜 문자열)
     * @returns {Date} 변환된 Date 객체
     */
    toDate: function(input) {
        if (input instanceof Date) {
            return input;
        }

        if (typeof input === 'number') {
            return new Date(input);
        }

        if (typeof input === 'string') {
            // ISO 형식 또는 일반적인 날짜 형식 처리
            const parsedDate = new Date(input);
            // 유효하지 않은 날짜 문자열이면 현재 날짜 반환
            return isNaN(parsedDate.getTime()) ? this.now() : parsedDate;
        }

        return this.now();
    },

    /**
     * 두 날짜 사이의 차이를 일 단위로 계산합니다.
     * @param {Date|string|number} date1 - 첫 번째 날짜
     * @param {Date|string|number} date2 - 두 번째 날짜
     * @returns {number} 두 날짜 사이의 일 수 차이
     */
    diffDays: function(date1, date2) {
        try {
            const d1 = this.toDate(date1);
            const d2 = this.toDate(date2);

            // 시간, 분, 초를 제외하고 일 단위로만 계산
            // 날짜의 시간을 00:00:00으로 설정하여 정확한 일수 계산
            const date1Midnight = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
            const date2Midnight = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

            // 밀리초 단위로 차이 계산 후 일 단위로 변환
            const diffTime = Math.abs(date2Midnight - date1Midnight);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // date2가 date1보다 이전이면 음수 반환
            return date2Midnight < date1Midnight ? -diffDays : diffDays;
        } catch (error) {
            console.error('날짜 차이 계산 중 오류가 발생했습니다:', error);
            return 0;
        }
    },

    /**
     * 날짜에 일수를 더합니다.
     * @param {Date|string|number} date - 기준 날짜
     * @param {number} days - 더할 일수 (음수 가능)
     * @returns {Date} 계산된 새 날짜
     */
    addDays: function(date, days) {
        try {
            const d = this.toDate(date);

            if (isNaN(d.getTime())) {
                console.error('유효하지 않은 날짜입니다');
                return this.now();
            }

            d.setDate(d.getDate() + days);
            return d;
        } catch (error) {
            console.error('날짜에 일수를 더하는 중 오류가 발생했습니다:', error);
            return this.now();
        }
    },

    /**
     * 날짜에 월수를 더합니다.
     * @param {Date|string|number} date - 기준 날짜
     * @param {number} months - 더할 월수 (음수 가능)
     * @returns {Date} 계산된 새 날짜
     */
    addMonths: function(date, months) {
        try {
            const d = this.toDate(date);

            if (isNaN(d.getTime())) {
                console.error('유효하지 않은 날짜입니다');
                return this.now();
            }

            // 현재 날짜 저장
            const day = d.getDate();

            // 월 변경
            d.setDate(1); // 일을 1로 설정하여 월 변경 시 오버플로우 방지
            d.setMonth(d.getMonth() + months);

            // 원래 일자로 복원 (해당 월의 마지막 날을 넘지 않도록)
            const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            d.setDate(Math.min(day, lastDayOfMonth));

            return d;
        } catch (error) {
            console.error('날짜에 월수를 더하는 중 오류가 발생했습니다:', error);
            return this.now();
        }
    },

    /**
     * 날짜에 연수를 더합니다.
     * @param {Date|string|number} date - 기준 날짜
     * @param {number} years - 더할 연수 (음수 가능)
     * @returns {Date} 계산된 새 날짜
     */
    addYears: function(date, years) {
        try {
            const d = this.toDate(date);

            if (isNaN(d.getTime())) {
                console.error('유효하지 않은 날짜입니다');
                return this.now();
            }

            d.setFullYear(d.getFullYear() + years);
            return d;
        } catch (error) {
            console.error('날짜에 연수를 더하는 중 오류가 발생했습니다:', error);
            return this.now();
        }
    },

    /**
     * 날짜가 유효한지 확인합니다.
     * @param {Date|string|number} date - 확인할 날짜
     * @returns {boolean} 유효 여부
     */
    isValid: function(date) {
        try {
            const d = this.toDate(date);
            return !isNaN(d.getTime());
        } catch (error) {
            return false;
        }
    },

    /**
     * 두 날짜가 같은 날인지 확인합니다 (시간 제외).
     * @param {Date|string|number} date1 - 첫 번째 날짜
     * @param {Date|string|number} date2 - 두 번째 날짜
     * @returns {boolean} 같은 날 여부
     */
    isSameDay: function(date1, date2) {
        try {
            const d1 = this.toDate(date1);
            const d2 = this.toDate(date2);

            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                return false;
            }

            return (
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate()
            );
        } catch (error) {
            console.error('날짜 비교 중 오류가 발생했습니다:', error);
            return false;
        }
    }
}

export default date;
