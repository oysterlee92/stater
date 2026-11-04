import { debounce, throttle } from 'lodash';

import oyster from '@/resource/lib/oyster.js';
import rules from '@/resource/rules.js';
import messages from "@/resource/messages.js";

import bootstrap from '/bootstrap/dist/js/bootstrap.bundle.min.js';



/**
 * Oyster 라이브러리의 초기화 상태를 나타냅니다.
 * false: 초기화 전, true: 초기화 완료
 *
 * @type {boolean}
 */
oyster.is = false;

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

oyster.formValidator = (formId, options = {}) => {
    options.display = options.display || 'message';

    const formValidator = new oyster.FormValidator(formId, options);
    formValidator.addRules(rules);

    return formValidator;
};


