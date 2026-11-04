/**
 * 페이지 단위의 뷰 컴포넌트를 정의하는 클래스
 *
 * 전체 페이지의 생명주기(준비, 로드, 렌더링)를 관리하고 컨테이너 내 요소 탐색을 지원합니다.
 * DOMContentLoaded 및 window.load 시점에 맞춰 초기화 로직을 수행합니다.
 *
 * @class PageView
 * @param {string} containerId - 페이지의 메인 컨테이너 요소 ID
 * @param {Object} [options={}] - 페이지 뷰 옵션
 * @param {Function} [options.onRender] - render 호출 시 실행될 UI 렌더링 콜백 함수
 * @param {Function} [options.onLoader] - loader 호출 시 실행될 데이터 로딩 콜백 함수
 * @param {Function} [options.onReady] - DOM 준비 완료(DOMContentLoaded) 후 실행될 콜백 함수
 * @param {Function} [options.onLoad] - 전체 페이지 로드(window.load) 후 실행될 콜백 함수
 * @param {Function} [options.init] - 데이터 조회 등 초기화 로직을 수행하는 함수 (Promise 반환 가능)
 * @param {Function} [options.resizeHandler] - 리사이즈 이벤트 발생 시 실행할 핸들러
 * @throws {Error} 지정된 ID의 컨테이너를 찾을 수 없는 경우 발생
 */
export default function PageView(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
        throw new Error(`ID가 '${containerId}'인 컨테이너를 찾을 수 없습니다.`);
    }

    this.onRender = options.onRender || function () {
    };

    this.onLoader = options.onLoader || function () {
    };
    this.onReady = options.onReady || null;
    this.onLoad = options.onLoad || null;
    this.init = options.init || function () {
    };
    this.resizeHandler = options.resizeHandler || function () {
    };

    setTimeout(() => {
        if (this.onReady instanceof Function) {
            this.render();
        }

        if (this.onLoad instanceof Function) {
            this.loader();
        }
    }, 0);
};

/**
 * 초기화 함수(init)를 실행합니다.
 * init 함수가 Promise를 반환하면 해당 Promise를 반환하고, 그렇지 않으면 resolved Promise를 반환합니다.
 *
 * @private
 * @returns {Promise<void>} 초기화 완료를 나타내는 Promise
 */
PageView.prototype._executeInit = function () {
    if (this.init instanceof Function) {
        const init = this.init();
        if (init instanceof Promise) {
            return init;
        }
    }

    return Promise.resolve();
};

/**
 * DOMContentLoaded 이벤트를 기다립니다.
 * onLoad 함수가 없는 경우에만 초기화를 실행합니다.
 *
 * @private
 * @returns {Promise} DOM 준비 완료를 나타내는 Promise
 */
PageView.prototype._ready = function () {
    const checkOnLoadAndExecute = () => {
        if (!(this.onLoad instanceof Function)) {
            return this._executeInit();
        }

        return Promise.resolve();
    };

    if (document.readyState === 'loading') {
        return new Promise((resolve) => {
            window.addEventListener('DOMContentLoaded', resolve, {once: true});
        }).then(() => checkOnLoadAndExecute());
    }

    return checkOnLoadAndExecute();
};

/**
 * 페이지 전체 로드(window.load)를 대기한 후 초기화를 수행합니다.
 *
 * @private
 * @returns {Promise<void>} 페이지 로드 및 초기화 완료를 나타내는 Promise
 */
PageView.prototype._load = function () {
    if (document.readyState !== 'complete') {
        return new Promise((resolve) => {
            window.addEventListener('load', resolve, {once: true});
        }).then(() => this._executeInit());
    }

    return this._executeInit();
};

/**
 * 페이지를 렌더링합니다.
 * DOM 준비가 완료된 후 onReady와 onRender 콜백을 순차적으로 호출합니다.
 *
 * @async
 * @param {Object} [options] - 렌더링 시 전달할 옵션
 * @returns {Promise<void>}
 */
PageView.prototype.render = async function (options) {
    await this._ready();
    this.onRender();
    this.onReady();
};

/**
 * 페이지 로더를 실행합니다.
 * 페이지 리소스가 모두 로드된 후 onLoad와 onLoader 콜백을 순차적으로 호출합니다.
 *
 * @async
 * @param {Object} [options] - 로더 실행 시 전달할 옵션
 * @returns {Promise<void>}
 */
PageView.prototype.loader = async function (options) {
    await this._load();
    this.onLoader();
    this.onLoad();
};

/**
 * 컨테이너 내에서 CSS 선택자와 일치하는 첫 번째 요소를 찾습니다.
 *
 * @param {string} selector - CSS 선택자
 * @returns {Element|null} 일치하는 요소 또는 null
 */
PageView.prototype.find = function (selector) {
    return this.container.querySelector(selector);
};

/**
 * 컨테이너 내에서 CSS 선택자와 일치하는 모든 요소를 찾습니다.
 *
 * @param {string} selector - CSS 선택자
 * @returns {NodeList} 일치하는 요소들의 NodeList (결과가 없으면 빈 NodeList)
 */
PageView.prototype.findAll = function (selector) {
    return this.container.querySelectorAll(selector);
};