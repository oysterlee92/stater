/**
 * 모듈형 뷰 컴포넌트를 정의하는 클래스
 * 
 * 페이지 내의 특정 영역(모듈)을 독립적으로 관리하기 위한 뷰 컴포넌트입니다.
 * 컨테이너 내의 요소 탐색, 초기화 데이터 설정, 생명주기 관리를 지원합니다.
 * 
 * @class ModuleView
 * @param {string} containerId - 모듈을 렌더링할 컨테이너 요소의 ID
 * @param {Object} [options={}] - 모듈 뷰 옵션
 * @param {Function} [options.onMount] - 모듈이 화면에 마운트된 후 호출되는 콜백 함수
 * @param {Function} [options.onLoad] - 데이터 로딩 완료 후 호출되는 콜백 함수
 * @param {Function} [options.init] - 데이터 조회 등 초기화 로직을 수행하는 함수 (Promise 반환 가능)
 * @param {Function} [options.resizeHandler] - 리사이즈 이벤트 발생 시 실행할 핸들러
 * @throws {Error} 지정된 ID의 컨테이너를 찾을 수 없는 경우 발생
 */
export default function ModuleView(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
        throw new Error(`ID가 '${containerId}'인 컨테이너를 찾을 수 없습니다.`);
    }

    this.onMount = options.onMount || function () {
    };
    this.onLoad = options.onLoad || function () {
    };
    this.init = options.init || function () {
    };
    this.resizeHandler = options.resizeHandler || function () {
    };

    this.params = {};
    this.mounted = false;
    // 결과값
    this.result = {};
};

/**
 * 모듈 뷰의 초기 파라미터를 설정합니다.
 * 
 * @param {Object} options - 설정 옵션 객체
 * @param {Object} [options.params] - 모듈에서 사용할 파라미터 데이터
 */
ModuleView.prototype.set = function (options) {
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        this.params = options.params || {};
    }
};

/**
 * 모듈 데이터를 로드하고 초기화 함수를 실행합니다. (내부 메서드)
 * 
 * @private
 * @param {Object} options - 로드 옵션 및 파라미터
 * @returns {Promise<void>} 로딩 완료 시 resolve되는 Promise
 */
ModuleView.prototype._load = function (options) {
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
 * 모듈을 마운트합니다. 데이터를 로드한 후 onMount 콜백을 실행합니다.
 *
 * @async
 * @param {Object} [options] - 마운트 시 전달할 옵션 및 파라미터
 * @returns {Promise<void>} 마운트 완료 시 resolve되는 Promise
 */
ModuleView.prototype.mount = async function (options) {
    await this._load(options);
    this.onMount();
    this.onLoad();
    this.mounted = true;
};

/**
 * 모듈 컨테이너 내에서 특정 셀렉터와 일치하는 요소를 찾습니다.
 * 
 * @param {string} selector - CSS 셀렉터
 * @returns {Element|null} 찾은 요소 또는 null
 */
ModuleView.prototype.find = function (selector) {
    return this.container.querySelector(selector);
};

/**
 * 모듈 컨테이너 내에서 특정 셀렉터와 일치하는 모든 요소를 찾습니다.
 * 
 * @param {string} selector - CSS 셀렉터
 * @returns {NodeList} 찾은 요소들의 노드 리스트
 */
ModuleView.prototype.findAll = function (selector) {
    return this.container.querySelectorAll(selector);
};

