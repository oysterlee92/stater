/**
 * 버튼 파일 업로더 모듈 - 버튼 클릭으로 파일 선택하고 뱃지 형태로 표시하는 UI 컴포넌트를 제공합니다.
 * @module buttonFileUploader
 */

/**
 * 버튼 파일 업로더 컴포넌트
 *
 * 버튼을 클릭하여 파일을 선택하고, 선택된 파일들을 뱃지 형태로 표시합니다.
 * 파일 다운로드 및 삭제 기능을 제공합니다. 미리보기는 지원하지 않습니다.
 *
 * @param {string|HTMLElement} buttonId - 파일 선택 트리거가 될 버튼의 ID 또는 HTML 요소
 * @param {string|HTMLElement} containerId - 파일 뱃지들을 표시할 컨테이너의 ID 또는 HTML 요소
 * @param {Object} options - 파일 업로더 설정 옵션
 * @param {number} [options.maxFiles=10] - 최대 업로드 가능한 파일 수
 * @param {number} [options.maxSize=5] - 파일당 최대 크기 (MB 단위)
 * @param {string[]} [options.allowedExtensions=[]] - 허용되는 파일 확장자 배열
 * @param {number|null} [options.fileSeq=null] - 파일 시퀀스 번호 (서버에서 파일 정보 로드 시 사용)
 * @param {string|null} [options.fileLoadUrl=null] - 파일 정보를 로드할 서버 URL
 * @returns {ButtonFileUploader} 버튼 파일 업로더 인스턴스
 * @constructor
 */
export default function ButtonFileUploader(buttonId, containerId, options = {}) {
    this.buttonId = buttonId;
    this.button = buttonId instanceof HTMLElement
        ? buttonId
        : document.getElementById(buttonId);

    this.containerId = containerId;
    this.container = containerId instanceof HTMLElement
        ? containerId
        : document.getElementById(containerId);

    if (!this.button) {
        console.error(`ID가 '${buttonId}'인 버튼을 찾을 수 없습니다.`);
        throw new Error(`Button with ID '${buttonId}' not found.`);
    }

    if (!this.container) {
        console.error(`ID가 '${containerId}'인 컨테이너를 찾을 수 없습니다.`);
        throw new Error(`Container with ID '${containerId}' not found.`);
    }

    // 기본 옵션 설정
    this.options = {
        maxFiles: options.maxFiles || 10,
        maxSize: options.maxSize || 5, // MB 단위
        allowedExtensions: options.allowedExtensions || [],
        fileSeq: options.fileSeq || null,
        fileLoadUrl: options.fileLoadUrl || null,
    };
    
    // 기본 CSS 클래스
    this.classes = Object.assign({
        container: 'oyster-button-file-uploader',
        badge: 'oyster-file-badge',
        serverFile: 'server-file',
        badgeName: 'oyster-file-badge-name',
        badgeSize: 'oyster-file-badge-size',
        badgeRemove: 'oyster-file-badge-remove'
    }, options.classes || {});

    // HTML 데이터 속성에서 옵션 가져오기
    this._initOptionsFromDataAttributes();

    // 파일 상태 초기화
    this.files = [];
    this.deleteFileDetailSeqs = [];
    this.fileInput = null;

    // 컴포넌트 초기화
    this._init();

    // 파일 시퀀스가 있는 경우 서버에서 파일 정보 로드
    if (this.options.fileSeq && this.options.fileLoadUrl) {
        this.loadFilesFromServer();
    } else {
        this._clearAllFiles();
    }
}

/**
 * HTML 데이터 속성에서 옵션 가져오기
 * 컨테이너 요소의 data-* 속성에서 업로더 옵션을 읽어와 설정합니다.
 * 지원하는 데이터 속성: data-max-files, data-max-size, data-allowed-extensions, data-file-seq
 * 
 * @private
 * @returns {void}
 * @example
 * <!-- HTML 예시 -->
 * <div id="fileContainer" 
 *      data-max-files="5" 
 *      data-max-size="10" 
 *      data-allowed-extensions="jpg,png,pdf" 
 *      data-file-seq="123">
 * </div>
 */
