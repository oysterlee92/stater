// 마우스와 터치 입력으로 콘텐츠를 순환 전환하는 캐러셀 컴포넌트
/**
 * 캐러셀 생성자입니다.
 * @param {string|HTMLElement} containerId - 캐러셀을 렌더링할 컨테이너 ID 또는 요소
 * @param {Object} [options={}] - 캐러셀 옵션
 * @param {number} [options.initialIndex=0] - 처음 표시할 슬라이드 인덱스
 * @param {boolean} [options.indicators=true] - 인디케이터 표시 여부
 * @param {boolean} [options.navigation=true] - 이전·다음 버튼 표시 여부
 * @param {boolean} [options.swipe=true] - 마우스·터치 스와이프 사용 여부
 * @param {boolean} [options.autoplay=false] - 자동 재생 여부
 * @param {number} [options.autoplayInterval=5000] - 자동 재생 간격(ms)
 * @param {number} [options.transitionDuration=500] - 슬라이드 이동 시간(ms)
 * @param {number} [options.transitionDelay=0] - 슬라이드 이동 시작 전 대기 시간(ms)
 * @param {number} [options.swipeThreshold=50] - 스와이프로 판정할 최소 거리(px)
 * @param {boolean} [options.loop=true] - 첫 슬라이드와 마지막 슬라이드 순환 여부
 * @param {boolean} [options.pauseOnHover=true] - hover와 포커스 중 자동 재생 일시 정지 여부
 * @param {Function} [options.onChange] - 슬라이드 변경 후 호출할 함수
 * @constructor
 */
export default function Carousel(containerId, options = {}) {
    this.container = containerId instanceof HTMLElement
        ? containerId
        : document.getElementById(containerId);

    if (!this.container) {
        throw new Error('캐러셀 컨테이너를 찾을 수 없습니다.');
    }

    this.initialIndex = Number.isInteger(options.initialIndex) ? options.initialIndex : 0;
    this.indicators = options.indicators !== false;
    this.navigation = options.navigation !== false;
    this.swipe = options.swipe !== false;
    this.autoplay = options.autoplay === true;
    this.autoplayInterval = Math.max(1, Number(options.autoplayInterval ?? 5000));
    this.transitionDuration = Math.max(0, Number(options.transitionDuration ?? 500));
    this.transitionDelay = Math.max(0, Number(options.transitionDelay ?? 0));
    this.swipeThreshold = Math.max(1, Number(options.swipeThreshold ?? 50));
    this.loop = options.loop !== false;
    this.pauseOnHover = options.pauseOnHover !== false;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : function() {};
    this.labels = Object.assign({ previous: '이전 슬라이드', next: '다음 슬라이드', indicator: '슬라이드' }, options.labels || {});
    this.classes = Object.assign({
        carousel: 'oyster-carousel',
        viewport: 'carousel-viewport',
        swipeEnabled: 'carousel-swipe-enabled',
        track: 'carousel-track',
        slide: 'carousel-slide',
        control: 'carousel-control',
        previous: 'carousel-control-prev',
        next: 'carousel-control-next',
        indicators: 'carousel-indicators',
        indicator: 'carousel-indicator',
        active: 'active'
    }, options.classes || {});
    this.currentIndex = 0;
    this.slides = [];
    this.timer = null;
    this.pointerStartX = null;
    this.activePointerId = null;
    this.suppressClick = false;
    this.wrapResetIndex = null;
    this.wrapResetTimer = null;
    this.isWrapping = false;
    this.listeners = [];

    this.render();
}

