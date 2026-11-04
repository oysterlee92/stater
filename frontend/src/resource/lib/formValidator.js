/**
 * 폼 유효성 검사 모듈 - HTML 폼 요소에 대한 유효성 검사 규칙을 설정하고 검증을 수행하는 기능을 제공합니다.
 * @module formValidator
 */

/**
 * 폼 유효성 검사를 위한 FormValidator 생성자 함수
 *
 * @param {string|HTMLElement} formId - 유효성 검사를 수행할 폼의 ID 또는 HTMLElement 객체
 * @param {Object} [options={}] - 설정 옵션
 * @param {string} [options.display='alert'] - 오류 표시 방식 ('message', 'alert' 또는 'none')
 * @param {boolean} [options.showAlertInvalidClass=true] - display가 'alert'일 때 필드에 'is-invalid' 클래스를 추가할지 여부
 * @constructor
 */
export default function FormValidator(formId, options = {}) {
    this.form = formId instanceof HTMLElement
        ? formId
        : document.getElementById(formId);

    if (!this.form) {
        throw new Error(`폼을 찾을 수 없습니다.`);
    }

    this.display = options.display || 'alert';
    // 수정: boolean 옵션이 false일 경우 true로 덮어씌워지는 문제 해결
    this.showAlertInvalidClass = options.showAlertInvalidClass !== undefined ? options.showAlertInvalidClass : true;
    this.errors = {};

    /**
     * 유효성 검사 규칙 모음
     * 각 규칙은 검사 함수(fn)와 오류 메시지(message)를 포함합니다.
     * @type {Object.<string, {fn: Function, message: string|Function}>}
     */
    this.rules = {
        required: {
            fn: (value, param, field, form) => {
                // 체크박스나 라디오 버튼은 그룹 내 하나라도 체크되어 있는지 확인
                if (field.type === 'checkbox' || field.type === 'radio') {
                    const groupFields = form.querySelectorAll(`[name="${field.name}"]`);
                    return Array.from(groupFields).some(f => f.checked);
                }
                // 일반 입력 필드는 공백 제거 후 빈 문자열인지 확인
                return value.trim() !== '';
            },
            message: (title, param, field) =>
                `${title}을(를) ${field.type === 'checkbox' || field.type === 'radio' ? '선택' : '입력'}해주세요.`
        },
    };
}

/**
 * 새로운 유효성 검사 규칙을 추가합니다.
 * 기존 규칙과 이름이 같으면 덮어씁니다.
 *
 * @param {Object} rulesObject - 추가할 규칙들을 포함하는 객체
 * @param {Object} rulesObject.ruleName - 규칙 정의 객체
 * @param {Function} rulesObject.ruleName.fn - 유효성 검사 함수 (value, param, field, form) => boolean
 * @param {string|Function} rulesObject.ruleName.message - 오류 메시지 문자열 또는 메시지 생성 함수
 */
FormValidator.prototype.addRules = function(rulesObject) {
    for (const [name, ruleObject] of Object.entries(rulesObject)) {
        this.rules[name] = ruleObject;
    }
};

/**
 * 특정 필드의 오류 표시(메시지 및 클래스)를 제거합니다.
 *
 * @param {HTMLElement} field - 오류를 제거할 폼 필드 요소
 */
FormValidator.prototype.clearError = function(field) {
    const parent = field.closest('.form-group') || field.parentNode;
    const errorEl = parent.querySelector('.error-message');

    if (errorEl) {
        errorEl.textContent = ''; // 요소는 남기고 내용만 지움 (레이아웃 유지)
    }

    // 설정된 표시 방식에 따라 클래스 제거
    if (this.display === 'message') {
        field.classList.remove('is-invalid');
    } else if (this.display === 'alert' && this.showAlertInvalidClass) {
        field.classList.remove('is-invalid');
    }
};

/**
 * 폼 내의 모든 유효성 검사 대상 필드의 오류 표시를 초기화합니다.
 * data-validate 속성을 가진 모든 필드에 대해 수행합니다.
 */
FormValidator.prototype.clearAllError = function() {
    const fields = this.form.querySelectorAll('[data-validate]');
    fields.forEach(field => {
        this.clearError(field);
    });
};

/**
 * 요소가 실제로 화면에 보이는지 확인합니다.
 * hidden 속성, CSS display/visibility/opacity 속성을 확인합니다.
 *
 * @param {HTMLElement} element - 확인할 요소
 * @returns {boolean} 요소가 화면에 보이면 true, 그렇지 않으면 false
 */
FormValidator.prototype.isElementVisible = function(element) {
    if (!element) return false;

    // hidden 속성 확인
    if (element.hidden) return false;

    // Computed Style 확인
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

    // 부모 요소들도 재귀적으로 확인 (부모가 숨겨져 있으면 자식도 안 보임)
    let parent = element.parentElement;
    while (parent) {
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden' || parentStyle.opacity === '0') {
            return false;
        }
        parent = parent.parentElement;
    }

    return true;
};

/**
 * 폼의 모든 필드에 대해 유효성 검사를 수행합니다.
 * 실패 시 설정된 display 옵션에 따라 알림창을 띄우거나 에러 메시지를 표시합니다.
 *
 * @returns {boolean} 모든 필드가 유효하면 true, 하나라도 유효하지 않으면 false
 */
