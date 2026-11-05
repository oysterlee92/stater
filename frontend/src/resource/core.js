import {debounce, throttle} from 'lodash';

import oyster from '@/resource/lib/oyster.js';
import rules from '@/resource/rules.js';
import messages from "@/resource/messages.js";


/**
 * Oyster 라이브러리의 초기화 상태를 나타냅니다.
 * false: 초기화 전, true: 초기화 완료
 *
 * @type {boolean}
 */
oyster.is = false;

/** Oyster에서 공통으로 사용하는 검증 메시지를 보관합니다. */
oyster.messages = messages;

/**
 * HTTP 요청을 보내고 응답 또는 오류 콜백을 처리합니다.
 * @param {{url: string, method?: string, type?: string, data?: *, isLoading?: boolean}} request 요청 설정
 * @param {Function} [callback] 성공 응답 처리 함수
 * @param {Function} [failback] 인증 오류 이외의 실패 처리 함수
 * @returns {Promise<*>} 서버 응답 또는 콜백 결과
 */
oyster.request = ({url, method = 'post', type, data, isLoading = false}, callback, failback) => {
    const _csrfHeaderName
        = document.querySelector('meta[name="_csrf_headerName"]').getAttribute('content');
    const _csrfToken
        = document.querySelector('meta[name="_csrf_token"]').getAttribute('content');
    const options = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    if (_csrfHeaderName && _csrfToken) {
        options.headers[_csrfHeaderName] = _csrfToken;
    }

    let response;

    // 타입이 있을때 (html, file)
    if (type) {
        options['type'] = type.toLowerCase();
        if (type === 'html') {
            options.headers['Accept'] = 'text/html';
            response = oyster.http.get(url, data, options);
        }

        if (type === 'file') {
            response = oyster.http.post(url, data, options);
        }
    } else {
        method = method.toLowerCase();
        response = oyster.http[method](url, data, options);
    }

    // 로딩바 여부
    if (isLoading) {
        // 로딩바 노출
        oyster.loading().show();
    }

    return response
        .then(success => {
            // 콜백 처리
            if (callback instanceof Function) {
                const result = callback(success.response);
                if (result instanceof Promise) {
                    return result;
                }
            }

            return Promise.resolve(success.response);
        })
        .catch(error => {
            // 에러 처리
            oyster.debug.error('에러 발생 :', error);
            if (error.status && (error.status === 401 || error.status === 403)) {
                if (error.response.message) {
                    alert(error.response.message);
                }

                if (error.status === 401) {
                    location.href = '/';
                } else {
                    location.reload();
                }
            } else {
                if (failback instanceof Function) {
                    const result = failback(error.response);
                    if (result instanceof Promise) {
                        return result;
                    }
                } else {
                    if (error.response.message) {
                        alert(error.response.message);
                    }
                }
                return Promise.reject(error.response);
            }
        })
        .finally(() => {
            if (isLoading) {
                // 로딩바 hide
                oyster.loading().hide();
            }
        });
};

/**
 * 여러 GET 요청을 실행하고 전체 성공 또는 일부 실패 결과를 처리합니다.
 * @param {Array<Object>} requests GET 요청 설정 목록
 * @param {boolean} [isLoading=false] 요청 동안 로딩 표시 여부
 * @param {Function} [callback] 모든 요청 성공 시 실행할 함수
 * @param {Function} [failback] 하나 이상의 요청 실패 시 실행할 함수
 * @returns {Promise<Array<Object>>} 각 요청의 성공 또는 실패 결과
 */
oyster.allGet = (requests, isLoading = false, callback, failback) => {
    const _csrfHeaderName
        = document.querySelector('meta[name="_csrf_headerName"]').getAttribute('content');
    const _csrfToken
        = document.querySelector('meta[name="_csrf_token"]').getAttribute('content');

    // 각 요청에 옵션 설정
    requests.forEach(request => {
        const options = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        if (_csrfHeaderName && _csrfToken) {
            options.headers[_csrfHeaderName] = _csrfToken;
        }

        // HTML 타입 요청인 경우
        if (request.type && request.type === 'html') {
            options.headers['Accept'] = 'text/html';
        }

        request['method'] = 'GET';
        request['options'] = options;
    });

    // 로딩바 표시
    if (isLoading) {
        oyster.loading().show();
    }

    // 모든 요청 실행
    return oyster.http.allSettled(requests)
        .then(results => {
            // 401 또는 403 에러가 있는지 확인
            const authError = results.find(result =>
                result.status === 'rejected' &&
                result.reason &&
                result.reason.status &&
                (result.reason.status === 401 || result.reason.status === 403)
            );

            // 인증 에러가 있으면 리다이렉트
            if (authError) {
                const reason = authError[0].reason;
                if (reason.response.message) {
                    alert(reason.response.message);
                }

                if (reason.status === 401) {
                    location.href = '/';
                } else {
                    location.reload();
                }
            }

            // 모든 요청이 성공했는지 확인
            const allFulfilled = results.every(result => result.status === 'fulfilled');
            const hasRejected = results.some(result => result.status === 'rejected');

            // 콜백 처리
            if (allFulfilled && callback instanceof Function) {
                const successResults = results.map(result => result.value.response);
                const callbackResult = callback(successResults);
                if (callbackResult instanceof Promise) {
                    return callbackResult;
                }
            } else if (hasRejected && failback instanceof Function) {
                const failbackResult = failback(results);
                if (failbackResult instanceof Promise) {
                    return failbackResult;
                }
            }

            return Promise.resolve(results);
        })
        .catch(error => {
            oyster.debug.error('에러 발생:', error);
            return Promise.reject(error);
        })
        .finally(() => {
            if (isLoading) {
                oyster.loading().hide();
            }
        });
};