ButtonFileUploader.prototype._initOptionsFromDataAttributes = function() {
    if (!this.container) return;

    const dataMaxFiles = this.container.dataset.maxFiles;
    const dataMaxSize = this.container.dataset.maxSize;
    const dataAllowedExtensions = this.container.dataset.allowedExtensions;
    const dataFileSeq = this.container.dataset.fileSeq;

    if (dataMaxFiles) this.options.maxFiles = parseInt(dataMaxFiles, 10);
    if (dataMaxSize) this.options.maxSize = parseInt(dataMaxSize, 10);
    if (dataAllowedExtensions) this.options.allowedExtensions = dataAllowedExtensions.split(',');
    if (dataFileSeq) this.options.fileSeq = parseInt(dataFileSeq, 10);
};

/**
 * 컴포넌트 초기화
 * 버튼 파일 업로더 컴포넌트를 초기화합니다. 컨테이너에 필요한 클래스를 추가하고,
 * 파일 입력 요소를 생성하며, 필요한 이벤트 리스너를 설정합니다.
 * 이 메서드는 생성자에서 자동으로 호출됩니다.
 * 
 * @private
 * @returns {void}
 */
ButtonFileUploader.prototype._init = function() {
    // 컨테이너에 클래스 추가
    this.container.classList.add(this.classes.container);

    // 파일 입력 요소 생성
    this._createFileInput();

    // 이벤트 리스너 설정
    this._setupEventListeners();
};

/**
 * 파일 입력 요소 생성
 * 숨겨진 파일 입력 요소를 생성하고 문서에 추가합니다.
 * 이 입력 요소는 버튼 클릭 시 파일 선택 다이얼로그를 표시하는 데 사용됩니다.
 * 허용된 파일 확장자가 설정된 경우 accept 속성을 통해 파일 필터링을 제공합니다.
 * 
 * @private
 * @returns {void}
 */
ButtonFileUploader.prototype._createFileInput = function() {
    const fileInputId = this.container.id + '-file-input';
    const existingInput = document.getElementById(fileInputId);

    if (existingInput) {
        existingInput.remove();
    }

    this.fileInput = document.createElement('input');
    this.fileInput.id = fileInputId;
    this.fileInput.type = 'file';
    this.fileInput.multiple = true;
    this.fileInput.style.display = 'none';

    // 허용된 확장자가 있는 경우 accept 속성 설정
    if (this.options.allowedExtensions.length) {
        this.fileInput.accept = '.' + this.options.allowedExtensions.join(',.');
    }

    // 컨테이너에 추가 (기존 body 추가에서 변경)
    this.container.appendChild(this.fileInput);
};

/**
 * 이벤트 리스너 설정
 * 버튼 파일 업로더의 주요 이벤트 리스너를 설정합니다.
 * 버튼 클릭 시 파일 선택 다이얼로그를 표시하고, 파일 선택 시 파일 처리 로직을 실행합니다.
 * 같은 파일을 다시 선택할 수 있도록 파일 선택 후 input 값을 초기화합니다.
 * 
 * @private
 * @returns {void}
 */
ButtonFileUploader.prototype._setupEventListeners = function() {
    // 버튼 클릭 이벤트
    // 기존에 이 모듈이 등록한 핸들러가 있다면 제거 (DOM 요소에 프로퍼티로 저장된 핸들러 사용)
    if (this.button._uploaderClickHandler) {
        this.button.removeEventListener('click', this.button._uploaderClickHandler);
    }

    // 새 핸들러를 생성하고 DOM 요소 프로퍼티에 저장 (나중에 제거할 수 있도록)
    this.button._uploaderClickHandler = () => {
        this.fileInput.click();
    };

    // 이벤트 리스너 등록
    this.button.addEventListener('click', this.button._uploaderClickHandler);

    // 파일 입력 이벤트
    this.fileInput.addEventListener('change', (e) => {
        this._handleFiles(e.target.files);
        // 파일 선택 후 input 초기화 (같은 파일 다시 선택 가능하도록)
        this.fileInput.value = '';
    });
};