FormValidator.prototype.validate = function() {
    if (!(this.form instanceof HTMLFormElement)) {
        alert('form 요소가 유효하지 않습니다.');
        return false;
    }

    this.errors = {};
    const fields = this.form.querySelectorAll('[data-validate]');
    let firstErrorField = null; // 첫 번째 에러 필드 (포커스 이동용)

    fields.forEach(field => {
        // 화면에 보이지 않는 요소는 유효성 검사 대상에서 제외
        if (!this.isElementVisible(field)) {
            return;
        }
    
        // data-validate="required maxLength:10" 형식 파싱
        const rulesToApply = field.dataset.validate.split(' ');
        
        // 값 추출 (체크박스/라디오는 체크 여부, 그 외는 value)
        const value = (field.type === 'checkbox' || field.type === 'radio')
            ? this.form.querySelectorAll(`[name="${field.name}"]:checked`).length > 0 ? 'checked' : ''
            : field.value;
            
        const title = field.title || field.name;
        // 에러 발생 시 포커스 이동할 대상 (지정되지 않으면 현재 필드)
        const focusTarget = field.dataset.focus || field.name;
        
        // 기존 에러 클리어
        this.clearError(field);

        // 각 규칙 순차 검증
        for (const rule of rulesToApply) {
            const [ruleName, param] = rule.split(':');
            const ruleDef = this.rules[ruleName];
            
            // 규칙 정의가 없거나 유효하지 않으면 스킵
            if (!ruleDef) continue;
            if (typeof ruleDef.fn !== 'function') continue;
            if (ruleDef.message === undefined) continue;

            // 검증 함수 실행
            const isValid = ruleDef.fn(value, param, field, this.form);
            
            if (!isValid) {
                // 에러 메시지 생성
                const msg = typeof ruleDef.message === 'function'
                    ? ruleDef.message(title, param, field, this.form)
                    : ruleDef.message;
                this.errors[field.name] = msg;

                // 1. Alert 방식 처리
                if (this.display === 'alert') {
                    if (!firstErrorField) {
                        alert(msg);

                        if (this.showAlertInvalidClass) {
                            field.classList.add('is-invalid');
                        }
                    }
                }
                
                // 2. Message 방식 처리 (인라인 에러 메시지)
                if (this.display === 'message') {
                    const parent = field.closest('.form-group') || field.parentNode;
                    let errorEl = parent.querySelector('.error-message');
                    
                    // 에러 메시지 엘리먼트가 없으면 생성
                    if (!errorEl) {
                        errorEl = document.createElement('div');
                        errorEl.className = 'error-message';
                        parent.appendChild(errorEl);
                    }
                    // 첫 번째 에러 메시지만 표시
                    if (errorEl.textContent === '') {
                        errorEl.textContent = msg;
                    }

                    field.classList.add('is-invalid');
                }

                // 첫 번째 에러 필드에 포커스 이동 처리
                if (!firstErrorField) {
                    const focusEl = this.form.querySelector(`[name="${focusTarget}"]`) || field;
                    if (focusEl && typeof focusEl.focus === 'function') {
                        // 모달 등에서 포커스 타이밍 문제를 피하기 위해 setTimeout 사용
                        setTimeout(() => focusEl.focus(), 0);
                    }
                    firstErrorField = field;
                }

                // 해당 필드에 에러가 있으면 나머지 규칙은 검사하지 않음 (Short-circuit)
                break;
            }
        }
    });

    return Object.keys(this.errors).length === 0;
};

/**
 * 폼의 유효성 검사를 수행하고 결과(성공 여부 및 에러 목록)를 객체로 반환합니다.
 * UI(alert, 메시지 표시 등)에는 영향을 주지 않는 순수 검증용 메서드입니다.
 *
 * @returns {Object} 결과 객체
 * @property {boolean} isValid - 전체 유효성 여부
 * @property {Object.<string, string>} errors - { 필드명: 에러메시지 } 형태의 에러 목록
 */
FormValidator.prototype.validateWithResult = function() {
    if (!(this.form instanceof HTMLFormElement)) {
        return {
            isValid: false,
            errors: { form: 'form 요소가 유효하지 않습니다.' }
        };
    }

    this.errors = {};
    const fields = this.form.querySelectorAll('[data-validate]');

    fields.forEach(field => {
        // 화면에 보이지 않는 요소는 유효성 검사 건너뜀
        if (!this.isElementVisible(field)) {
            return;
        }

        const rulesToApply = field.dataset.validate.split(' ');
        const value = (field.type === 'checkbox' || field.type === 'radio')
            ? this.form.querySelectorAll(`[name="${field.name}"]:checked`).length > 0 ? 'checked' : ''
            : field.value;
        const title = field.title || field.name;

        for (const rule of rulesToApply) {
            const [ruleName, param] = rule.split(':');
            const ruleDef = this.rules[ruleName];
            
            if (!ruleDef) continue;
            if (typeof ruleDef.fn !== 'function') continue;
            if (ruleDef.message === undefined) continue;

            const isValid = ruleDef.fn(value, param, field, this.form);
            if (!isValid) {
                const msg = typeof ruleDef.message === 'function'
                    ? ruleDef.message(title, param, field, this.form)
                    : ruleDef.message;
                this.errors[field.name] = msg;
                break;
            }
        }
    });

    return {
        isValid: Object.keys(this.errors).length === 0,
        errors: { ...this.errors }
    };
};