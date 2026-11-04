/**
 * DOM Manipulation Utility Module
 * 
 * DOM 요소 조작, 이벤트 관리, 스크롤 제어, 텍스트 필터링 등의 유틸리티 함수를 제공합니다.
 * 이벤트 위임, 뷰포트 감지, 입력 필터링 기능을 포함합니다.
 * 
 * @module dom
 * @example
 * import dom from '@/resource/lib/dom.js';
 * 
 * // 요소로 스크롤
 * dom.scrollToElement('#section-1');
 * dom.scrollToElement('.header', { behavior: 'smooth', block: 'center' });
 * 
 * // 뷰포트 내 요소 확인
 * if (dom.isElementInViewport('#my-element')) {
 *   console.log('요소가 화면에 보입니다');
 * }
 * 
 * // 이벤트 추가
 * dom.addEvent('.btn', 'click', () => {
 *   console.log('버튼 클릭됨');
 * });
 * 
 * // 이벤트 위임
 * dom.delegateEvent('#container', '.dynamic-button', 'click', (e) => {
 *   console.log('동적 버튼 클릭됨');
 * });
 * 
 * // 텍스트 필터링
 * dom.filterKorean('#username'); // 한글만 허용
 * dom.filterNumber('#age'); // 숫자만 허용
 * dom.filterEnglishNumber('#username', true); // 영문+숫자+공백 허용
 * dom.limitLength('#description', 100); // 최대 100자로 제한
 */

/**
 * DOM 관련 유틸리티 함수들입니다.
 * @namespace dom
 */