/** 캐러셀 구조와 선택한 컨트롤을 생성합니다. */
Carousel.prototype.render = function() {
    this.stop();
    this._clearWrapReset();
    this._removeEvents();
    this.slides = this.track ? this.slides : Array.from(this.container.children);
    this.container.innerHTML = '';
    this.container.classList.add(this.classes.carousel);

    this.viewport = this._createElement('div', { class: this.classes.viewport });
    this.viewport.classList.toggle(this.classes.swipeEnabled, this.swipe);
    this.track = this._createElement('div', { class: this.classes.track });
    this.track.style.transitionDuration = `${this.transitionDuration}ms`;
    this.track.style.transitionDelay = `${this.transitionDelay}ms`;
    this.previousButton = null;
    this.nextButton = null;
    this.indicatorContainer = null;
    this.indicatorButtons = null;

    this.slides.forEach((slide, index) => {
        slide.classList.add(this.classes.slide);
        slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('data-carousel-index', index);
        this.track.appendChild(slide);
    });
    if (this.loop && this.slides.length > 1) {
        this.track.insertBefore(this._cloneSlide(this.slides[this.slides.length - 1]), this.track.firstChild);
        this.track.appendChild(this._cloneSlide(this.slides[0]));
    }
    this.viewport.appendChild(this.track);
    this.container.appendChild(this.viewport);

    if (this.navigation && this.slides.length > 1) this._renderNavigation();
    if (this.indicators && this.slides.length > 1) this._renderIndicators();

    this.currentIndex = this._normalizeIndex(this.initialIndex);
    this._setupEvents();
    this._update(false);
    this.start();
};

/** 지정한 인덱스의 슬라이드로 이동합니다. */
Carousel.prototype.goTo = function(index) {
    if (this.isWrapping || !Number.isInteger(index) || this.slides.length === 0) return;
    const nextIndex = this._normalizeIndex(index);
    if (nextIndex === this.currentIndex) return;
    this.currentIndex = nextIndex;
    this._update(true);
    this._restartAutoplay();
};

/** 다음 슬라이드로 이동합니다. */
Carousel.prototype.next = function() {
    if (this.isWrapping) return;
    if (!this.loop && this.currentIndex === this.slides.length - 1) return;
    if (this.loop && this.currentIndex === this.slides.length - 1) {
        this.currentIndex = 0;
        this.isWrapping = true;
        this._update(true, this.slides.length + 1);
        this._scheduleWrapReset(1);
        this._restartAutoplay();
        return;
    }
    this.goTo(this.currentIndex + 1);
};

/** 이전 슬라이드로 이동합니다. */
Carousel.prototype.prev = function() {
    if (this.isWrapping) return;
    if (!this.loop && this.currentIndex === 0) return;
    if (this.loop && this.currentIndex === 0) {
        this.currentIndex = this.slides.length - 1;
        this.isWrapping = true;
        this._update(true, 0);
        this._scheduleWrapReset(this.slides.length);
        this._restartAutoplay();
        return;
    }
    this.goTo(this.currentIndex - 1);
};

/** 자동 재생을 시작합니다. */
Carousel.prototype.start = function() {
    const interactionPaused = this.pauseOnHover
        && (this.container.matches(':hover') || this.container.contains(document.activeElement));
    if (!this.autoplay || this.slides.length < 2 || this.timer || document.hidden || interactionPaused) return;
    this.timer = window.setInterval(() => this.next(), this.autoplayInterval);
};

/** 자동 재생을 중지합니다. */
Carousel.prototype.stop = function() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
};

/** 이벤트와 생성한 구조를 제거하고 초기 자식 요소를 복원합니다. */
Carousel.prototype.destroy = function() {
    this.stop();
    this._clearWrapReset();
    this._removeEvents();
    this.container.innerHTML = '';
    this.container.classList.remove(this.classes.carousel);
    this.slides.forEach((slide) => {
        slide.classList.remove(this.classes.slide);
        slide.removeAttribute('aria-hidden');
        slide.removeAttribute('data-carousel-index');
        this.container.appendChild(slide);
    });
};

/** DOM 요소를 생성합니다. */
Carousel.prototype._createElement = function(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (content) element.textContent = content;
    return element;
};