/**
 * 파일 처리
 * 사용자가 선택한 파일 목록을 처리합니다. 최대 파일 개수를 확인하고,
 * 유효한 파일만 필터링하여 업로더에 추가합니다.
 * 
 * @private
 * @param {FileList} fileList - 처리할 파일 목록 (input[type=file]의 files 속성)
 * @returns {void}
 */
ButtonFileUploader.prototype._handleFiles = function(fileList) {
    if (!fileList || fileList.length === 0) return;

    // 최대 파일 개수 확인
    if (this.files.length + fileList.length > this.options.maxFiles) {
        alert(`최대 ${this.options.maxFiles}개의 파일만 업로드할 수 있습니다.`);
        return;
    }

    // 유효한 파일만 필터링
    const validFiles = Array.from(fileList).filter(file => this._validateFile(file));

    // 유효한 파일만 추가
    validFiles.forEach(file => {
        this._addFile(file);
    });
};

/**
 * 파일 유효성 검사
 * 파일의 크기와 확장자를 검사하여 업로드 가능 여부를 결정합니다.
 * 유효하지 않은 파일은 경고 메시지를 표시하고 false를 반환합니다.
 * 
 * @private
 * @param {File} file - 검사할 파일 객체
 * @returns {boolean} 파일이 유효하면 true, 그렇지 않으면 false
 */
ButtonFileUploader.prototype._validateFile = function(file) {
    // 파일 크기 확인 (MB 단위로 변환)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.options.maxSize) {
        alert(`파일 '${file.name}'의 크기가 ${this.options.maxSize}MB를 초과합니다.`);
        return false;
    }

    // 파일 확장자 확인
    if (this.options.allowedExtensions.length > 0) {
        const fileExt = this._getFileExtension(file.name).toLowerCase();
        if (!this.options.allowedExtensions.includes(fileExt)) {
            alert(`파일 '${file.name}'은(는) 허용되지 않는 형식입니다. (${this.options.allowedExtensions.join(', ')} 형식만 허용)`);
            return false;
        }
    }

    return true;
};

/**
 * 파일 추가
 * 유효성 검사를 통과한 파일을 업로더에 추가하고 UI에 표시합니다.
 * 각 파일에는 고유 ID가 부여되며, 내부 파일 배열에 저장됩니다.
 * 
 * @private
 * @param {File} file - 추가할 파일 객체
 * @returns {void}
 */
ButtonFileUploader.prototype._addFile = function(file) {
    if (!file) return;

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileObj = {
        id: fileId,
        file: file,
        fileSeq: this.options.fileSeq || null,
        fileDetailSeq: null
    };

    this.files.push(fileObj);
    this._renderFileBadge(fileObj);
};

/**
 * 파일 뱃지 렌더링
 * 로컬 파일 객체를 기반으로 파일 뱃지 UI를 생성하고 컨테이너에 추가합니다.
 * 파일 이름, 크기를 표시하고 삭제 버튼을 제공합니다.
 * 
 * @private
 * @param {Object} fileObj - 파일 객체
 * @param {string} fileObj.id - 파일 고유 ID
 * @param {File} fileObj.file - 파일 객체
 * @returns {void}
 */