/** 지정한 폼에 프로젝트 기본 검증 규칙을 연결합니다.
 * @param {string} formId 검증할 폼의 DOM id
 * @param {Object} [options={}] 검증기 설정
 * @returns {FormValidator} 생성된 폼 검증기
 */
oyster.formValidator = (formId, options = {}) => {
    options.display = options.display || 'message';

    const formValidator = new oyster.FormValidator(formId, options);
    formValidator.addRules(rules);

    return formValidator;
};

/** 지정한 컨테이너에 페이지 번호 기반 페이지네이션을 생성합니다.
 * @param {string} containerId 컨테이너 DOM id
 * @param {Object} [options={}] 페이지네이션 설정
 * @returns {Pagination} 생성된 페이지네이션
 */
oyster.pagination = (containerId, options = {}) => {
    if (options.itemsPerPage === 'undefined') {
        options.itemsPerPage = 5
    }

    return new oyster.Pagination(containerId, options);
};

/** 지정한 컨테이너에 스크롤 기반 페이지네이션을 생성합니다.
 * @param {string} containerId 컨테이너 DOM id
 * @param {Object} [options={}] 스크롤 페이지네이션 설정
 * @returns {ScrollPagination} 생성된 스크롤 페이지네이션
 */
oyster.scrollPagination = (containerId, options = {}) => {
    if (typeof options.itemsPerPage === 'undefined') {
        options.itemsPerPage = 5;
    }

    return new oyster.ScrollPagination(containerId, options);
};

/** 지정한 컨테이너에 캐러셀을 생성합니다.
 * @param {string} containerId 컨테이너 DOM id
 * @param {Object} [options={}] 캐러셀 설정
 * @returns {Carousel} 생성된 캐러셀
 */
oyster.carousel = (containerId, options = {}) => {
    return new oyster.Carousel(containerId, options);
};

/** 파일 입력 컨테이너에 업로더를 연결합니다.
 * @param {string} containerId 컨테이너 DOM id
 * @param {Object} [options={}] 업로더 설정
 * @returns {FileUploader} 생성된 업로더
 */
oyster.fileUploader = (containerId, options = {}) => {
    if (typeof options.fileLoadUrl === 'undefined') {
        options.fileLoadUrl = "/api/files/load";
    }

    return new oyster.FileUploader(containerId, options);
};

/** 버튼과 파일 입력 컨테이너를 연결하는 업로더를 생성합니다.
 * @param {string} buttonId 업로드 버튼 DOM id
 * @param {string} containerId 파일 컨테이너 DOM id
 * @param {Object} [options={}] 업로더 설정
 * @returns {ButtonFileUploader} 생성된 업로더
 */
oyster.buttonFileUploader = (buttonId, containerId, options = {}) => {
    if (typeof options.fileLoadUrl === 'undefined') {
        options.fileLoadUrl = "/api/files/load";
    }

    return new oyster.ButtonFileUploader(buttonId, containerId, options);
};

/** 지정한 지연 시간 동안 호출이 멈춘 뒤 핸들러를 실행하는 함수를 반환합니다.
 * @param {Function} handler 실행할 함수
 * @param {number} [delay=300] 지연 시간(ms)
 * @param {Object} [options={}] debounce 설정
 * @returns {Function} 지연 실행 함수
 */
oyster.debounce = (handler, delay = 300, options = {}) => {
    return debounce(handler, delay, options);
};

/** 지정한 간격보다 자주 실행되지 않도록 핸들러를 제한한 함수를 반환합니다.
 * @param {Function} handler 실행할 함수
 * @param {number} [delay=300] 실행 간격(ms)
 * @param {Object} [options={}] throttle 설정
 * @returns {Function} 실행 간격이 제한된 함수
 */
