/**
 * 스크롤 페이지네이션 모듈 - 스크롤 또는 더보기 버튼을 통해 데이터를 추가로 로드하는 UI 컴포넌트를 제공합니다.
 * @module scrollPagination
 */

/**
 * 스크롤 페이지네이션 생성자 함수
 * @param {string|HTMLElement} containerId - 컨텐츠를 렌더링할 컨테이너 ID 또는 요소
 * @param {Object} options - 스크롤 페이지네이션 옵션
 * @param {number} options.totalItems - 전체 항목 수
 * @param {number} [options.itemsPerPage=10] - 한 번에 로드할 항목 수
 * @param {number} [options.currentPage=1] - 현재 페이지
 * @param {boolean} [options.useButton=false] - 더보기 버튼 사용 여부 (false면 스크롤 사용)
 * @param {Function} [options.onLoadMore] - 추가 데이터 로드 시 호출할 콜백 함수
 * @param {string|HTMLElement} [options.scrollContainerId] - 스크롤 이벤트를 감지할 컨테이너 ID 또는 요소 (기본값: window)
 * @param {number} [options.scrollThreshold=100] - 스크롤 하단에서 얼마나 떨어졌을 때 추가 로드를 시작할지 픽셀 단위로 지정
 * @param {boolean} [options.showLoadingIndicator=true] - 로딩 시 로딩 인디케이터 표시 여부 (버튼/스크롤 모드 공통)
 * @param {Object} [options.labels] - 버튼 레이블 커스터마이징
 * @param {string} [options.labels.loadMore='더 보기'] - 더보기 버튼 레이블
 * @param {string} [options.labels.loading='로딩 중...'] - 로딩 인디케이터 레이블
 * @param {Object} [options.classes] - CSS 클래스 커스터마이징
 * @param {string} [options.classes.loadMoreButton='oyster-load-more-btn'] - 더보기 버튼 클래스
 * @param {string} [options.classes.loadingIndicator='oyster-loading-indicator'] - 로딩 인디케이터 클래스
 * @constructor
 */
export default function ScrollPagination(containerId, options = {}) {
    // 인스턴스 속성 초기화
    this.container = containerId instanceof HTMLElement
        ? containerId
        : document.getElementById(containerId);

    if (!this.container) {
        throw new Error(`스크롤 페이지네이션 컨테이너를 찾을 수 없습니다.`);
    }

    this.totalItems = options.totalItems || 0;
    this.itemsPerPage = options.itemsPerPage || 10;
    this.currentPage = options.currentPage || 1;
    this.useButton = options.useButton !== undefined ? options.useButton : false;
    this.onLoadMore = options.onLoadMore || function() {};

    this.scrollContainer = options.scrollContainerId
        ? options.scrollContainerId instanceof HTMLElement
            ? options.scrollContainerId
            : document.getElementById(options.scrollContainerId)
        : window;

    this.scrollThreshold = options.scrollThreshold || 100;
    this.loading = false;
    this.allLoaded = false;
    // 로딩 인디케이터 표시 여부 옵션 추가 (기본값: true)
    this.showLoadingIndicator = options.showLoadingIndicator !== undefined ? options.showLoadingIndicator : true;
    this.resizeHandler = null;
    this.scrollHandler = null;

    // 기본 레이블
    this.labels = Object.assign({
        loadMore: '더 보기',
        loading: '로딩 중...'
    }, options.labels || {});

    // 기본 CSS 클래스
    this.classes = Object.assign({
        loadMoreButton: 'oyster-load-more-btn',
        loadingIndicator: 'oyster-loading-indicator'
    }, options.classes || {});

    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.loadMoreButton = null;
    this.loadingIndicator = null;

    // 초기화 시 loadMore 호출
    this._loadMore();
}

/**
 * DOM 요소 생성 헬퍼 함수
 * @private
 * @param {string} tag - 생성할 HTML 태그 이름
 * @param {Object} [attributes={}] - 요소에 설정할 속성 객체
 * @param {string} [content=''] - 요소의 내용(innerHTML)
 * @returns {HTMLElement} 생성된 DOM 요소
 */
ScrollPagination.prototype._createElement = function(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);

    // 속성 설정
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    // 내용 설정
    if (content) {
        element.innerHTML = content;
    }

    return element;
};