/** 무한 루프 경계에서 표시할 접근성 비노출 복제 슬라이드를 만듭니다. */
Carousel.prototype._cloneSlide = function(slide) {
    const clone = slide.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    clone.setAttribute('data-carousel-clone', 'true');
    return clone;
};

/** 이전·다음 이동 버튼을 생성합니다. */
Carousel.prototype._renderNavigation = function() {
    this.previousButton = this._createElement('button', {
        class: `${this.classes.control} ${this.classes.previous}`,
        type: 'button',
        'aria-label': this.labels.previous
    }, '‹');
    this.nextButton = this._createElement('button', {
        class: `${this.classes.control} ${this.classes.next}`,
        type: 'button',
        'aria-label': this.labels.next
    }, '›');
    this.container.append(this.previousButton, this.nextButton);
};

/** 슬라이드 개수에 맞는 인디케이터를 생성합니다. */
Carousel.prototype._renderIndicators = function() {
    this.indicatorContainer = this._createElement('div', { class: this.classes.indicators, role: 'tablist' });
    this.indicatorButtons = this.slides.map((slide, index) => {
        const button = this._createElement('button', {
            class: this.classes.indicator,
            type: 'button',
            role: 'tab',
            'data-carousel-index': index,
            'aria-label': `${this.labels.indicator} ${index + 1}`
        });
        this.indicatorContainer.appendChild(button);
        return button;
    });
    this.container.appendChild(this.indicatorContainer);
};