oyster.throttle = (handler, delay = 300, options = {}) => {
    return throttle(handler, delay, options);
};

/** 현재 열려 있는 팝업 뷰를 열린 순서대로 보관합니다. */
oyster.popupQueue = [];

/**
 * 팝업 뷰를 생성하고 열기·닫기 애니메이션 및 스크롤 보정을 연결합니다.
 * @param {string} containerId 팝업 콘텐츠 컨테이너 DOM id
 * @param {Object} [options={}] PopupView와 크기 조정 핸들러 설정
 * @returns {PopupView} 생성된 팝업 뷰
 */
oyster.popupView = (containerId, options) => {
    let view = null;

    options = {
        onShow: async () => {
            const isFirstPopup = oyster.popupQueue.length === 0;
            oyster.popupQueue.push(view);
            if (isFirstPopup) {
                // 스크롤바가 사라질 때 화면 폭이 변하지 않도록 첫 팝업에서만 보정합니다.
                document.body.style.setProperty('--popup-scrollbar-width', `${window.innerWidth - document.documentElement.clientWidth}px`);
                document.body.classList.add('popup-scroll-locked');
            }

            view.container.parentElement.classList.add('popup-open');
            await waitForPopupAnimation();
            options.resizeHandler();

            oyster.debug.info(`${view.containerId} onShow`);
        },
        onHide: async () => {
            const popupContainer = view.container.parentElement;
            popupContainer.classList.add('popup-closing');
            await waitForPopupAnimation();
            popupContainer.classList.remove('popup-open', 'popup-closing');
            const popupIndex = oyster.popupQueue.indexOf(view);
            if (popupIndex !== -1) {
                oyster.popupQueue.splice(popupIndex, 1);
            }
            if (oyster.popupQueue.length === 0) {
                document.body.classList.remove('popup-scroll-locked');
                document.body.style.removeProperty('--popup-scrollbar-width');
            }
            options.resizeHandler();

            oyster.debug.info(`${view.containerId} onHide`);
        },
        resizeHandler: () => {

        },
        ...options
    }

    return view = new oyster.PopupView(containerId, options);
};

/** SCSS에 정의한 220ms 팝업 전환이 끝날 때까지 기다립니다.
 * @returns {Promise<void>} 전환 시간 경과 후 완료되는 Promise
 */
const waitForPopupAnimation = () => new Promise(resolve => window.setTimeout(resolve, 220));

/** 모듈 뷰를 생성하고 마운트 시 크기를 조정합니다.
 * @param {string} containerId 모듈 컨테이너 DOM id
 * @param {Object} [options={}] 모듈 뷰 설정
 * @returns {ModuleView} 생성된 모듈 뷰
 */
oyster.moduleView = (containerId, options) => {
    let view = null;

    options = {
        onMount: () => {
            view.resizeHandler();
            view.container.parentElement.classList.remove('template');

            oyster.debug.info(`${view.containerId} onMount`);
        },
        resizeHandler: () => {
        },
        ...options
    }

    return view = new oyster.ModuleView(containerId, options);
};

/** 페이지 뷰를 생성하고 렌더링·로딩 완료 시 크기를 조정합니다.
 * @param {string} containerId 페이지 컨테이너 DOM id
 * @param {Object} [options={}] 페이지 뷰 설정
 * @returns {PageView} 생성된 페이지 뷰
 */
oyster.pageView = (containerId, options) => {
    let view = null;

    options = {
        onRender: () => {
            if (!(view.onLoad instanceof Function)) {
                view.resizeHandler();
                view.container.parentElement.classList.remove('template')

                oyster.debug.info(`${view.containerId} onRender`);
            }
        },
        onLoader: () => {
            view.resizeHandler();
            view.container.parentElement.classList.remove('template')

            oyster.debug.info(`${view.containerId} onLoader`);
        },
        resizeHandler: () => {
        },
        ...options
    }

    return view = new oyster.PageView(containerId, options);
};

// 전역 객체에 Oyster 인스턴스를 한 번만 노출합니다.
if (typeof window.oyster === 'undefined') {
    Object.defineProperty(window, 'oyster', {
        value: oyster,
        writable: false,
        enumerable: true,
        configurable: false
    });
}

oyster.is = true;
oyster.debug.info('oyster is Started!!!');

// 초기화가 끝난 API를 읽기 전용으로 고정해 런타임 덮어쓰기를 방지합니다.
Object.keys(oyster).forEach(key => {
    const value = oyster[key];
    Object.defineProperty(oyster, key, {
        value: value,
        writable: false,
        enumerable: true,
        configurable: false
    });
});