ButtonFileUploader.prototype._renderFileBadge = function(fileObj) {
    if (!fileObj || !fileObj.file) return;

    const badge = document.createElement('div');
    badge.className = this.classes.badge;
    badge.id = fileObj.id;

    const fileName = fileObj.file.name;
    const formattedSize = this._formatFileSize(fileObj.file.size);

    badge.innerHTML = `
        <span class="${this.classes.badgeName}" title="${fileName}">${fileName}</span>
        <span class="${this.classes.badgeSize}">(${formattedSize})</span>
        <button type="button" class="${this.classes.badgeRemove}" data-file-id="${fileObj.id}" title="삭제">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    this.container.appendChild(badge);

    // 이벤트 리스너 설정
    this._setupBadgeEventListeners(badge, fileObj);
};

/**
 * 뱃지 이벤트 리스너 설정
 * 파일 뱃지에 다운로드 및 삭제 기능을 위한 이벤트 리스너를 설정합니다.
 * 파일 이름 클릭 시 다운로드, 삭제 버튼 클릭 시 파일 삭제 기능을 제공합니다.
 * 
 * @private
 * @param {HTMLElement} badge - 이벤트를 설정할 파일 뱃지 요소
 * @param {Object} fileObj - 파일 객체
 * @param {string} fileObj.id - 파일 고유 ID
 * @returns {void}
 */
ButtonFileUploader.prototype._setupBadgeEventListeners = function(badge, fileObj) {
    // 뱃지 클릭 시 다운로드
    const badgeName = badge.querySelector('.oyster-file-badge-name');
    badgeName.addEventListener('click', () => {
        this._downloadFile(fileObj);
    });

    // 삭제 버튼 클릭
    const removeBtn = badge.querySelector('.oyster-file-badge-remove');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeFile(fileObj.id);
    });
};

/**
 * 파일 다운로드
 * 파일 객체를 다운로드합니다. 서버 파일과 로컬 파일을 구분하여 처리합니다.
 * 서버 파일은 _downloadServerFile 메서드를 통해 다운로드하고,
 * 로컬 파일은 URL.createObjectURL을 사용하여 다운로드합니다.
 * 
 * @private
 * @param {Object} fileObj - 다운로드할 파일 객체
 * @param {boolean} [fileObj.isFromServer] - 서버에서 가져온 파일 여부
 * @param {File} [fileObj.file] - 로컬 파일 객체 (isFromServer가 false인 경우)
 * @param {string} [fileObj.fileUrl] - 서버 파일 URL (isFromServer가 true인 경우)
 * @returns {void}
 * @throws {Error} 파일 다운로드 중 오류가 발생한 경우 콘솔에 오류 메시지 출력
 */
ButtonFileUploader.prototype._downloadFile = function(fileObj) {
    if (fileObj.isFromServer) {
        this._downloadServerFile(fileObj);
    } else {
        if (!fileObj || !fileObj.file) {
            console.error('다운로드할 파일이 없습니다.');
            return;
        }

        try {
            const file = fileObj.file;
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();

            // 메모리 누수 방지를 위해 URL 객체 해제
            window.setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('파일 다운로드 중 오류가 발생했습니다:', error);
        }
    }
};

/**
 * 서버 파일 다운로드
 * 서버에 저장된 파일을 다운로드합니다. 파일 URL을 사용하여 새 창에서 파일을 엽니다.
 * 브라우저의 기본 다운로드 기능을 활용합니다.
 * 
 * @private
 * @param {Object} fileObj - 다운로드할 서버 파일 객체
 * @param {string} fileObj.fileUrl - 파일 다운로드 URL
 * @returns {void}
 * @throws {Error} 파일 다운로드 중 오류가 발생한 경우 콘솔에 오류 메시지 출력
 */
ButtonFileUploader.prototype._downloadServerFile = function(fileObj) {
    if (!fileObj || !fileObj.fileUrl) {
        console.error('다운로드할 파일 URL이 없습니다.');
        return;
    }

    try {
        // 새 창에서 파일 다운로드 링크 열기
        window.open(fileObj.fileUrl, '_blank');
    } catch (error) {
        console.error('파일 다운로드 중 오류가 발생했습니다:', error);
    }
};

/**
 * 파일 삭제
 * 파일 ID를 기반으로 파일을 삭제합니다. 서버 파일과 로컬 파일을 구분하여 처리합니다.
 * 서버 파일은 삭제 대기 목록에 추가하고, 모든 파일은 UI에서 제거합니다.
 * 
 * @private
 * @param {string} fileId - 삭제할 파일의 고유 ID
 * @returns {void}
 */
ButtonFileUploader.prototype._removeFile = function(fileId) {
    const fileObj = this.files.find(f => f.id === fileId);
    if (!fileObj) return;

    if (fileObj.isFromServer && fileObj.fileDetailSeq) {
        this._removeServerFile(fileId, fileObj.fileDetailSeq);
    } else {
        this._removeFileFromUI(fileId);
    }
};

/**
 * 서버 파일 삭제
 * 서버에 저장된 파일을 삭제 대기 목록에 추가하고 UI에서 제거합니다.
 * 실제 서버에서의 삭제는 폼 제출 시 deleteFileDetailSeqs 배열을 통해 처리됩니다.
 * 
 * @private
 * @param {string} fileId - 삭제할 파일의 고유 ID
 * @param {number} fileDetailSeq - 삭제할 파일의 서버 상세 시퀀스 번호
 * @returns {void}
 */
ButtonFileUploader.prototype._removeServerFile = function(fileId, fileDetailSeq) {
    this.deleteFileDetailSeqs.push(fileDetailSeq);
    this._removeFileFromUI(fileId);
};

/**
 * UI에서 파일 제거
 * 파일 ID를 기반으로 파일을 내부 배열에서 제거하고 DOM에서 해당 파일 뱃지를 삭제합니다.
 * 이 메서드는 실제 파일 삭제가 아닌 UI 업데이트만 담당합니다.
 * 
 * @private
 * @param {string} fileId - 제거할 파일의 고유 ID
 * @returns {void}
 */
ButtonFileUploader.prototype._removeFileFromUI = function(fileId) {
    // 파일 목록에서 제거
    this.files = this.files.filter(f => f.id !== fileId);

    // DOM에서 제거
    const badgeElement = document.getElementById(fileId);
    if (badgeElement) {
        badgeElement.remove();
    }
};

/**
 * 서버에서 파일 정보 로드
 * 현재 설정된 fileSeq와 fileLoadUrl을 사용하여 서버에서 파일 정보를 가져옵니다.
 * 기존에 로드된 파일 목록은 초기화됩니다.
 * 
 * @returns {Promise<void>} 파일 로드 작업이 완료되면 해결되는 Promise
 * @throws {Error} 파일 로드 중 오류가 발생한 경우
 * @example
 * // 파일 시퀀스 설정 후 서버에서 파일 정보 로드
 * uploader.setFileSeq(123).loadFilesFromServer()
 *   .then(() => console.log('파일 로드 완료'))
 *   .catch(error => console.error('파일 로드 실패:', error));
 */
ButtonFileUploader.prototype.loadFilesFromServer = function() {
    // 기존 파일 목록 초기화
    this._clearAllFiles();

    if (!this.options.fileLoadUrl) {
        console.error('로드 URL이 설정되지 않았습니다.');
        return Promise.reject(new Error('로드 URL이 설정되지 않았습니다.'));
    }

    if (!this.options.fileSeq) {
        return Promise.resolve();
    }

    // 쿼리 파라미터 구성
    const queryParam = encodeURIComponent(this.options.fileSeq);
    const url = `${this.options.fileLoadUrl}?fileSeq=${queryParam}`;

    return fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(response => {
            if (response && Array.isArray(response.data)) {
                // 서버에서 가져온 파일 정보로 파일 목록 초기화
                this._initializeFilesFromServer(response.data);
            }
        })
        .catch(error => {
            console.error('파일 정보 로드 실패:', error);
            throw error;
        });
};

/**
 * 서버에서 가져온 파일로 초기화
 * 서버에서 가져온 파일 데이터를 기반으로 파일 객체를 생성하고 UI에 표시합니다.
 * 각 파일은 고유 ID를 부여받고 서버 파일로 표시됩니다.
 * 
 * @private
 * @param {Array} fileDataList - 서버에서 가져온 파일 데이터 배열
 * @param {string} fileDataList[].fileName - 파일 이름
 * @param {number} fileDataList[].fileSize - 파일 크기 (바이트)
 * @param {string} fileDataList[].fileType - 파일 MIME 타입
 * @param {string} fileDataList[].fileUrl - 파일 다운로드 URL
 * @param {number} fileDataList[].fileDetailSeq - 파일 상세 시퀀스 번호
 * @returns {void}
 */
ButtonFileUploader.prototype._initializeFilesFromServer = function(fileDataList) {
    fileDataList.forEach(fileData => {
        const fileId = `server-file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const fileObj = {
            id: fileId,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            fileType: fileData.fileType,
            fileUrl: fileData.fileUrl,
            fileSeq: this.options.fileSeq,
            fileDetailSeq: fileData.fileDetailSeq,
            isFromServer: true
        };

        this.files.push(fileObj);
        this._renderServerFileBadge(fileObj);
    });
};

