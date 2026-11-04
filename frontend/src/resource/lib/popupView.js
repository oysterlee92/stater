/**
 * 팝업(모달) 형태의 뷰 컴포넌트를 정의하는 클래스
 *
 * Bootstrap 모달과 연동하여 독립적인 팝업 영역을 관리합니다.
 * 팝업의 표시/숨김, 초기화 데이터 설정, 생명주기 콜백 및 종료 후 포커스 복원 기능을 지원합니다.
 *
 * @class PopupView
 * @param {string} containerId - 팝업을 렌더링할 컨테이너 요소의 ID
 * @param {Object} [options={}] - 팝업 뷰 옵션
 * @param {Function} [options.onShow] - 팝업이 화면에 표시될 때 호출되는 콜백 함수
 * @param {Function} [options.onHide] - 팝업이 화면에서 사라질 때 호출되는 콜백 함수
 * @param {Function} [options.onLoad] - 데이터 로딩 완료 후 호출되는 콜백 함수
 * @param {Function} [options.init] - 데이터 조회 등 초기화 로직을 수행하는 함수 (Promise 반환 가능)
 * @param {Function} [options.resizeHandler] - 리사이즈 이벤트 발생 시 실행할 핸들러
 * @throws {Error} 지정된 ID의 컨테이너를 찾을 수 없는 경우 발생
 */
export default function PopupView(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
        throw new Error(`ID가 '${containerId}'인 컨테이너를 찾을 수 없습니다.`);
    }

    this.onShow = options.onShow || function () {
    };
    this.onHide = options.onHide || function () {
    };
    this.onLoad = options.onLoad || function () {
    };
    this.init = options.init || function () {
    };
    this.resizeHandler = options.resizeHandler || function () {
    };

    // 결과값
    this.result = {};
    // 새로고침 여부
    this.isReload = false;

    this.callback = null;
    this.focusTarget = null;
    this.params = {};
};

/**
 * 팝업의 실행 옵션 및 파라미터를 설정합니다.
 *
 * @param {Object} [options] - 설정 옵션 객체
 * @param {Function} [options.callback] - 팝업 종료(hide) 시 실행될 콜백 함수
 * @param {HTMLElement} [options.focusTarget] - 팝업이 닫힌 후 포커스를 돌려줄 DOM 요소
 * @param {Object} [options.params] - 팝업 내에서 사용할 파라미터 데이터
 */
PopupView.prototype.set = function (options) {
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        this.callback = options.callback || null;
        this.focusTarget = options.focusTarget || null;
        this.params = options.params || {};
    }
};

/**
 * 팝업 데이터를 로드하고 초기화 함수를 실행합니다. (내부 메서드)
 *
 * @private
 * @param {Object} [options] - 로드 옵션 및 파라미터
 * @returns {Promise<void>} 로딩 완료 시 resolve되는 Promise
 */
PopupView.prototype._load = function (options) {
    this.set(options);

    return new Promise((resolve) => {
        if (this.init instanceof Function) {
            const init = this.init();
            if (init instanceof Promise) {
                return init.then(resolve);
            }
        }

        return resolve();
    });
};

/**
 * 팝업을 화면에 표시합니다.
 * 데이터를 로드한 후 onShow 콜백을 호출하여 실제 모달을 노출합니다.
 *
 * @async
 * @param {Object} [options] - 표시 시 전달할 옵션 및 파라미터
 * @returns {Promise<void>}
 */
PopupView.prototype.show = async function (options) {
    await this._load(options);
    await this.onShow();

    this.onLoad();
};

/**
 * 팝업을 화면에서 숨깁니다.
 * 설정된 콜백을 실행하고, 팝업을 닫은 뒤 지정된 타겟으로 포커스를 이동합니다.
 *
 * @async
 */
PopupView.prototype.hide = function () {
    if (this.isReload && this.callback === null) {
        window.location.reload();
        return;
    }

    this.onHide();
};

/**
 * 팝업의 표시 상태를 토글합니다.
 * 컨테이너의 display 상태에 따라 show 또는 hide를 호출합니다.
 *
 * @param {Object} [options] - 토글 시 전달할 옵션 (표시될 때만 적용)
 */
PopupView.prototype.toggle = function (options) {
    if (this.container.style.display === 'none') {
        this.show(options);
    } else {
        this.hide();
    }
};

/**
 * 팝업 컨테이너 내에서 특정 셀렉터와 일치하는 요소를 찾습니다.
 *
 * @param {string} selector - CSS 셀렉터
 * @returns {Element|null} 찾은 요소 또는 null
 */
PopupView.prototype.find = function (selector) {
    return this.container.querySelector(selector);
};

/**
 * 팝업 컨테이너 내에서 특정 셀렉터와 일치하는 모든 요소를 찾습니다.
 *
 * @param {string} selector - CSS 셀렉터
 * @returns {NodeList} 찾은 요소들의 노드 리스트
 */
PopupView.prototype.findAll = function (selector) {
    return this.container.querySelectorAll(selector);
};