/**
 * 추가 데이터를 로드합니다.
 * 로딩 상태를 true로 설정하고 onLoadMore 콜백을 호출합니다.
 * @returns {void}
 * @example
 * // 수동으로 추가 데이터 로드
 * scrollPagination._loadMore();
 *
 * // onLoadMore 콜백 예시
 * const scrollPagination = new ScrollPagination('#content', {
 *   totalItems: 100,
 *   itemsPerPage: 10,
 *   onLoadMore: function(instance) {
 *     // 서버에서 데이터 가져오기
 *     fetchData(instance.currentPage).then(data => {
 *       // 데이터 표시 후 로딩 상태 업데이트
 *       renderItems(data);
 *     });
 *   }
 * });
 */
ScrollPagination.prototype._loadMore = function() {
    // 콜백 호출
    if (typeof this.onLoadMore === 'function') {
        this.onLoadMore(this);
    }

    // 로딩 상태 업데이트
    this.loading = true;
    this._updateState();
};

/**
 * 현재 상태를 업데이트하고 UI에 반영합니다.
 * 로딩 상태와 모든 데이터가 로드되었는지 여부에 따라 UI 요소를 업데이트합니다.
 * @private
 * @returns {void}
 * @description
 * 이 메서드는 현재 페이지와 총 페이지 수를 비교하여 모든 데이터가 로드되었는지 확인하고,
 * 사용 모드(버튼 또는 스크롤)에 따라 UI 요소의 표시 상태를 업데이트합니다.
 * 버튼 모드에서는 모든 데이터가 로드되면 버튼을 숨기고, 로딩 중에는 버튼을 비활성화합니다.
 * 스크롤 모드에서는 로딩 중일 때만 로딩 인디케이터를 표시합니다.
 */
ScrollPagination.prototype._updateState = function() {
    // 모든 항목이 로드되었는지 확인
    this.allLoaded = this.currentPage >= this.totalPages;

    // 1. 로딩 인디케이터 처리 (모드 상관없이 로딩 중이고 옵션이 켜져있으면 표시)
    if (this.loading && this.showLoadingIndicator) {
        this._renderLoadingIndicator();
    } else {
        if (this.loadingIndicator) {
            this.loadingIndicator.remove();
            this.loadingIndicator = null;
        }
    }

    // 2. 모드별 UI 처리
    if (this.useButton) {
        // 더보기 버튼 모드
        // 로딩 중이거나 모두 로드되었으면 버튼 제거
        if (this.loading || this.allLoaded) {
            if (this.loadMoreButton) {
                this.loadMoreButton.remove();
            }
        } else {
            // 로딩 중이 아니고 데이터가 남았을 때만 버튼 렌더링
            this._renderLoadMoreButton();
        }
    } else {
        // 스크롤 모드
        if (this.loading) {
            // 리스너 설정을 위해 호출 (UI 렌더링은 위에서 처리됨)
            this._renderScrollLoader();
        }
    }
};

/**
 * 스크롤 페이지네이션 UI를 렌더링합니다.
 * 현재 설정된 옵션(useButton, totalItems, itemsPerPage 등)을 기반으로 
 * 더보기 버튼 또는 스크롤 기반 로딩 UI를 생성합니다.
 * @returns {void}
 * @example
 * // 스크롤 페이지네이션 인스턴스 생성 후 렌더링
 * const scrollPagination = new ScrollPagination('#content-container', {
 *   totalItems: 100,
 *   itemsPerPage: 10,
 *   useButton: false
 * });
 * scrollPagination.render();
 */
ScrollPagination.prototype.render = function() {
    if (!this.container) {
        return;
    }

    // 총 페이지 수 재계산
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // 현재 페이지가 총 페이지 수를 초과하면 조정
    if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages || 1;
    }

    // 로딩 상태 업데이트
    this.loading = false;
    this._updateState();
};

/**
 * '더보기' 버튼을 렌더링합니다.
 * useButton 옵션이 true인 경우 사용되며, 버튼 클릭 시 추가 데이터를 로드합니다.
 * @private
 * @returns {void}
 * @description
 * 이 메서드는 '더보기' 버튼을 생성하고 컨테이너에 추가합니다.
 * 버튼에 클릭 이벤트 리스너를 설정하여 사용자가 버튼을 클릭하면
 * 현재 페이지를 증가시키고 loadMore 메서드를 호출합니다.
 * 기존에 버튼이 있는 경우 제거 후 새로 생성합니다.
 */
