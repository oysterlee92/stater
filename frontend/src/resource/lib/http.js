/**
 * HTTP Communication Utility Module
 * 
 * HTTP 요청을 간편하게 처리하기 위한 유틸리티 모듈입니다.
 * Fetch API를 기반으로 하며 다음 기능을 제공합니다:
 * 
 * 주요 기능:
 * - RESTful API 메서드 지원 (GET, POST, PUT, PATCH, DELETE)
 * - 자동 데이터 변환 (FormData → Object → JSON)
 * - 중복 요청 방지
 * - 자동 응답 파싱 (JSON, Text, Blob)
 * - 병렬 요청 처리 (allSettled)
 * - 파일 업로드 지원 (multipart/form-data)
 * 
 * 데이터 처리 규칙:
 * - GET/DELETE: FormData를 객체로 변환 후 쿼리 파라미터로 전송
 * - POST/PUT/PATCH: FormData를 객체로 변환 후 JSON으로 전송
 *   (type='file'인 경우 multipart/form-data로 전송)
 * 
 * @module http
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API|Fetch API Documentation}
 * 
 * @example
 * // GET 요청
 * http.get('/api/users', { page: 1, limit: 10 })
 *   .then(({ response }) => console.log(response))
 *   .catch(error => console.error(error));
 * 
 * @example
 * // POST 요청 (JSON)
 * http.post('/api/users', { name: 'John', age: 30 })
 *   .then(({ response }) => console.log(response));
 * 
 * @example
 * // 파일 업로드
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * http.post('/api/upload', formData, { type: 'file' })
 *   .then(({ response }) => console.log(response));
 * 
 * @example
 * // 병렬 요청 처리
 * http.allSettled([
 *   { method: 'GET', url: '/api/users' },
 *   { method: 'GET', url: '/api/posts' }
 * ]).then(results => {
 *   results.forEach((result, index) => {
 *     if (result.status === 'fulfilled') {
 *       console.log(`요청 ${index} 성공:`, result.value);
 *     }
 *   });
 * });
 */

/**
 * HTTP 요청 옵션 타입입니다.
 * @typedef {Object} HttpOptions
 * @property {string} [method] - HTTP 메서드 (GET, POST, PUT, PATCH, DELETE 등)
 * @property {*} [body] - 요청 본문 데이터
 * @property {Object} [headers] - 요청 헤더 객체
 * @property {string} [type] - 요청 타입 ('file'인 경우 multipart/form-data로 전송)
 * @property {string} [credentials] - 자격 증명 모드 ('same-origin', 'include', 'omit')
 * @property {string} [mode] - CORS 모드 ('cors', 'no-cors', 'same-origin')
 * @property {string} [cache] - 캐시 모드
 * @property {string} [redirect] - 리다이렉트 모드
 */

/**
 * HTTP 응답 객체 타입입니다.
 * @typedef {Object} HttpResponse
 * @property {boolean} ok - 요청 성공 여부 (status 200-299)
 * @property {number} status - HTTP 상태 코드
 * @property {Headers} headers - 응답 헤더 객체
 * @property {*} response - 파싱된 응답 데이터 (JSON, 텍스트, Blob 등)
 */

/**
 * HTTP 에러 객체 타입입니다.
 * @typedef {Object} HttpError
 * @property {boolean} ok - 항상 false
 * @property {number} status - HTTP 상태 코드
 * @property {Headers} headers - 응답 헤더 객체
 * @property {*} response - 파싱된 에러 응답 데이터
 */

/**
 * allSettled 메소드에서 사용하는 요청 객체 타입입니다.
 * @typedef {Object} RequestObject
 * @property {string} method - HTTP 메서드 (기본값: 'GET')
 * @property {string} url - 요청할 URL
 * @property {Object|FormData} [data] - 요청 데이터
 * @property {HttpOptions} [options] - 추가 요청 옵션
 */

/**
 * HTTP 통신을 위한 유틸리티 객체입니다.
 * @namespace http
 */