/** 사용자 입력과 자동 재생 일시 정지 이벤트를 연결합니다. */
Carousel.prototype._setupEvents = function() {
    this._listen(this.track, 'transitionend', (event) => {
        if (event.target === this.track && event.propertyName === 'transform') {
            this._completeWrapReset();
        }
    });
    if (this.previousButton) this._listen(this.previousButton, 'click', () => this.prev());
    if (this.nextButton) this._listen(this.nextButton, 'click', () => this.next());
    if (this.indicatorContainer) {
        this._listen(this.indicatorContainer, 'click', (event) => {
            const button = event.target.closest(`.${this.classes.indicator}`);
            if (button) this.goTo(Number(button.dataset.carouselIndex));
        });
    }
    if (this.swipe) {
        this._listen(this.viewport, 'click', (event) => {
            if (!this.suppressClick) return;
            // 스와이프 종료 후 합성되는 클릭이 링크 이동이나 버튼 동작으로 이어지지 않게 막습니다.
            this.suppressClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);
        this._listen(this.viewport, 'pointerdown', (event) => {
            // 기본 마우스 버튼과 주 포인터만 받아 멀티 터치나 우클릭 오작동을 막습니다.
            if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
            this.suppressClick = false;
            this.pointerStartX = event.clientX;
            this.activePointerId = event.pointerId;
            this.stop();
            // 링크 클릭은 viewport로 재지정하지 않아 카드의 기본 이동 동작을 보존합니다.
            if (!event.target.closest('a')) this.viewport.setPointerCapture(event.pointerId);
        });
        this._listen(this.viewport, 'pointerup', (event) => {
            if (event.pointerId !== this.activePointerId || this.pointerStartX === null) return;
            const distance = event.clientX - this.pointerStartX;
            this.pointerStartX = null;
            this.activePointerId = null;
            if (Math.abs(distance) < this.swipeThreshold) {
                this.start();
                return;
            }
            this.suppressClick = true;
            if (distance < 0) this.next();
            else this.prev();
        });
        this._listen(this.viewport, 'pointercancel', (event) => {
            if (event.pointerId !== this.activePointerId) return;
            this.pointerStartX = null;
            this.activePointerId = null;
            this.start();
        });
        // 이미지의 기본 드래그가 포인터 스와이프를 취소하지 않게 합니다.
        this._listen(this.viewport, 'dragstart', (event) => event.preventDefault());
    }
    if (this.pauseOnHover) {
        this._listen(this.container, 'mouseenter', () => this.stop());
        this._listen(this.container, 'mouseleave', () => this.start());
        this._listen(this.container, 'focusin', () => this.stop());
        this._listen(this.container, 'focusout', () => this.start());
    }
    this._listen(document, 'visibilitychange', () => {
        if (document.hidden) this.stop();
        else this.start();
    });
};

/** 이동 위치와 접근성 상태를 현재 인덱스에 맞춥니다. */
Carousel.prototype._update = function(notify, visualIndex = this._getVisualIndex()) {
    this.track.style.transform = `translate3d(-${visualIndex * 100}%, 0, 0)`;
    this.slides.forEach((slide, index) => slide.setAttribute('aria-hidden', String(index !== this.currentIndex)));
    if (this.indicatorButtons) {
        this.indicatorButtons.forEach((button, index) => {
            button.classList.toggle(this.classes.active, index === this.currentIndex);
            button.setAttribute('aria-selected', String(index === this.currentIndex));
        });
    }
    if (!this.loop && this.previousButton && this.nextButton) {
        this.previousButton.disabled = this.currentIndex === 0;
        this.nextButton.disabled = this.currentIndex === this.slides.length - 1;
    }
    if (notify) this.onChange(this);
};

/** 복제 슬라이드 유무를 반영한 track 내부 위치를 반환합니다. */
Carousel.prototype._getVisualIndex = function() {
    return this.loop && this.slides.length > 1 ? this.currentIndex + 1 : this.currentIndex;
};

/** 경계 복제 슬라이드 전환 후 실제 슬라이드 위치로 보정할 작업을 예약합니다. */
Carousel.prototype._scheduleWrapReset = function(visualIndex) {
    this.wrapResetIndex = visualIndex;
    this.wrapResetTimer = window.setTimeout(
        () => this._completeWrapReset(),
        this.transitionDelay + this.transitionDuration + 50
    );
};

/** 애니메이션 없이 복제 슬라이드에서 동일한 실제 슬라이드로 위치를 옮깁니다. */
Carousel.prototype._completeWrapReset = function() {
    if (this.wrapResetIndex === null) return;
    const visualIndex = this.wrapResetIndex;
    this._clearWrapReset();
    this.track.style.transitionDuration = '0ms';
    this.track.style.transitionDelay = '0ms';
    this.track.style.transform = `translate3d(-${visualIndex * 100}%, 0, 0)`;
    void this.track.offsetWidth;
    this.track.style.transitionDuration = `${this.transitionDuration}ms`;
    this.track.style.transitionDelay = `${this.transitionDelay}ms`;
    this.isWrapping = false;
};

/** 예약된 무한 루프 위치 보정을 취소하고 상태를 초기화합니다. */
Carousel.prototype._clearWrapReset = function() {
    if (this.wrapResetTimer) window.clearTimeout(this.wrapResetTimer);
    this.wrapResetTimer = null;
    this.wrapResetIndex = null;
    this.isWrapping = false;
};

/** 순환 옵션을 반영해 유효한 슬라이드 인덱스를 반환합니다. */
Carousel.prototype._normalizeIndex = function(index) {
    if (this.slides.length === 0) return 0;
    if (!this.loop) return Math.min(Math.max(index, 0), this.slides.length - 1);
    return (index % this.slides.length + this.slides.length) % this.slides.length;
};

/** 자동 재생 간격을 사용자 조작 시점부터 다시 계산합니다. */
Carousel.prototype._restartAutoplay = function() {
    this.stop();
    this.start();
};

/** 정리를 위해 이벤트 등록 정보를 보관합니다. */
Carousel.prototype._listen = function(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    this.listeners.push({ target, eventName, handler, options });
};

/** 등록한 이벤트를 모두 제거합니다. */
Carousel.prototype._removeEvents = function() {
    this.listeners.forEach(({ target, eventName, handler, options }) => {
        target.removeEventListener(eventName, handler, options);
    });
    this.listeners = [];
};