ScrollPagination.prototype._renderLoadMoreButton = function() {
    // 기존 버튼이 있으면 제거
    if (this.loadMoreButton) {
        this.loadMoreButton.remove();
    }

    // 더보기 버튼 생성
    this.loadMoreButton = this._createElement('button', {
        class: this.classes.loadMoreButton,
        type: 'button'
    }, this.labels.loadMore);

    // 버튼 클릭 이벤트 설정
    this.loadMoreButton.addEventListener('click', () => {
        this.currentPage++;
        this._loadMore();
    });

    // 컨테이너에 버튼 추가
    this.container.appendChild(this.loadMoreButton);
};

/**
 * 로딩 인디케이터를 렌더링합니다.
 * _renderScrollLoader에서 분리된 UI 생성 로직입니다.
 * @private
 */
ScrollPagination.prototype._renderLoadingIndicator = function() {
    // 이미 인디케이터가 존재하면 다시 생성하지 않음 (순서 보장이 필요하면 remove 후 재생성)
    if (this.loadingIndicator) {
        return;
    }

    // 로딩 인디케이터 생성
    this.loadingIndicator = this._createElement('div', {
        class: this.classes.loadingIndicator,
    }, this.labels.loading);

    // 컨테이너에 인디게이터 추가
    this.container.appendChild(this.loadingIndicator);
};

/**
 * 스크롤 로더 리스너를 설정합니다.
 * useButton 옵션이 false인 경우 사용되며, 스크롤/리사이즈 리스너를 설정합니다.
 * (UI 렌더링 로직은 _renderLoadingIndicator로 분리됨)
 * @private
 */
ScrollPagination.prototype._renderScrollLoader = function() {
    // 스크롤 모드인 경우 스크롤 이벤트 리스너 설정
    this._setupScrollListener();

    // 리사이즈 이벤트 리스너 설정
    this._setupResizeListener();
};

/**
 * 스크롤 이벤트 리스너를 설정합니다.
 * useButton 옵션이 false인 경우 사용되며, 스크롤이 하단에 가까워지면 추가 데이터를 자동으로 로드합니다.
 * @private
 * @returns {void}
 * @description
 * 이 메서드는 스크롤 컨테이너(window 또는 지정된 요소)에 스크롤 이벤트 리스너를 추가합니다.
 * 사용자가 스크롤을 내려 하단에 가까워지면(scrollThreshold 값 이내) 추가 데이터를 로드합니다.
 * 스크롤 위치 계산은 window 객체와 일반 DOM 요소에 대해 각각 다르게 처리됩니다.
 * 이미 로딩 중이거나 모든 데이터가 로드된 경우에는 추가 로드를 수행하지 않습니다.
 */
ScrollPagination.prototype._setupScrollListener = function() {
    // 기존 스크롤 이벤트 리스너가 있으면 제거
    if (this.scrollHandler) {
        this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
    }

    // 스크롤 이벤트 핸들러
    this.scrollHandler = () => {
        if (this.loading || this.allLoaded) {
            return;
        }

        let scrollPosition, containerHeight, scrollHeight;

        if (this.scrollContainer === window) {
            scrollPosition = window.scrollY || window.pageYOffset;
            containerHeight = window.innerHeight;
            scrollHeight = document.documentElement.scrollHeight;
        } else {
            scrollPosition = this.scrollContainer.scrollTop;
            containerHeight = this.scrollContainer.clientHeight;
            scrollHeight = this.scrollContainer.scrollHeight;
        }

        // 스크롤이 하단에 가까워지면 추가 데이터 로드
        if (scrollHeight - scrollPosition - containerHeight < this.scrollThreshold) {
            this.currentPage++;
            this._loadMore();
        }
    };

    // 스크롤 이벤트 리스너 등록
    this.scrollContainer.addEventListener('scroll', this.scrollHandler);

    // 초기 확인 (컨텐츠가 적어 스크롤이 생기지 않는 경우를 위해)
    const maxWaitTime = 3000;
    const checkInterval = 100;
    const startedAt = Date.now();

    const waitUntilLoaded = () => {
        if (!this.scrollHandler) {
            return;
        }

        if (Date.now() - startedAt >= maxWaitTime) {
            return;
        }

        if (this.loading) {
            setTimeout(waitUntilLoaded, checkInterval);
            return;
        }

        this.scrollHandler();
    };

    waitUntilLoaded();
};

