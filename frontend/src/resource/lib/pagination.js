/**
 * 페이지네이션 모듈 - 대량의 데이터를 여러 페이지로 나누어 표시하는 UI 컴포넌트를 제공합니다.
 * @module pagination
 */

/**
 * 페이지네이션 생성자 함수
 * @param {string|HTMLElement} containerId - 페이지네이션을 렌더링할 컨테이너 ID 또는 요소
 * @param {Object} options - 페이지네이션 옵션
 * @param {number} options.totalItems - 전체 항목 수
 * @param {number} [options.itemsPerPage=10] - 페이지당 항목 수
 * @param {number} [options.currentPage=1] - 현재 페이지
 * @param {number} [options.visiblePages=5] - 한 번에 표시할 페이지 번호 수
 * @param {Function} [options.onPageChange] - 페이지 변경 시 호출할 콜백 함수
 * @param {string|HTMLElement} [options.scrollContainerId] - 페이지 변경 시 스크롤할 컨테이너 ID 또는 요소
 * @param {Object} [options.labels] - 버튼 레이블 커스터마이징
 * @param {string} [options.labels.first='처음'] - 첫 페이지 버튼 레이블
 * @param {string} [options.labels.prev='이전'] - 이전 페이지 버튼 레이블
 * @param {string} [options.labels.next='다음'] - 다음 페이지 버튼 레이블
 * @param {string} [options.labels.last='마지막'] - 마지막 페이지 버튼 레이블
 * @param {Object} [options.classes] - CSS 클래스 커스터마이징
 * @param {string} [options.classes.pagination='oyster-pagination'] - 페이지네이션 컨테이너 클래스
 * @param {string} [options.classes.item='page-item'] - 페이지 아이템 클래스
 * @param {string} [options.classes.link='page-link'] - 페이지 링크 클래스
 * @param {string} [options.classes.active='active'] - 활성 페이지 클래스
 * @param {string} [options.classes.disabled='disabled'] - 비활성화 페이지 클래스
 * @constructor
 */
export default function Pagination(containerId, options = {}) {
    // 인스턴스 속성 초기화
    this.container = containerId instanceof HTMLElement
        ? containerId
        : document.getElementById(containerId);

    if (!this.container) {
        throw new Error(`페이지네이션 컨테이너를 찾을 수 없습니다.`);
    }

    this.totalItems = options.totalItems || 0;
    this.itemsPerPage = options.itemsPerPage || 10;
    this.currentPage = options.currentPage || 1;
    this.visiblePages = options.visiblePages || 5;
    this.onPageChange = options.onPageChange || function() {};
    this.scrollContainer = options.scrollContainerId
        ? options.scrollContainerId instanceof HTMLElement
            ? options.scrollContainerId
            : document.getElementById(options.scrollContainerId)
        : null;

    // 기본 레이블
    this.labels = Object.assign({
        first: '처음',
        prev: '이전',
        next: '다음',
        last: '마지막'
    }, options.labels || {});

    // 기본 CSS 클래스
    this.classes = Object.assign({
        pagination: 'oyster-pagination',
        item: 'page-item',
        link: 'page-link',
        active: 'active',
        disabled: 'disabled'
    }, options.classes || {});

    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // 초기화 시 goToPage 호출
    this.goToPage(this.currentPage);
}

/**
 * DOM 요소 생성 헬퍼 함수
 * @private
 * @param {string} tag - 생성할 HTML 태그 이름
 * @param {Object} [attributes={}] - 요소에 설정할 속성 객체
 * @param {string} [content=''] - 요소의 내용(innerHTML)
 * @returns {HTMLElement} 생성된 DOM 요소
 */