/**
 * 서버 파일 뱃지 렌더링
 * 서버에서 가져온 파일 정보를 기반으로 파일 뱃지 UI를 생성하고 컨테이너에 추가합니다.
 * 서버 파일 뱃지는 일반 파일 뱃지와 구분하기 위해 추가 클래스를 가집니다.
 * 
 * @private
 * @param {Object} fileObj - 서버 파일 객체
 * @param {string} fileObj.id - 파일 고유 ID
 * @param {string} fileObj.fileName - 파일 이름
 * @param {number} fileObj.fileSize - 파일 크기 (바이트)
 * @param {string} fileObj.fileUrl - 파일 다운로드 URL
 * @param {number} fileObj.fileDetailSeq - 파일 상세 시퀀스 번호
 * @returns {void}
 */
ButtonFileUploader.prototype._renderServerFileBadge = function(fileObj) {
    const badge = document.createElement('div');
    badge.className = `${this.classes.badge} ${this.classes.serverFile}`;
    badge.id = fileObj.id;

    const fileName = fileObj.fileName;
    const formattedSize = this._formatFileSize(fileObj.fileSize);

    badge.innerHTML = `
        <span class="${this.classes.badgeName}" title="${fileName}">${fileName}</span>
        <span class="${this.classes.badgeSize}">(${formattedSize})</span>
        <button type="button" class="${this.classes.badgeRemove}" data-file-id="${fileObj.id}" title="삭제">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    this.container.appendChild(badge);

    // 이벤트 리스너 설정
    this._setupBadgeEventListeners(badge, fileObj);
};

/**
 * 파일 확장자 추출
 * 파일 이름에서 확장자를 추출합니다. 확장자가 없는 경우 빈 문자열을 반환합니다.
 * 
 * @private
 * @param {string} filename - 확장자를 추출할 파일 이름
 * @returns {string} 추출된 파일 확장자 (점 제외, 소문자로 변환되지 않음)
 * @example
 * // 'jpg' 반환
 * this._getFileExtension('image.jpg');
 * 
 * // 'pdf' 반환
 * this._getFileExtension('document.PDF');
 * 
 * // '' 반환 (확장자 없음)
 * this._getFileExtension('README');
 */
ButtonFileUploader.prototype._getFileExtension = function(filename) {
    return filename.split('.').pop() || '';
};

/**
 * 파일 크기 포맷팅
 * 바이트 단위의 파일 크기를 사람이 읽기 쉬운 형식으로 변환합니다.
 * 적절한 단위(Bytes, KB, MB, GB, TB)를 자동으로 선택하고 소수점 두 자리까지 표시합니다.
 * 
 * @private
 * @param {number} bytes - 변환할 파일 크기 (바이트 단위)
 * @returns {string} 포맷팅된 파일 크기 문자열 (예: "2.50 MB")
 * @example
 * // '0 Bytes' 반환
 * this._formatFileSize(0);
 * 
 * // '1.00 KB' 반환
 * this._formatFileSize(1024);
 * 
 * // '2.50 MB' 반환
 * this._formatFileSize(2621440);
 */
ButtonFileUploader.prototype._formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 파일 시퀀스 설정하기
 * 업로더의 파일 시퀀스 번호를 설정합니다.
 * 파일 시퀀스는 서버에서 파일 그룹을 식별하는 데 사용되는 고유 번호입니다.
 *
 * @param {number|null} fileSeq - 설정할 파일 시퀀스 번호
 * @returns {FileUploader} 메서드 체이닝을 위한 업로더 인스턴스
 * @example
 * // 파일 시퀀스 설정하기
 * uploader.setFileSeq(123);
 *
 * // 메서드 체이닝 사용 예시
 * uploader.setFileSeq(123).loadFilesFromServer();
 */
ButtonFileUploader.prototype.setFileSeq = function(fileSeq) {
    this.options.fileSeq = fileSeq;
    return this;
};

/**
 * 파일 시퀀스 가져오기
 * 현재 설정된 파일 시퀀스 번호를 반환합니다.
 *
 * @returns {number|null} 현재 파일 시퀀스 번호
 */
ButtonFileUploader.prototype.getFileSeq = function() {
    return this.options.fileSeq;
};

/**
 * 파일 정보 가져오기
 * 현재 업로더에 있는 모든 파일 정보를 객체 형태로 반환합니다.
 * 로컬 파일과 서버 파일을 구분하여 처리합니다.
 *
 * @returns {Object} 파일 정보 객체
 * @returns {number|null} returns.fileSeq - 파일 시퀀스 번호
 * @returns {File[]} returns.files - 로컬에서 선택된 파일 객체 배열
 * @returns {number[]} returns.modifyFileDetailSeqs - 서버에서 유지할 파일 상세 시퀀스 배열
 * @returns {number[]} returns.deleteFileDetailSeqs - 서버에서 삭제할 파일 상세 시퀀스 배열
 */
ButtonFileUploader.prototype.getFileInfo = function() {
    const files = [];
    const modifyFileDetailSeqs = [];

    this.files.filter(f => !f.isFromServer).forEach(f => {
        files.push(f.file);
    });

    this.files.filter(f => f.isFromServer).forEach(f => {
        modifyFileDetailSeqs.push(f.fileDetailSeq);
    });

    return {
        fileSeq: this.options.fileSeq,
        files: files,
        modifyFileDetailSeqs: modifyFileDetailSeqs,
        deleteFileDetailSeqs: this.deleteFileDetailSeqs
    };
};

/**
 * FormData 객체 생성
 * 파일 업로드를 위한 FormData 객체를 생성하고 반환합니다.
 * getFileInfo() 메서드의 결과를 사용하여 FormData에 파일 정보를 추가합니다.
 * 
 * @returns {FormData} 서버 전송용 FormData 객체
 * @example
 * // FormData 객체 생성 후 서버에 전송
 * const formData = uploader.getFormData();
 * fetch('/api/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 */
ButtonFileUploader.prototype.getFormData = function() {
    const formData = new FormData();
    const { fileSeq, files, modifyFileDetailSeqs, deleteFileDetailSeqs } = this.getFileInfo();

    formData.append('fileSeq', fileSeq || '');

    files.forEach(file => {
        formData.append('files', file);
    });

    modifyFileDetailSeqs.forEach(fileDetailSeq => {
        formData.append('modifyFileDetailSeqs', fileDetailSeq);
    });

    deleteFileDetailSeqs.forEach(fileDetailSeq => {
        formData.append('deleteFileDetailSeqs', fileDetailSeq);
    });

    return formData;
};

/**
 * 모든 파일 삭제
 * 업로더에 있는 모든 파일을 삭제하고 UI에서 파일 뱃지를 제거합니다.
 * 로컬 파일과 서버 파일 모두 삭제되며, 삭제 대기 목록도 초기화됩니다.
 * 
 * @private
 * @returns {void}
 */
ButtonFileUploader.prototype._clearAllFiles = function() {
    this.files.forEach(file => {
        const badgeElement = document.getElementById(file.id);
        if (badgeElement) {
            badgeElement.remove();
        }
    });
    this.files = [];
    this.deleteFileDetailSeqs = [];

    // 파일 업로드 컨테이너 초기화 (파일 input 유지를 위해 뱃지만 삭제)
    const badges = this.container.querySelectorAll('.' + this.classes.badge);
    badges.forEach(badge => badge.remove());
};