/**
 * 리사이즈 이벤트 리스너를 설정합니다.
 * 창 크기가 변경될 때 추가 데이터를 로드하는 기능을 제공합니다.
 * @private
 * @returns {void}
 * @description
 * 이 메서드는 window 객체에 resize 이벤트 리스너를 추가합니다.
 * 창 크기가 변경되면 컨텐츠 영역이 확장되어 추가 데이터가 필요할 수 있으므로,
 * 자동으로 다음 페이지를 로드합니다.
 * 이미 로딩 중이거나 모든 데이터가 로드된 경우에는 추가 로드를 수행하지 않습니다.
 */
ScrollPagination.prototype._setupResizeListener = function() {
    // 기존 리사이즈 이벤트 리스너가 있으면 제거
    if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
    }

    // 리사이즈 이벤트 핸들러
    this.resizeHandler = () => {
        if (this.loading || this.allLoaded) {
            return;
        }

        this.currentPage++;
        this._loadMore();
    };

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.resizeHandler);
};

/**
 * 등록된 이벤트 리스너를 정리합니다.
 * 스크롤 페이지네이션 인스턴스가 더 이상 필요하지 않을 때 메모리 누수를 방지하기 위해 호출합니다.
 * @returns {void}
 * @example
 * // 페이지 전환 시 또는 컴포넌트 언마운트 시 정리
 * scrollPagination.cleanup();
 * 
 * // 또는 reset 메서드 내에서 자동으로 호출됨
 * scrollPagination.reset();
 */
ScrollPagination.prototype.cleanup = function() {
    // 스크롤 이벤트 리스너 제거
    if (this.scrollHandler) {
        this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        this.scrollHandler = null;
    }

    // 리사이즈 이벤트 리스너 제거
    if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeHandler = null;
    }
};

/**
 * 페이지네이션을 초기 상태로 재설정합니다.
 * 이벤트 리스너를 정리하고, 현재 페이지를 1로 설정하며, 컨테이너의 내용을 비웁니다.
 * @returns {void}
 * @example
 * // 필터 변경 시 페이지네이션 초기화
 * filterButton.addEventListener('click', function() {
 *   scrollPagination.reset();
 *   // 새 필터로 데이터 로드
 *   loadFilteredData();
 * });
 */
ScrollPagination.prototype.reset = function() {
    // 이벤트 리스너 정리
    this.cleanup();

    this.currentPage = 1;
    this.loading = false;
    this.allLoaded = false;
    this.container.innerHTML = '';

    this._loadMore();
};

/**
 * 현재 페이지에 대한 오프셋 값을 계산합니다.
 * @returns {number} 계산된 오프셋 값
 * @example
 * // 현재 페이지가 3이고 페이지당 항목이 10개일 때 오프셋 계산
 * const offset = pagination.getOffset(); // returns 20
 */
ScrollPagination.prototype.getOffset = function () {
    return (this.currentPage - 1) * this.itemsPerPage;
};

/**
 * 스크롤 페이지네이션 설정을 업데이트합니다.
 * 전체 항목 수, 페이지당 항목 수, 현재 페이지 등을 변경할 수 있습니다.
 * @param {Object} data - 업데이트할 설정 객체
 * @param {number} [data.totalItems] - 전체 항목 수
 * @param {number} [data.itemsPerPage] - 페이지당 항목 수
 * @param {number} [data.currentPage] - 현재 페이지
 * @returns {void}
 * @example
 * // 전체 항목 수와 현재 페이지 업데이트
 * scrollPagination.update({
 *   totalItems: 200,
 *   currentPage: 1
 * });
 */
ScrollPagination.prototype.update = function(data) {
    if (data.totalItems !== undefined) {
        this.totalItems = data.totalItems;
    }
    if (data.itemsPerPage !== undefined) {
        this.itemsPerPage = data.itemsPerPage;
    }
    
    // 총 페이지 수 재계산
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // 현재 페이지가 총 페이지 수를 초과하면 조정
    if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages || 1;
    }
    
    // 현재 페이지 설정 (data.currentPage가 있는 경우)
    if (data.currentPage !== undefined) {
        this.currentPage = Math.min(data.currentPage, this.totalPages);
    }

    // 모든 항목이 로드되었는지 확인
    this.allLoaded = this.currentPage >= this.totalPages;
};