const dom = {
    /**
     * 현재 스크롤 위치를 가져옵니다.
     * @returns {Object} left, top 위치를 포함하는 객체
     * @example
     * const { left, top } = dom.getScrollPosition();
     */
    getScrollPosition: function() {
        return {
            left: document.documentElement.scrollLeft || document.body.scrollLeft,
            top: document.documentElement.scrollTop || document.body.scrollTop
        };
    },

    /**
     * 지정된 요소로 스크롤합니다. 여러 요소가 선택된 경우 첫 번째 요소로 스크롤합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 스크롤할 요소(들) 또는 선택자
     * @param {Object} [options] - 스크롤 옵션
     * @param {string} [options.behavior='smooth'] - 스크롤 동작 ('auto', 'smooth')
     * @param {string} [options.block='start'] - 수직 정렬 ('start', 'center', 'end', 'nearest')
     * @param {string} [options.inline='nearest'] - 수평 정렬 ('start', 'center', 'end', 'nearest')
     * @example
     * // ID로 요소 스크롤
     * dom.scrollToElement('section-1');
     * 
     * // 클래스로 첫 번째 요소 스크롤
     * dom.scrollToElement('.section-header');
     * 
     * // CSS 선택자로 요소 스크롤
     * dom.scrollToElement('article.featured h2');
     */
    scrollToElement: function(elements, options = {}) {
        const domElements = this._getElements(elements);
        if (domElements.length === 0) return;
        
        // 첫 번째 요소로 스크롤
        const el = domElements[0];
        
        const scrollOptions = {
            behavior: options.behavior || 'smooth',
            block: options.block || 'start',
            inline: options.inline || 'nearest'
        };
        
        el.scrollIntoView(scrollOptions);
    },

    /**
     * 요소가 뷰포트 내에 있는지 확인합니다. 여러 요소가 선택된 경우, 하나라도 뷰포트 내에 있으면 true를 반환합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 확인할 요소(들) 또는 선택자
     * @param {boolean} [partial=true] - 부분적으로 보이는 것도 포함할지 여부
     * @param {boolean} [all=false] - true인 경우 모든 요소가 뷰포트 내에 있어야 true 반환, false인 경우 하나라도 있으면 true 반환
     * @returns {boolean} 요소가 뷰포트 내에 있는지 여부
     * @example
     * // ID로 단일 요소 확인
     * if (dom.isElementInViewport('my-element')) {
     *   // 요소가 뷰포트 내에 있음
     * }
     * 
     * // 클래스로 여러 요소 확인 (하나라도 뷰포트 내에 있으면 true)
     * if (dom.isElementInViewport('.product-card')) {
     *   // 하나 이상의 제품 카드가 뷰포트 내에 있음
     * }
     * 
     * // 모든 요소가 뷰포트 내에 있는지 확인
     * if (dom.isElementInViewport('.nav-item', true, true)) {
     *   // 모든 네비게이션 항목이 뷰포트 내에 있음
     * }
     */
    isElementInViewport: function(elements, partial = true, all = false) {
        const domElements = this._getElements(elements);
        if (domElements.length === 0) return false;
        
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        // 요소가 뷰포트 내에 있는지 확인하는 함수
        const isInViewport = (el) => {
            const rect = el.getBoundingClientRect();
            
            if (partial) {
                return (
                    rect.bottom > 0 &&
                    rect.right > 0 &&
                    rect.left < windowWidth &&
                    rect.top < windowHeight
                );
            } else {
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= windowHeight &&
                    rect.right <= windowWidth
                );
            }
        };
        
        if (all) {
            // 모든 요소가 뷰포트 내에 있어야 true
            return domElements.every(isInViewport);
        } else {
            // 하나라도 뷰포트 내에 있으면 true
            return domElements.some(isInViewport);
        }
    },

    /**
     * 이벤트 핸들러를 저장하기 위한 WeakMap입니다.
     * @private
     */
    _eventHandlers: new WeakMap(),
    
    /**
     * 위임된 이벤트 핸들러를 저장하기 위한 WeakMap입니다.
     * @private
     */
    _delegatedHandlers: new WeakMap(),

    /**
     * 다양한 형태의 요소 선택자를 DOM 요소 배열로 변환합니다.
     * @private
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 변환할 요소 또는 선택자
     * @returns {Array<HTMLElement>} DOM 요소 배열
     */
    _getElements: function(elements) {
        // 이미 배열인 경우 그대로 사용
        if (Array.isArray(elements)) {
            return Array.from(elements).filter(el => el instanceof HTMLElement);
        }
        
        // NodeList 또는 HTMLCollection인 경우 배열로 변환
        if (elements instanceof NodeList || elements instanceof HTMLCollection) {
            return Array.from(elements);
        }
        
        // 단일 HTMLElement인 경우 배열로 변환
        if (elements instanceof HTMLElement) {
            return [elements];
        }
        
        // 문자열인 경우 querySelectorAll만 사용
        if (typeof elements === 'string') {
            try {
                return Array.from(document.querySelectorAll(elements));
            } catch (e) {
                console.error('Invalid selector:', elements);
                return [];
            }
        }
        
        return [];
    },

    /**
     * 요소에 이벤트 리스너를 추가합니다.
     * 중복된 핸들러(동일한 요소, 이벤트 타입, 핸들러, 옵션)는 추가되지 않습니다.
     *
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 이벤트를 추가할 요소(들) 또는 선택자
     * @param {string} eventType - 이벤트 유형 ('click', 'scroll' 등)
     * @param {Function} handler - 이벤트 핸들러 함수
     * @param {Object|boolean} [options] - 이벤트 리스너 옵션 (capture, once, passive 등) 또는 useCapture boolean
     * @returns {typeof dom} 메서드 체이닝을 위한 dom 객체
     * @example
     * // ID로 단일 요소에 이벤트 추가
     * dom.addEvent('#my-button', 'click', () => {
     *   console.log('Button clicked');
     * });
     *
     * // 클래스로 여러 요소에 이벤트 추가 (once 옵션 사용)
     * dom.addEvent('.btn', 'click', () => {
     *   console.log('한 번만 실행됩니다.');
     * }, { once: true });
     *
     * // CSS 선택자로 요소에 이벤트 추가 및 체이닝
     * dom.addEvent('nav li a', 'click', onNavClick)
     *    .addEvent('#top', 'click', onTopClick);
     */
    addEvent: function(elements, eventType, handler, options) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            // 요소에 대한 이벤트 맵 가져오기 또는 생성
            if (!this._eventHandlers.has(el)) {
                this._eventHandlers.set(el, new Map());
            }
            
            const elementEvents = this._eventHandlers.get(el);
            
            // 이벤트 타입에 대한 핸들러 배열 가져오기 또는 생성
            if (!elementEvents.has(eventType)) {
                elementEvents.set(eventType, []);
            }
            
            const handlers = elementEvents.get(eventType);

            // 동일한 핸들러와 옵션 조합이 이미 존재하는지 확인
            const isDuplicate = handlers.some(h => {

                // 핸들러 함수가 동일한지 확인 (원본 핸들러가 있으면 그것을 비교)
                const storedHandler = h.originalHandler || h.handler;
                if (storedHandler.toString() !== handler.toString()) return false;

                // 옵션이 모두 undefined이거나 null인 경우 동일한 것으로 간주
                if ((h.options === undefined || h.options === null) && 
                    (options === undefined || options === null)) {
                    return true;
                }

                // 한쪽만 옵션이 있는 경우 다른 것으로 간주
                if ((h.options === undefined || h.options === null) || 
                    (options === undefined || options === null)) {
                    return false;
                }

                // 옵션 객체를 JSON 문자열로 변환하여 비교
                return JSON.stringify(h.options) === JSON.stringify(options);
            });

            // 중복이 아닌 경우에만 핸들러 추가
            if (!isDuplicate) {
                let listener = handler;

                // once 옵션인 경우: 실행 후 내부 목록에서도 제거되도록 래핑
                if (options && options.once) {
                    const originalHandler = handler;
                    const self = this; // dom 객체 참조

                    listener = function(event) {
                        // 원본 핸들러 실행
                        originalHandler.call(this, event);

                        // 내부 목록에서 제거
                        const idx = handlers.findIndex(h => h.originalHandler === originalHandler);
                        if (idx !== -1) {
                            handlers.splice(idx, 1);
                        }

                        // 이벤트 타입에 핸들러가 더 이상 없으면 맵 정리
                        if (handlers.length === 0) {
                            elementEvents.delete(eventType);
                            if (elementEvents.size === 0) {
                                self._eventHandlers.delete(el);
                            }
                        }
                    };
                }

                // 핸들러 정보 저장
                handlers.push({
                    handler: listener,          // 실제 등록된 리스너 (래퍼일 수 있음)
                    originalHandler: handler,   // 사용자 원본 핸들러 (식별용)
                    options: options
                });

                // 실제 이벤트 리스너 추가
                el.addEventListener(eventType, listener, options);
            }
        });

        return this;
    },

    /**
     * 요소에서 이벤트 리스너를 제거합니다.
     *
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 이벤트를 제거할 요소(들) 또는 선택자
     * @param {string} eventType - 이벤트 유형 ('click', 'scroll' 등)
     * @param {Function} [handler] - 제거할 특정 이벤트 핸들러 함수 (생략 시 해당 이벤트 타입의 모든 핸들러 제거)
     * @returns {typeof dom} 메서드 체이닝을 위한 dom 객체
     * @example
     * // 특정 핸들러 제거 (ID 선택자)
     * dom.removeEvent('#my-button', 'click', myClickHandler);
     *
     * // 해당 요소의 모든 클릭 이벤트 제거 (ID 선택자)
     * dom.removeEvent('#my-button', 'click');
     *
     * // 클래스로 선택한 모든 요소의 이벤트 제거
     * dom.removeEvent('.btn', 'click');
     *
     * // CSS 선택자로 선택한 모든 요소의 이벤트 제거
     * dom.removeEvent('nav li a', 'click');
     */
    removeEvent: function(elements, eventType, handler) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            // 요소에 대한 이벤트 맵이 없으면 건너뛰기
            if (!this._eventHandlers.has(el)) return;
            
            const elementEvents = this._eventHandlers.get(el);
            
            // 이벤트 타입에 대한 핸들러 배열이 없으면 건너뛰기
            if (!elementEvents.has(eventType)) return;
            
            const handlers = elementEvents.get(eventType);
            
            if (handler) {
                // 특정 핸들러만 제거
                const index = handlers.findIndex(h => h.handler === handler || h.originalHandler === handler);
                if (index !== -1) {
                    const handlerData = handlers[index];
                    el.removeEventListener(eventType, handlerData.handler, handlerData.options);
                    handlers.splice(index, 1);
                }
            } else {
                // 해당 이벤트 타입의 모든 핸들러 제거
                handlers.forEach(h => {
                    el.removeEventListener(eventType, h.handler, h.options);
                });
                elementEvents.delete(eventType);
            }
            
            // 이벤트 타입이 없으면 요소의 맵 정리
            if (elementEvents.size === 0) {
                this._eventHandlers.delete(el);
            }
        });

        return this;
    },

    /**
     * 부모 요소에 이벤트를 위임하여 동적으로 추가된 자식 요소에도 이벤트가 적용되도록 합니다.
     * 핸들러 내부의 `this`는 이벤트가 발생한 자식 요소를 가리킵니다.
     *
     * @param {HTMLElement|string} parentElement - 이벤트를 위임할 부모 요소 또는 선택자
     * @param {string} selector - 이벤트를 적용할 자식 요소의 CSS 선택자
     * @param {string} eventType - 이벤트 유형 ('click', 'scroll' 등)
     * @param {Function} handler - 이벤트 핸들러 함수 (this: 매칭된 자식 요소, 첫 번째 인자: 이벤트 객체)
     * @returns {typeof dom} 메서드 체이닝을 위한 dom 객체
     * @example
     * // 동적으로 추가되는 버튼에 이벤트 위임
     * dom.delegateEvent('#container', '.dynamic-button', 'click', function(e) {
     *   // this는 .dynamic-button 요소를 가리킴
     *   console.log('동적 버튼 클릭됨:', this);
     * });
     *
     * // 나중에 동적으로 요소 추가
     * const newButton = document.createElement('button');
     * newButton.className = 'dynamic-button';
     * newButton.textContent = '동적 버튼';
     * document.getElementById('container').appendChild(newButton);
     * // 위임된 이벤트가 자동으로 적용됨
     */
    delegateEvent: function(parentElement, selector, eventType, handler) {
        const parentElements = this._getElements(parentElement);
        if (parentElements.length === 0) return;
        
        parentElements.forEach(parent => {
            // 위임된 이벤트 정보 저장 구조 먼저 확인
            if (!this._delegatedHandlers.has(parent)) {
                this._delegatedHandlers.set(parent, new Map());
            }

            const parentDelegated = this._delegatedHandlers.get(parent);

            // 이벤트 타입에 대한 맵 가져오기 또는 생성
            if (!parentDelegated.has(eventType)) {
                parentDelegated.set(eventType, new Map());
            }

            const eventDelegated = parentDelegated.get(eventType);

            // 선택자에 대한 핸들러 배열 가져오기 또는 생성
            if (!eventDelegated.has(selector)) {
                eventDelegated.set(selector, []);
            }

            const handlers = eventDelegated.get(selector);

            // 동일한 핸들러가 이미 존재하는지 확인
            const isDuplicate = handlers.some(h => h.originalHandler.toString() === handler.toString());

            // 중복이 아닌 경우에만 위임 핸들러 추가
            if (!isDuplicate) {
                // 위임 핸들러 생성
                const delegatedHandler = function(event) {
                    // 이벤트가 발생한 요소부터 부모 요소까지 selector와 일치하는지 확인
                    const path = event.composedPath();
                    for (let i = 0; i < path.length; i++) {
                        const element = path[i];
                        // Node.ELEMENT_NODE = 1
                        if (element.nodeType !== 1) continue;

                        // 부모 요소에 도달하면 중단
                        if (element === parent) break;

                        // 선택자와 일치하는지 확인
                        if (element.matches && element.matches(selector)) {
                            // e.target을 실제 매칭된 요소(selector에 해당하는 요소)로 설정
                            Object.defineProperty(event, 'target', {
                                value: element,
                                enumerable: true,
                                configurable: true
                            });

                            // 핸들러 실행 시 this를 이벤트가 발생한 요소로 설정
                            handler.call(element, event);
                            break;
                        }
                    }
                };

                // 핸들러 정보 저장
                handlers.push({
                    originalHandler: handler,
                    delegatedHandler: delegatedHandler,
                });

                // 부모 요소에 이벤트 리스너 추가
                parent.addEventListener(eventType, delegatedHandler);
            }
        });

        return this;
    },

    /**
     * 위임된 이벤트 리스너를 제거합니다.
     *
     * @param {HTMLElement|string} parentElement - 이벤트가 위임된 부모 요소 또는 선택자
     * @param {string} selector - 이벤트가 적용된 자식 요소의 CSS 선택자
     * @param {string} eventType - 이벤트 유형 ('click', 'scroll' 등)
     * @param {Function} [handler] - 제거할 특정 이벤트 핸들러 함수 (생략 시 해당 선택자의 모든 핸들러 제거)
     * @returns {typeof dom} 메서드 체이닝을 위한 dom 객체
     * @example
     * // 특정 핸들러 제거
     * dom.removeDelegatedEvent('#container', '.dynamic-button', 'click', myClickHandler);
     *
     * // 특정 선택자에 대한 모든 클릭 이벤트 제거
     * dom.removeDelegatedEvent('#container', '.dynamic-button', 'click');
     */
    removeDelegatedEvent: function(parentElement, selector, eventType, handler) {
        const parentElements = this._getElements(parentElement);
        
        parentElements.forEach(parent => {
            // 부모 요소에 대한 위임 맵이 없으면 건너뛰기
            if (!this._delegatedHandlers.has(parent)) return;
            
            const parentDelegated = this._delegatedHandlers.get(parent);
            
            // 이벤트 타입에 대한 맵이 없으면 건너뛰기
            if (!parentDelegated.has(eventType)) return;
            
            const eventDelegated = parentDelegated.get(eventType);
            
            // 선택자에 대한 핸들러 배열이 없으면 건너뛰기
            if (!eventDelegated.has(selector)) return;
            
            const handlers = eventDelegated.get(selector);
            
            if (handler) {
                // 특정 핸들러만 제거
                const index = handlers.findIndex(h => h.originalHandler === handler);
                if (index !== -1) {
                    const handlerData = handlers[index];
                    parent.removeEventListener(eventType, handlerData.delegatedHandler);
                    handlers.splice(index, 1);
                }
            } else {
                // 해당 선택자의 모든 핸들러 제거
                handlers.forEach(h => {
                    parent.removeEventListener(eventType, h.delegatedHandler);
                });
                eventDelegated.delete(selector);
            }
            
            // 선택자가 없으면 이벤트 타입 맵 정리
            if (eventDelegated.size === 0) {
                parentDelegated.delete(eventType);
            }
            
            // 이벤트 타입이 없으면 부모 요소의 맵 정리
            if (parentDelegated.size === 0) {
                this._delegatedHandlers.delete(parent);
            }
        });

        return this;
    },

    /**
     * 요소의 내용에서 한글만 남기고 나머지는 제거합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @example
     * // ID로 단일 요소 처리
     * dom.filterKorean('#username');
     * 
     * // 클래스로 여러 요소 처리
     * dom.filterKorean('.korean-text');
     * 
     * // CSS 선택자로 요소 처리
     * dom.filterKorean('form input[type="text"]');
     */
    filterKorean: function(elements) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            const text = el.textContent || el.value || '';
            // 한글 정규식: 완성형 한글 (가-힣) 및 자음/모음(ㄱ-ㅎ, ㅏ-ㅣ)
            const koreanRegex = /[가-힣ㄱ-ㅎㅏ-ㅣ]/g;
            const filteredText = text.match(koreanRegex)?.join('') || '';
            
            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },
    
    /**
     * 요소의 내용에서 영문만 남기고 나머지는 제거합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @example
     * // ID로 단일 요소 처리
     * dom.filterEnglish('#username');
     * 
     * // 클래스로 여러 요소 처리
     * dom.filterEnglish('.english-text');
     * 
     * // CSS 선택자로 요소 처리
     * dom.filterEnglish('form input[type="text"]');
     */
    filterEnglish: function(elements) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            const text = el.textContent || el.value || '';
            // 영문 정규식: 영문 대소문자 (A-Za-z)
            const englishRegex = /[A-Za-z]/g;
            const filteredText = text.match(englishRegex)?.join('') || '';
            
            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },
    
    /**
     * 요소의 내용에서 숫자만 남기고 나머지는 제거합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @example
     * // ID로 단일 요소 처리
     * dom.filterNumber('#price');
     * 
     * // 클래스로 여러 요소 처리
     * dom.filterNumber('.numeric-value');
     * 
     * // CSS 선택자로 요소 처리
     * dom.filterNumber('form input[type="number"]');
     */
    filterNumber: function(elements) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            const text = el.textContent || el.value || '';
            // 숫자 정규식: 0-9
            const numericRegex = /[0-9]/g;
            const filteredText = text.match(numericRegex)?.join('') || '';
            
            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },
    
    /**
     * 요소의 내용에서 영문과 숫자만 남기고 나머지는 제거합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @example
     * // ID로 단일 요소 처리
     * dom.filterEnglishNumber('#username');
     * 
     * // 클래스로 여러 요소 처리
     * dom.filterEnglishNumber('.alphanumeric-text');
     * 
     * // CSS 선택자로 요소 처리
     * dom.filterEnglishNumber('form input[type="text"]');
     */
    filterEnglishNumber: function(elements) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            const text = el.textContent || el.value || '';
            // 영문과 숫자 정규식: 영문 대소문자 (A-Za-z)와 숫자 (0-9)
            const alphanumericRegex = /[A-Za-z0-9]/g;
            const filteredText = text.match(alphanumericRegex)?.join('') || '';
            
            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },
    
    /**
     * 요소의 내용에서 영문, 숫자, 특수문자만 남기고 나머지는 제거합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @example
     * // ID로 단일 요소 처리 (모든 기본 특수 문자 허용)
     * dom.filterEnglishNumberSpecial('#password');
     * 
     * // 클래스로 여러 요소 처리 (모든 기본 특수 문자 허용)
     * dom.filterEnglishNumberSpecial('.password-field');
     */
    filterEnglishNumberSpecial: function(elements) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            const text = el.textContent || el.value || '';

            // 공백 허용 여부에 따라 정규식 패턴 조정
            const regexPattern = new RegExp(`[A-Za-z0-9!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>/?]`, 'g');
            const filteredText = text.match(regexPattern)?.join('') || '';
            
            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },

    /**
     * 요소의 내용에서 지정된 특수문자를 제외하고 나머지는 제거합니다.
     * 일반 문자(영문, 숫자, 한글)는 항상 허용됩니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @param {string} excludeChars - 제외할 특수문자 문자열 (예: '!@#')
     * @example
     * // ID로 단일 요소 처리 (!, @, # 제외, 다른 특수문자는 허용)
     * dom.filterExcludeSpecial('#username', '!@#');
     *
     * // 클래스로 여러 요소 처리 (-, _ 제외)
     * dom.filterExcludeSpecial('.text-input', '-_');
     *
     * // CSS 선택자로 요소 처리
     * dom.filterExcludeSpecial('form input[type="text"]', '()[]');
     */

    filterExcludeSpecial: function (elements, excludeChars = '') {
        const domElements = this._getElements(elements);

        domElements.forEach(el => {
            const text = el.textContent || el.value || '';

            // 문자열의 각 문자를 정규식 이스케이프 처리
            const charsToExclude = typeof excludeChars === 'string' ? excludeChars : '';
            const escapedChars = charsToExclude.split('').map(char => {
                // 정규식 특수문자 이스케이프
                return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join('');

            // 제외할 특수문자를 제거 (일반 문자와 허용된 특수문자는 유지)
            const pattern = new RegExp(`[${escapedChars}]`, 'g');
            const filteredText = text.replace(pattern, '');

            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },

    /**
     * 요소의 내용에서 지정된 특수문자만 허용하고 나머지는 제거합니다.
     * 일반 문자(영문, 숫자, 한글)는 항상 허용됩니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @param {string} allowChars - 허용할 특수문자 문자열 (예: '!@#')
     * @example
     * // ID로 단일 요소 처리 (!, @, #과 일반 문자 허용)
     * dom.filterAllowSpecial('#username', '!@#');
     *
     * // 클래스로 여러 요소 처리 (-, _ 과 일반 문자 허용)
     * dom.filterAllowSpecial('.text-input', '-_');
     *
     * // CSS 선택자로 요소 처리 (괄호와 일반 문자 허용)
     * dom.filterAllowSpecial('form input[type="text"]', '()[]');
     */
    filterAllowSpecial: function(elements, allowChars = '') {
        const domElements = this._getElements(elements);

        domElements.forEach(el => {
            const text = el.textContent || el.value || '';

            // 문자열의 각 문자를 정규식 이스케이프 처리
            const charsToAllow = typeof allowChars === 'string' ? allowChars : '';
            const escapedChars = charsToAllow.split('').map(char => {
                // 정규식 특수문자 이스케이프
                return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join('');

            // 일반 문자(영문, 숫자, 한글, 공백)와 허용된 특수문자만 남김
            const pattern = new RegExp(`[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\\s${escapedChars}]`, 'g');
            const filteredText = text.replace(pattern, '');

            // 입력 요소인지 확인하고 적절한 속성 업데이트
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                el.value = filteredText;
            } else {
                el.textContent = filteredText;
            }
        });
    },

    /**
     * 요소의 내용의 길이를 제한합니다.
     * @param {HTMLElement|HTMLCollection|NodeList|Array|string} elements - 처리할 요소(들) 또는 선택자
     * @param {number} maxLength - 최대 문자 길이
     * @example
     * // ID로 단일 요소 처리 (최대 10자로 제한)
     * dom.limitLength('#username', 10);
     * 
     * // 클래스로 여러 요소 처리 (최대 20자로 제한)
     * dom.limitLength('.text-input', 20);
     * 
     * // CSS 선택자로 요소 처리 (최대 30자로 제한)
     * dom.limitLength('form input[type="text"]', 30);
     */
    limitLength: function(elements, maxLength) {
        const domElements = this._getElements(elements);
        
        domElements.forEach(el => {
            const text = el.textContent || el.value || '';
            
            // 최대 길이 제한 적용
            if (maxLength && typeof maxLength === 'number' && maxLength > 0) {
                const limitedText = text.substring(0, maxLength);
                
                // 입력 요소인지 확인하고 적절한 속성 업데이트
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                    el.value = limitedText;
                } else {
                    el.textContent = limitedText;
                }
            }
        });
    }
};

export default dom;