const http = {
    /**
     * FormData 객체를 일반 JavaScript 객체로 변환합니다.
     * @param {FormData} formData - 변환할 FormData 객체
     * @returns {Object} 변환된 JavaScript 객체
     */
    formDataToObject: function(formData) {
        // formData가 FormData, HTMLFormElement가 아닌 일반 객체일 경우 그대로 반환
        if (formData
            && typeof formData === 'object'
            && !(formData instanceof FormData)
            && !(formData instanceof HTMLFormElement)) {
            return formData;
        }

        let fd;
        if (formData instanceof HTMLFormElement) {
            fd = new FormData(formData);
        } else if (formData instanceof FormData) {
            fd = formData;
        } else {
            // 지원하지 않는 타입이거나 formData가 없는 경우 빈 객체 반환
            return {};
        }

        const obj = {};
        for (const [key, value] of fd.entries()) {
            // 이미 키가 존재하면 배열로 만들어 값을 추가
            if (obj[key] !== undefined) {
                if (!Array.isArray(obj[key])) {
                    obj[key] = [obj[key]];
                }
                obj[key].push(value);
            } else {
                obj[key] = value;
            }
        }
        return obj;
    },

    /**
     * 객체를 URL 쿼리 문자열로 변환합니다.
     * @param {Object} params - 쿼리 파라미터 객체
     * @returns {string} URL 인코딩된 쿼리 문자열
     */
    buildQueryString: function(params) {
        return Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== null)
            .map(key => {
                const value = params[key];
                const encodedKey = encodeURIComponent(key);

                if (Array.isArray(value)) {
                    // 배열 파라미터 처리 (예: ?ids=1&ids=2)
                    return value.map(item => `${encodedKey}=${encodeURIComponent(item)}`).join('&');
                } else {
                    return `${encodedKey}=${encodeURIComponent(value)}`;
                }
            })
            .join('&');
    },

    /**
     * 요청이 중복인지 확인하고 요청 맵에 추가합니다.
     * @private
     * @param {string} url - 요청 URL
     * @param {string} method - HTTP 메서드
     * @throws {string} 중복 요청인 경우 에러 메시지
     */
    _checkAndAddRequest: function(url, method) {
        // 이전 요청과 URL, method가 동일한 경우 요청을 보내지 않고 에러를 발생시킵니다.
        if (this._requestMap.has(url)) {
            const methods = this._requestMap.get(url);
            // 배열에 동일한 method 있는지 확인
            if (methods.includes(method)) {
                return false; // 중복 요청임을 반환
            }
        } else {
            // 키가 없으면 새 배열 생성
            this._requestMap.set(url, []);
        }

        // 현재 요청을 배열에 추가
        this._requestMap.get(url).push(method);

        return true; // 정상 요청임을 반환
    },

    /**
     * 요청 맵에서 특정 method를 제거합니다.
     * @private
     * @param {string} url - 요청 URL
     * @param {string} method - 제거할 요청 method
     */
    _removeRequestMethod: function(url, method) {
        if (this._requestMap.has(url)) {
            const methods = this._requestMap.get(url);
            const index = methods.indexOf(method);
            if (index !== -1) {
                methods.splice(index, 1);
            }

            // 배열이 비어있으면 Map에서 키 제거
            if (methods.length === 0) {
                this._requestMap.delete(url);
            }
        }
    },

    /**
     * 응답 데이터를 파싱합니다.
     * @private
     * @param {Response} response - fetch API 응답 객체
     * @returns {Promise<Object|string>} 파싱된 응답 데이터
     */
    _parseResponse: async function(response) {
        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType.includes('text/')) {
            return await response.text();
        } else {
            // 바이너리 데이터 등 다른 형식의 응답은 blob으로 처리
            return await response.blob();
        }
    },

    /**
     * 요청 데이터를 Content-Type에 따라 적절한 형태로 변환합니다.
     * options.type이 'file'인 경우 FormData 객체로 변환하고,
     * 그 외에는 일반 객체로 변환합니다.
     * @private
     * @param {Object|FormData|HTMLFormElement} data - 변환할 데이터
     * @param {HttpOptions} options - 요청 옵션 (type 속성 확인)
     * @returns {FormData|Object} 변환된 데이터 (type이 'file'이면 FormData, 아니면 Object)
     */
    _prepareRequestData: function(data, options) {
        const isMultipart = options.type === 'file';

        if (isMultipart) {
            if (data instanceof FormData) {
                return data;
            }
            if (data instanceof HTMLFormElement) {
                return new FormData(data);
            }
            if (data && typeof data === 'object') {
                const formData = new FormData();
                Object.entries(data).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(item => formData.append(key, item));
                    } else {
                        formData.append(key, value);
                    }
                });
                return formData;
            }
        }

        return this.formDataToObject(data);
    },

    /**
     * 요청 정보를 저장하여 중복 요청을 방지합니다.
     * @private
     * @type {Map}
     */
    _requestMap: new Map(),

    /**
     * 기본 요청 헤더입니다.
     * @private
     * @type {Object}
     */
    _defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },

    /**
     * 기본 요청 옵션입니다.
     * @private
     * @type {Object}
     */
    _defaultOptions: {
        credentials: 'same-origin', // 쿠키를 포함한 요청을 위해
        mode: 'cors',               // CORS 지원
        cache: 'default',           // 기본 캐시 정책 사용
        redirect: 'follow'          // 리다이렉트 자동 처리
    },

    /**
     * HTTP 요청을 보냅니다.
     * @param {string} url - 요청할 URL
     * @param {HttpOptions} [options={}] - fetch API 옵션
     * @returns {Promise<HttpResponse>} 응답 데이터를 포함한 Promise (실패 시 HttpError를 reject)
     * @throws {HttpError} HTTP 오류가 발생한 경우
     * @throws {Error} 네트워크 오류나 중복 요청인 경우
     */
    request: async function(url, options = {}) {
        const { method = 'GET', body } = options;

        // 중복 요청 확인 및 추가
        if (!this._checkAndAddRequest(url, method)) {
            return Promise.reject(new Error('동일한 요청이 감지되어 취소되었습니다.'));
        }

        try {
            // 기본 옵션과 사용자 옵션 병합
            const mergedOptions = {
                ...this._defaultOptions,
                ...options,
                headers: options.headers && Object.keys(options.headers).length === 0 ?
                    // 빈 객체가 명시적으로 전달된 경우 기본 헤더를 적용하지 않음
                    {} : {
                        ...this._defaultHeaders,
                        ...(options.headers || {})
                    }
            };
            
            // type이 file인경우 header Content-Type 제거
            if (options && options.type === 'file') {
                delete mergedOptions.headers['Content-Type']
            }
            
            // body 데이터가 있고 FormData나 문자열이 아닌 경우 Content-Type에 따라 변환
            if (body
                    && typeof body === 'object'
                    && !(body instanceof FormData)
                    && !(body instanceof Blob)
                    && !(typeof body === 'string')) {
                const contentType = mergedOptions.headers['Content-Type'] || '';
                
                // Content-Type에 따라 body 데이터 변환
                if (contentType.includes('application/json')) {
                    // JSON으로 변환
                    mergedOptions.body = JSON.stringify(body);
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    // URL 인코딩된 폼 데이터로 변환
                    mergedOptions.body = this.buildQueryString(body);
                }
                // 다른 Content-Type은 그대로 사용 (multipart/form-data 등)
            }

            // fetch API를 사용하여 요청 보내기
            const response = await fetch(url, mergedOptions);

            // 응답 데이터 파싱
            const parseResponse = await this._parseResponse(response);

            // 배열에서 해당 method 제거
            this._removeRequestMethod(url, method);

            if (!response.ok) {
                const error = {
                    ok: false,
                    status: response.status,
                    headers: response.headers,
                    response: parseResponse
                };

                return Promise.reject(error);
            }

            return {
                ok: response.ok,
                status: response.status,
                headers: response.headers,
                response: parseResponse
            };
        } catch (error) {
            // 에러 발생 시에도 배열에서 해당 method 제거
            this._removeRequestMethod(url, method);
            throw error;
        }
    },

    /**
     * GET 요청을 보냅니다.
     * @param {string} url - 요청할 URL
     * @param {Object|FormData|HTMLFormElement} [params={}] - URL 쿼리 파라미터 (FormData나 HTMLFormElement가 전달되면 자동으로 객체로 변환됩니다)
     * @param {HttpOptions} [options={}] - 추가 요청 옵션
     * @returns {Promise<HttpResponse>} 응답 데이터를 포함한 Promise
     */
    get: function(url, params = {}, options = {}) {
        // FormData를 객체로 변환
        const processedParams = this.formDataToObject(params);

        // URL 쿼리 파라미터 추가
        const queryString = this.buildQueryString(processedParams);
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        return this.request(fullUrl, {
            method: 'GET',
            ...options
        });
    },

    /**
     * POST 요청을 보냅니다.
     * @param {string} url - 요청할 URL
     * @param {Object|FormData|HTMLFormElement} [data={}] - 요청 본문 데이터 (FormData나 HTMLFormElement가 전달되면 자동으로 객체로 변환됩니다)
     * @param {HttpOptions} [options={}] - 추가 요청 옵션 (options.type을 'file'로 설정하면 multipart/form-data로 전송)
     * @returns {Promise<HttpResponse>} 응답 데이터를 포함한 Promise
     * @example
     * // JSON 전송 (기본)
     * http.post('/api/users', { name: 'John', age: 30 });
     * 
     * // 파일 업로드
     * const formData = new FormData();
     * formData.append('file', fileInput.files[0]);
     * http.post('/api/upload', formData, { type: 'file' });
     */
    post: function(url, data = {}, options = {}) {
        // Content-Type에 따라 데이터 변환
        let processedData = this._prepareRequestData(data, options);

        return this.request(url, {
            method: 'POST',
            body: processedData,
            ...options
        });
    },

    /**
     * PUT 요청을 보냅니다.
     * @param {string} url - 요청할 URL
     * @param {Object|FormData|HTMLFormElement} [data={}] - 요청 본문 데이터 (FormData나 HTMLFormElement가 전달되면 자동으로 객체로 변환됩니다)
     * @param {HttpOptions} [options={}] - 추가 요청 옵션
     * @returns {Promise<HttpResponse>} 응답 데이터를 포함한 Promise
     */
    put: function(url, data = {}, options = {}) {
        // FormData를 객체로 변환
        const processedData = this.formDataToObject(data);

        return this.request(url, {
            method: 'PUT',
            body: processedData,
            ...options
        });
    },

    /**
     * PATCH 요청을 보냅니다.
     * @param {string} url - 요청할 URL
     * @param {Object|FormData|HTMLFormElement} [data={}] - 요청 본문 데이터 (FormData나 HTMLFormElement가 전달되면 자동으로 객체로 변환됩니다)
     * @param {HttpOptions} [options={}] - 추가 요청 옵션
     * @returns {Promise<HttpResponse>} 응답 데이터를 포함한 Promise
     */
    patch: function(url, data = {}, options = {}) {
        // FormData를 객체로 변환
        const processedData = this.formDataToObject(data);

        return this.request(url, {
            method: 'PATCH',
            body: processedData,
            ...options
        });
    },

    /**
     * DELETE 요청을 보냅니다.
     * @param {string} url - 요청할 URL
     * @param {Object|FormData|HTMLFormElement} [params={}] - URL 쿼리 파라미터 (FormData나 HTMLFormElement가 전달되면 자동으로 객체로 변환됩니다)
     * @param {HttpOptions} [options={}] - 추가 요청 옵션
     * @returns {Promise<HttpResponse>} 응답 데이터를 포함한 Promise
     */
    delete: function(url, params = {}, options = {}) {
        // FormData를 객체로 변환
        const processedParams = this.formDataToObject(params);

        // URL 쿼리 파라미터 추가
        const queryString = this.buildQueryString(processedParams);
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        return this.request(fullUrl, {
            method: 'DELETE',
            ...options
        });
    },

    /**
     * 여러 HTTP 요청을 병렬로 처리하고 모든 요청의 결과(성공 또는 실패)를 반환합니다.
     * Promise.allSettled()를 사용하여 일부 요청이 실패해도 모든 요청의 결과를 반환합니다.
     * @param {Array<RequestObject>} [requests=[]] - 요청 객체 배열
     * @returns {Promise<Array<PromiseSettledResult<HttpResponse>>>} 모든 요청의 결과를 포함한 Promise
     * @example
     * const requests = [
     *   { method: 'GET', url: '/api/users', data: { page: 1 } },
     *   { method: 'POST', url: '/api/logs', data: { action: 'view' } }
     * ];
     * const results = await http.allSettled(requests);
     * results.forEach((result, index) => {
     *   if (result.status === 'fulfilled') {
     *     console.log(`요청 ${index} 성공:`, result.value);
     *   } else {
     *     console.error(`요청 ${index} 실패:`, result.reason);
     *   }
     * });
     */
    allSettled: function(requests = []) {
        if (!Array.isArray(requests) || requests.length === 0) {
            return Promise.resolve([]);
        }

        const promises = requests.map(request => {
            const { method = 'GET', url, data = {}, options = {} } = request;

            // 각 요청을 Promise로 변환
            return (() => {
                switch (method.toUpperCase()) {
                    case 'GET':
                        return this.get(url, data, options);
                    case 'POST':
                        return this.post(url, data, options);
                    case 'PUT':
                        return this.put(url, data, options);
                    case 'PATCH':
                        return this.patch(url, data, options);
                    case 'DELETE':
                        return this.delete(url, options);
                    default:
                        return this.request(url, {method, ...options});
                }
            })();
        });

        return Promise.allSettled(promises);
    }
};

export default http;