Pagination.prototype._createElement = function(tag, attributes = {}, content = '') {
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
 * 특정 페이지로 이동합니다.
 * 현재 페이지를 변경하고 onPageChange 콜백을 호출합니다.
 * @param {number} pageNum - 이동할 페이지 번호
 * @returns {void}
 * @example
 * // 3페이지로 이동
 * pagination.goToPage(3);
 *
 * // 다음 페이지로 이동
 * pagination.goToPage(pagination.currentPage + 1);
 */
Pagination.prototype.goToPage = function(pageNum) {
    if (typeof pageNum === 'number' && pageNum > 0 && pageNum <= this.totalPages) {
        this.currentPage = pageNum;
    }

    // 콜백 호출
    if (typeof this.onPageChange === 'function') {
        this.onPageChange(this);
    }
};

/**
 * 페이지네이션 UI를 렌더링합니다.
 * 현재 설정된 옵션(totalItems, itemsPerPage, currentPage 등)을 기반으로
 * 페이지네이션 컨트롤을 생성하고 지정된 컨테이너에 추가합니다.
 * @returns {void}
 * @example
 * // 페이지네이션 인스턴스 생성 후 렌더링
 * const pagination = new Pagination('#pagination-container', {
 *   totalItems: 100,
 *   itemsPerPage: 10
 * });
 * pagination.render();
 */
Pagination.prototype.render = function() {
    if (!this.container) {
        return;
    }

    // 기존 내용 제거
    this.container.innerHTML = '';

    // 총 페이지 수 재계산
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // 현재 페이지가 총 페이지 수를 초과하면 조정
    if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages || 1;
    }

    // 총 페이지가 없다면 리턴
    if (this.totalPages === 0) {
        return;
    }

    // 페이지네이션 컨테이너 생성
    const paginationEl = this._createElement('ul', {
        class: this.classes.pagination
    });

    // 처음 페이지 버튼
    this._appendPageItem(paginationEl, 1, this.labels.first, this.currentPage === 1);

    // 이전 페이지 버튼
    this._appendPageItem(paginationEl, this.currentPage - 1, this.labels.prev, this.currentPage === 1);

    // 페이지 번호 버튼들
    const startPage = Math.max(1, this.currentPage - Math.floor(this.visiblePages / 2));
    const endPage = Math.min(this.totalPages, startPage + this.visiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
        this._appendPageItem(paginationEl, i, i.toString(), false, i === this.currentPage);
    }

    // 다음 페이지 버튼
    this._appendPageItem(paginationEl, this.currentPage + 1, this.labels.next, this.currentPage === this.totalPages);

    // 마지막 페이지 버튼
    this._appendPageItem(paginationEl, this.totalPages, this.labels.last, this.currentPage === this.totalPages);

    // 컨테이너에 추가
    this.container.appendChild(paginationEl);

    // 이벤트 위임 설정
    this._setupEvents();

    // 스크롤 대상 컨테이너가 옵션으로 지정된 경우
    if (this.scrollContainer) {
        this.scrollContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

/**
 * 페이지네이션 컨테이너에 페이지 아이템(버튼)을 추가합니다.
 * @private
 * @param {HTMLElement} container - 페이지 아이템을 추가할 컨테이너 요소
 * @param {number} pageNum - 페이지 번호
 * @param {string} label - 페이지 아이템에 표시할 레이블 텍스트
 * @param {boolean} disabled - 비활성화 여부
 * @param {boolean} [active=false] - 현재 활성화된 페이지 여부
 * @returns {void}
 */
Pagination.prototype._appendPageItem = function(container, pageNum, label, disabled, active) {
    const itemClasses = [this.classes.item];
    if (active) itemClasses.push(this.classes.active);
    if (disabled) itemClasses.push(this.classes.disabled);

    const item = this._createElement('li', {
        class: itemClasses.join(' '),
        'data-page': pageNum
    });

    const link = this._createElement('a', {
        class: this.classes.link,
        href: 'javascript:void(0)',
        'aria-label': `페이지 ${label}`
    }, label);

    item.appendChild(link);
    container.appendChild(item);
};

/**
 * 페이지네이션 컨트롤의 클릭 이벤트를 설정합니다.
 * 이벤트 위임 패턴을 사용하여 모든 페이지 아이템의 클릭을 처리합니다.
 * @private
 * @returns {void}
 * @description
 * 이 메서드는 페이지네이션 컨테이너에 클릭 이벤트 리스너를 추가하여
 * 사용자가 페이지 번호나 이전/다음 버튼을 클릭했을 때 적절한 페이지로 이동하도록 합니다.
 * 비활성화된 버튼(disabled 클래스가 있는 요소)은 클릭해도 반응하지 않습니다.
 */
Pagination.prototype._setupEvents = function() {
    var self = this; // this 컨텍스트 저장

    // 이벤트 위임 구현
    this.container.addEventListener('click', function(e) {
        // 클릭된 요소 또는 그 부모 중에서 페이지 아이템 찾기
        let target = e.target;

        // 링크를 클릭한 경우 부모 li 요소를 찾음
        if (target.classList.contains(self.classes.link)) {
            target = target.parentElement;
        }

        // 페이지 아이템이고 비활성화되지 않은 경우에만 처리
        if (target.classList.contains(self.classes.item) &&
            !target.classList.contains(self.classes.disabled)) {

            const pageNum = parseInt(target.getAttribute('data-page'), 10);

            if (pageNum && pageNum !== self.currentPage) {
                self.goToPage(pageNum);
            }

            // 이벤트 전파 중지
            e.preventDefault();
        }
    });
};

/**
 * 현재 페이지에 대한 오프셋 값을 계산합니다.
 * @returns {number} 계산된 오프셋 값
 * @example
 * // 현재 페이지가 3이고 페이지당 항목이 10개일 때 오프셋 계산
 * const offset = pagination.getOffset(); // returns 20
 */
Pagination.prototype.getOffset = function () {
    return (this.currentPage - 1) * this.itemsPerPage;
};

/**
 * 페이지네이션 설정을 업데이트합니다.
 * 전체 항목 수, 페이지당 항목 수, 현재 페이지, 표시할 페이지 번호 수 등을 변경할 수 있습니다.
 * @param {Object} data - 업데이트할 설정 객체
 * @param {number} [data.totalItems] - 전체 항목 수
 * @param {number} [data.itemsPerPage] - 페이지당 항목 수
 * @param {number} [data.currentPage] - 현재 페이지
 * @param {number} [data.visiblePages] - 한 번에 표시할 페이지 번호 수
 * @returns {void}
 * @example
 * // 전체 항목 수와 현재 페이지 업데이트
 * pagination.update({
 *   totalItems: 200,
 *   currentPage: 1
 * });
 */
Pagination.prototype.update = function(data) {
    if (data.totalItems !== undefined) {
        this.totalItems = data.totalItems;
    }
    if (data.itemsPerPage !== undefined) {
        this.itemsPerPage = data.itemsPerPage;
    }
    if (data.visiblePages !== undefined) {
        this.visiblePages = data.visiblePages;
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
};

