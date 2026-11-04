/**
 * Form Validation Rules Module
 *
 * 폼 유효성 검사를 위한 다양한 검증 규칙들을 제공합니다.
 * 각 규칙은 검증 함수(fn)와 에러 메시지 생성 함수(message)로 구성됩니다.
 *
 * 규칙 구조:
 * - fn: (value, param?, field?, form?) => boolean - 검증 함수
 * - message: (title, param?, field?) => string - 에러 메시지 생성 함수
 *
 * @module rules
 * @requires es-hangul
 * @example
 * import rules from '@/resource/rules.js';
 *
 * // FormValidator와 함께 사용
 * const validator = oyster.formValidator('myForm');
 * validator.addRules(rules);
 */

import {josa} from "es-hangul";

/**
 * 폼 유효성 검사 규칙 객체
 *
 * @typedef {Object} ValidationRule
 * @property {Function} fn - 검증을 수행하는 함수
 * @property {Function} message - 에러 메시지를 생성하는 함수
 */

/**
 * 폼 유효성 검사 규칙 모음
 *
 * @type {Object.<string, ValidationRule>}
 */
const rules = {

    /**
     * 필수 입력 검증 규칙
     *
     * 필드가 반드시 입력되어야 함을 검증합니다.
     * 텍스트 입력은 공백이 아닌 값을 요구하고,
     * 체크박스/라디오 버튼은 하나 이상 선택되어야 합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="required" data-title="이름"
     * // 텍스트: 공백이 아닌 값 필요
     * // 체크박스/라디오: 최소 1개 선택 필요
     */
    required: {
        fn: (value, param, field, form) => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                const groupFields = form.querySelectorAll(`[name="${field.name}"]`);
                return Array.from(groupFields).some(f => f.checked);
            }
            return value.trim() !== '';
        },
        message: (title, param, field) =>
            `${josa(title, '을/를')} ${field.type === 'checkbox' || field.type === 'radio' ? '선택' : '입력'}해 주세요.`
    },

    /**
     * 한글만 입력 검증 규칙
     *
     * 한글만 허용합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="korean" data-title="이름"
     * // 유효: 홍길동, 김 철수
     * // 무효: Hong, 홍길동123
     */
    korean: {
        fn: (value) => !value || /^[가-힣]+$/.test(value),
        message: (title) => `${josa(title, '은/는')} 한글만 입력 가능합니다.`
    },

    /**
     * 영문만 입력 검증 규칙
     *
     * 영문 대소문자만 허용합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="english" data-title="이름"
     * // 유효: John Doe, ABCD
     * // 무효: 홍길동, John123
     */
    english: {
        fn: (value) => !value || /^[a-zA-Z]*$/.test(value),
        message: (title) => `${josa(title, '은/는')} 영문으로만 입력해 주세요.`
    },

    /**
     * 숫자만 입력 검증 규칙
     *
     * 숫자만 입력 가능하도록 제한합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="number" data-title="나이"
     * // 유효: 25, 100
     * // 무효: 25살, abc
     */
    number: {
        fn: (value) => !value || /^[0-9]+$/.test(value),
        message: (title) => `${josa(title, '은/는')} 숫자만 입력해 주세요.`
    },

    /**
     * 영문+숫자 입력 검증 규칙
     *
     * 영문자와 숫자만 허용합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="englishNumber" data-title="코드"
     * // 유효: abc123, test99
     * // 무효: abc!123, 한글123
     */
    englishNumber: {
        fn: (value) => !value || /^[a-zA-Z0-9]+$/.test(value),
        message: (title) => `${josa(title, '은/는')} 영문과 숫자만 입력 가능합니다.`
    },

    /**
     * 영문+숫자+특수문자 입력 검증 규칙
     *
     * 영문자, 숫자, 특수문자를 허용합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="englishNumberSpecial" data-title="코드"
     * // 유효: abc123!, test99#@
     * // 무효: 한글123!, abc 123
     */
    /**
     * 영문+숫자+특수문자 입력 검증 규칙
     *
     * 영문자, 숫자, 특수문자를 허용합니다.
     *
     * @type {ValidationRule}
     * @param {string} value - 검증할 입력값
     * @param {string[]} [excludeChars] - 제외할 특수문자 배열
     * @example
     * // data-validate="englishNumberSpecial" data-title="코드"
     * // 기본 사용
     * // 유효: abc123!, test99#@
     * // 무효: 한글123!, abc 123
     */
    englishNumberSpecial: {
        fn: (value) => {
            if (!value) return true;
            const pattern = new RegExp(`^[a-zA-Z0-9!@#()$%^&*_+\\-=[\\]{};\':"\\\\|,.<>/?]+$`);
            return pattern.test(value);
        },
        message: (title) => `${josa(title, '은/는')} 영문, 숫자, 특수문자만 입력 가능합니다.`
    },

    /**
     * 특수문자만 입력 검증 규칙
     *
     * 특수문자만 허용하며 제외할 특수문자를 지정할 수 있습니다.
     *
     * @type {ValidationRule}
     * @param {string} value - 검증할 입력값
     * @param {string} excludeChars - 제외할 특수문자 (구분자 없음, 예: "!@#")
     * @example
     * // data-validate="excludeSpecial" data-title="특수문자"
     * // 유효: !, @, #, $, %
     * // 무효: abc, 123, 한글
     *
     * // data-validate="excludeSpecial:!@#" data-title="특수문자"
     * // 유효: $, %, ^, &, *
     * // 무효: !, @, #, abc, 123
     */
    excludeSpecial: {
        fn: (value, excludeChars) => {
            if (!value) return true;

            // excludeChars 문자열을 문자 배열로 변환 (구분자 없음)
            const charsToExclude = excludeChars ? excludeChars.split('') : [];

            // 제외할 문자가 포함되어 있는지 확인
            const hasExcludedChar = charsToExclude.some(char => value.includes(char));

            return !hasExcludedChar;
        },
        message: (title, excludeChars) => {
            const excludedText = excludeChars ? `${excludeChars}` : '';
            return `${josa(title, '은/는')} ${excludedText} 문자를 포함할 수 없습니다.`;
        }
    },

    /**
     * 허용 특수문자 입력 검증 규칙
     *
     * 지정된 특수문자만 허용하고 다른 특수문자는 차단합니다.
     * 영문, 숫자, 한글 등 다른 문자는 모두 허용됩니다.
     *
     * @type {ValidationRule}
     * @param {string} value - 검증할 입력값
     * @param {string} allowChars - 허용할 특수문자 (구분자 없음, 예: "!@#")
     * @example
     * // data-validate="allowSpecial" data-title="코드"
     * // 유효: abc123, 홍길동, test!@# (모든 특수문자 허용)
     * // 무효: 없음 (모든 문자 허용)
     *
     * // data-validate="allowSpecial:!@#" data-title="코드"
     * // 유효: abc123, 홍길동, test!@#
     * // 무효: test$%^ ($, %, ^ 포함되어 있음)
     */
    allowSpecial: {
        fn: (value, allowChars) => {
            if (!value) return true;

            // allowChars 문자열을 문자 배열로 변환 (구분자 없음)
            const charsToAllow = allowChars ? allowChars.split('') : [];

            // 특수문자 정규식 (모든 특수문자)
            const specialCharPattern = /[!@#()$%^&*_+\-=\[\]{};':"\\|,.<>/?]/;

            // 입력값의 각 문자를 검사
            for (let char of value) {
                // 특수문자인 경우
                if (specialCharPattern.test(char)) {
                    // 허용 목록에 없으면 불가
                    if (!charsToAllow.includes(char)) return false;
                }
            }

            return true;
        },
        message: (title, allowChars) => {
            return `${josa(title, '은/는')} 허용된 특수문자는 ${allowChars}입니다.`;
        }
    },

    /**
     * 생년월일 형식 검증 규칙
     *
     * YYYY-MM-DD 또는 YYYYMMDD 형식의 유효한 날짜인지 확인합니다.
     * 실제 달력상 존재하는 날짜인지 검증합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="dateOfBirth" data-title="생년월일"
     * // 유효: 1990-01-01, 19900101, 1990/01/01
     * // 무효: 2024-02-30, 1990-13-01
     */
    dateOfBirth: {
        fn: (value) =>
            !value || /^\d{4}[-/]?\d{2}[-/]?\d{2}$/.test(value) &&
            (() => {
                const v = value.replace(/[^\d]/g, '');
                const y = Number(v.slice(0, 4));
                const m = Number(v.slice(4, 6));
                const d = Number(v.slice(6, 8));
                const date = new Date(`${y}-${m}-${d}`);
                return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
            })(),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 사업자등록번호 검증 규칙
     *
     * 10자리 사업자등록번호의 유효성을 체크섬 알고리즘으로 검증합니다.
     * 하이픈은 자동으로 제거됩니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="businessNumber" data-title="사업자등록번호"
     * // 유효: 1234567890, 123-45-67890
     */
    businessNumber: {
        fn: (value) => {
            const num = value.replace(/[^0-9]/g, '');
            if (!/^\d{10}$/.test(num)) return false;

            const multipliers = [1, 3, 7, 1, 3, 7, 1, 3, 5];
            let sum = multipliers.reduce((acc, m, i) => acc + (Number(num[i]) * m), 0);
            sum += Math.floor((Number(num[8]) * 5) / 10);
            const checkDigit = (10 - (sum % 10)) % 10;
            return !value || checkDigit === Number(num[9]);
        },
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 휴대폰 번호 형식 검증 규칙
     *
     * 한국 휴대폰 번호 형식을 검증합니다.
     * 010, 011, 016, 017, 018, 019로 시작하는 번호를 허용합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="phoneNumber" data-title="휴대폰번호"
     * // 유효: 010-1234-5678, 01012345678, 011-123-4567
     * // 무효: 02-1234-5678, 010-12-345
     */
    phoneNumber: {
        fn: (value) => !value || /^01[016789]-?\d{3,4}-?\d{4}$/.test(value),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 전화번호 형식 검증 규칙
     *
     * 일반 전화번호 형식을 검증합니다.
     * 지역번호(2~3자리) + 국번(3~4자리) + 번호(4자리) 형식을 허용합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="telNumber" data-title="전화번호"
     * // 유효: 02-1234-5678, 031-123-4567, 0212345678
     * // 무효: 1234-5678, 010-1234-5678
     */
    telNumber: {
        fn: (value) => !value || /^\d{2,3}-?\d{3,4}-?\d{4}$/.test(value),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 주민등록번호 형식 검증 규칙
     *
     * 주민등록번호 형식(XXXXXX-XXXXXXX)을 검증합니다.
     * 하이픈은 선택사항입니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="ssn" data-title="주민등록번호"
     * // 유효: 900101-1234567, 9001011234567
     * // 무효: 900101-123456, abc123-1234567
     */
    ssn: {
        fn: (value) => !value || /^\d{6}-?\d{7}$/.test(value),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 우편번호 형식 검증 규칙
     *
     * 5자리 우편번호 형식을 검증합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="zipcode" data-title="우편번호"
     * // 유효: 12345, 06234
     * // 무효: 1234, 123456, abc12
     */
    zipcode: {
        fn: (value) => !value || /^\d{5}$/.test(value),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 도메인 형식 검증 규칙
     *
     * 유효한 도메인 형식인지 확인합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="domain" data-title="도메인"
     * // 유효: example.com, sub.example.co.kr
     * // 무효: example, .com, example.
     */
    domain: {
        fn: (value) => !value || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 이메일 형식 검증 규칙
     *
     * 기본적인 이메일 형식을 검증합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="email" data-title="이메일"
     * // 유효: user@example.com, test.user@sub.example.co.kr
     * // 무효: user@, @example.com, user example@test.com
     */
    email: {
        fn: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: (title) => `올바른 ${title} 형식을 입력해 주세요.`
    },

    /**
     * 아이디 형식 검증 규칙
     *
     * 영문과 숫자를 모두 포함한 6~20자의 아이디인지 확인합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="id" data-title="아이디"
     * // 유효: user123, test1234
     * // 무효: abc (숫자 없음), 12345 (영문 없음), ab (길이 부족)
     */
    id: {
        fn: (value) => !value || /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{6,20}$/.test(value),
        message: (title) => `${josa(title, '은/는')} 영문과 숫자를 모두 포함한 4~20자로 입력해 주세요.`
    },

    /**
     * 비밀번호 강도 검증 규칙
     *
     * 영문, 숫자, 특수문자를 모두 포함한 8~20자 비밀번호인지 확인합니다.
     * 공백은 허용되지 않습니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="password" data-title="비밀번호"
     * // 유효: Password123!, Abcd1234@
     * // 무효: password (숫자/특수문자 없음), Pass123 (특수문자 없음), Pass 123! (공백 포함)
     */
    password: {
        fn: (value) => !value || /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])(?!.*\s).{8,20}$/.test(value),
        message: (title) => `${josa(title, '은/는')} 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.`
    },

    /**
     * 값 일치 검증 규칙
     *
     * 다른 필드의 값과 일치하는지 확인합니다.
     * 주로 비밀번호 확인에 사용됩니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="match:password" data-title="비밀번호 확인"
     * // password 필드의 값과 일치해야 함
     */
    match: {
        fn: (value, targetName, field, form) => {
            const target = form.querySelector(`[name="${targetName}"]`);
            return !value || (target && value === target.value);
        },
        message: (title) => `${josa(title, '이/가')} 일치하지 않습니다.`
    },

    /**
     * 최대 선택 개수 검증 규칙
     *
     * 체크박스나 라디오 버튼의 최대 선택 개수를 제한합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="maxChecked:3" data-title="관심사"
     * // 최대 3개까지 선택 가능
     */
    maxChecked: {
        fn: (value, max, field, form) => {
            const groupFields = form.querySelectorAll(`[name="${field.name}"]`);
            const checkedCount = Array.from(groupFields).filter(f => f.checked).length;
            return checkedCount <= Number(max);
        },
        message: (title, max) => `${josa(title, '은/는')} 최대 ${max}개까지 선택 가능합니다.`
    },

    /**
     * 최대 길이 검증 규칙
     *
     * 입력값의 최대 길이를 제한합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="maxLength:100" data-title="제목"
     * // 최대 100자까지 입력 가능
     */
    maxLength: {
        fn: (value, len) => value.length <= Number(len),
        message: (title, len) => `${josa(title, '은/는')} 최대 ${len}자 이하여야 합니다.`
    },

    /**
     * 최소 나이 검증 규칙
     *
     * 입력된 나이가 최소 나이 이상인지 확인합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="minAge:19" data-title="나이"
     * // 19세 이상이어야 함
     */
    minAge: {
        fn: (value, age) => !value || Number(value) >= Number(age),
        message: (title, age) => `${josa(title, '은/는')} ${age}세 이상이어야 합니다.`
    },

    /**
     * 최소 선택 개수 검증 규칙
     *
     * 체크박스나 라디오 버튼의 최소 선택 개수를 요구합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="minChecked:1" data-title="약관 동의"
     * // 최소 1개 이상 선택해야 함
     */
    minChecked: {
        fn: (value, min, field, form) => {
            const groupFields = form.querySelectorAll(`[name="${field.name}"]`);
            const checkedCount = Array.from(groupFields).filter(f => f.checked).length;
            return checkedCount >= Number(min);
        },
        message: (title, min) => `${josa(title, '은/는')} 최소 ${min}개 이상 선택해야 합니다.`
    },

    /**
     * 최소 길이 검증 규칙
     *
     * 입력값의 최소 길이를 요구합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="minLength:2" data-title="이름"
     * // 최소 2자 이상 입력해야 함
     */
    minLength: {
        fn: (value, len) => !value ||value.length >= Number(len),
        message: (title, len) => `${josa(title, '은/는')} 최소 ${len}자 이상이어야 합니다.`
    },

    /**
     * 길이 범위 검증 규칙
     *
     * 입력값의 길이가 지정된 범위 내에 있는지 확인합니다.
     *
     * @type {ValidationRule}
     * @example
     * // data-validate="lengthBetween:6,12" data-title="비밀번호"
     * // 6자 이상 12자 이하
     */
    lengthBetween: {
        fn: (value, length) => {
            let [min, max] = length.split(',');
            return !value || (value.length >= Number(min) && value.length <= Number(max));
        },
        message: (title, length) => {
            let [min, max] = length.split(',');
            return `${josa(title, '은/는')} ${min}자 이상 ${max}자 이하여야 합니다.`;
        }
    }
}

/**
 * 폼 유효성 검사 규칙 객체를 내보냅니다.
 * @exports rules
 */
export default rules;