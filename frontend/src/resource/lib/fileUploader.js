/**
 * 파일 업로더 모듈 - 파일 업로드, 미리보기, 다운로드 및 삭제 기능을 제공하는 UI 컴포넌트를 제공합니다.
 * @module fileUploader
 */

/**
 * 파일 업로더 컴포넌트
 * 
 * 파일 업로드, 미리보기, 다운로드 및 삭제 기능을 제공하는 UI 컴포넌트입니다.
 * 드래그 앤 드롭, 이미지 미리보기, 파일 설명 추가 등의 기능을 지원합니다.
 * 
 * @param {string|HTMLElement} containerId - 파일 업로더를 렌더링할 컨테이너의 ID 또는 HTML 요소
 * @param {Object} options - 파일 업로더 설정 옵션
 * @param {number} [options.maxFiles=5] - 최대 업로드 가능한 파일 수
 * @param {number} [options.maxSize=5] - 파일당 최대 크기 (MB 단위)
 * @param {string[]} [options.allowedExtensions=[]] - 허용되는 파일 확장자 배열
 * @param {boolean} [options.showImagePreview=true] - 이미지 파일 미리보기 표시 여부
 * @param {boolean} [options.showFileDescription=true] - 파일 설명 입력 필드 표시 여부
 * @param {boolean} [options.enableDownload=true] - 파일 다운로드 버튼 표시 여부
 * @param {number} [options.maxDescriptionLength=200] - 파일 설명 최대 길이
 * @param {number|null} [options.fileSeq=null] - 파일 시퀀스 번호 (서버에서 파일 정보 로드 시 사용)
 * @param {string|null} [options.fileLoadUrl=null] - 파일 정보를 로드할 서버 URL
 * @returns {FileUploader} 파일 업로더 인스턴스
 * @constructor
 */
export default function FileUploader(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
        throw new Error(`ID가 '${containerId}'인 컨테이너를 찾을 수 없습니다.`);
    }

    // 기본 옵션 설정
    this.options = {
        maxFiles: options.maxFiles || 5,
        maxSize: options.maxSize || 5, // MB 단위
        allowedExtensions: options.allowedExtensions || [],
        showImagePreview: options.showImagePreview !== undefined ? options.showImagePreview : true,
        showFileDescription: options.showFileDescription !== undefined ? options.showFileDescription : true,
        enableDownload: options.enableDownload !== undefined ? options.enableDownload : true,
        maxDescriptionLength: options.maxDescriptionLength || 200, // 설명 최대 길이
        fileSeq: options.fileSeq || null, // 파일 시퀀스 번호
        fileLoadUrl: options.fileLoadUrl || null, // 파일 정보를 로드할 서버 URL
    };
    
    // 기본 CSS 클래스
    this.classes = Object.assign({
        container: 'oyster-file-uploader',
        header: 'oyster-uploader-header',
        title: 'oyster-uploader-title',
        info: 'oyster-uploader-info',
        dropzone: 'oyster-uploader-dropzone',
        placeholder: 'oyster-uploader-placeholder',
        icon: 'oyster-uploader-icon',
        dropdown: 'oyster-uploader-file-dropdown',
        dropdownHeader: 'oyster-uploader-dropdown-header',
        fileCount: 'oyster-uploader-file-count',
        dropdownArrow: 'oyster-uploader-dropdown-arrow',
        fileList: 'oyster-uploader-file-list',
        fileItem: 'oyster-uploader-file-item',
        filePreview: 'oyster-uploader-file-preview',
        fileInfo: 'oyster-uploader-file-info',
        fileName: 'oyster-uploader-file-name',
        fileSize: 'oyster-uploader-file-size',
        fileSizeIcon: 'oyster-uploader-file-size-icon',
        fileDescription: 'oyster-uploader-file-description',
        fileDownload: 'oyster-uploader-file-download',
        fileRemove: 'oyster-uploader-file-remove',
        active: 'active',
        open: 'open'
    }, options.classes || {});

    // HTML 데이터 속성에서 옵션 가져오기
    this._initOptionsFromDataAttributes();

    // 파일 상태 초기화
    this.files = [];
    this.deleteFileDetailSeqs = [];
    this.fileListEl = null;
    this.fileDropdownEl = null;
    this.dropdownHeaderEl = null;

    // 컴포넌트 렌더링
    this._render();

    // 이벤트 리스너 설정
    this._setupEventListeners();

    // 파일 시퀀스가 있는 경우 서버에서 파일 정보 로드
    if (this.options.fileSeq && this.options.fileLoadUrl) {
        this.loadFilesFromServer();
    }
}

/**
 * HTML 데이터 속성에서 옵션 가져오기
 * 컨테이너 요소의 data-* 속성에서 업로더 옵션을 읽어와 적용합니다.
 * data-max-files, data-max-size, data-allowed-extensions 등의 속성을 지원합니다.
 * 
 * @private
 * @returns {void}
 */
FileUploader.prototype._initOptionsFromDataAttributes = function() {
    if (!this.container) return;

    // 데이터 속성에서 옵션 가져오기
    const dataMaxFiles = this.container.dataset.maxFiles;
    const dataMaxSize = this.container.dataset.maxSize;
    const dataAllowedExtensions = this.container.dataset.allowedExtensions;
    const dataShowImagePreview = this.container.dataset.showImagePreview;
    const dataShowFileDescription = this.container.dataset.showFileDescription;
    const dataMaxDescriptionLength = this.container.dataset.maxDescriptionLength;
    const datafileSeq = this.container.dataset.fileSeq;

    // 옵션 적용
    if (dataMaxFiles) this.options.maxFiles = parseInt(dataMaxFiles, 10);
    if (dataMaxSize) this.options.maxSize = parseInt(dataMaxSize, 10);
    if (dataAllowedExtensions) this.options.allowedExtensions = dataAllowedExtensions.split(',');
    if (dataShowImagePreview !== undefined) this.options.showImagePreview = dataShowImagePreview === 'true';
    if (dataShowFileDescription !== undefined) this.options.showFileDescription = dataShowFileDescription === 'true';
    if (dataMaxDescriptionLength) this.options.maxDescriptionLength = parseInt(dataMaxDescriptionLength, 10);
    if (datafileSeq) this.options.fileSeq = parseInt(datafileSeq, 10);
};

/**
 * 업로더 UI 렌더링
 * 파일 업로더의 UI 요소를 생성하고 컨테이너에 추가합니다.
 * 드롭존, 파일 목록, 드롭다운 등의 UI 요소를 초기화합니다.
 * 
 * @private
 * @returns {void}
 */
FileUploader.prototype._render = function() {
    // 기존 내용 지우기
    this.container.innerHTML = '';

    // 컨테이너에 클래스 추가
    this.container.classList.add(this.classes.container);

    // 업로더 UI 생성
    this.container.innerHTML = this._createUploaderHTML();

    // 파일 목록 참조 저장
    this.fileListEl = document.getElementById(`${this.containerId}-file-list`);

    // 드롭다운 컨테이너 참조 저장
    this.fileDropdownEl = document.getElementById(`${this.containerId}-file-dropdown`);

    // 드롭다운 헤더 참조 저장
    this.dropdownHeaderEl = document.getElementById(`${this.containerId}-dropdown-header`);

    // 드롭다운 토글 이벤트 설정
    if (this.dropdownHeaderEl) {
        this.dropdownHeaderEl.addEventListener('click', () => {
            this._toggleFileList();
        });
    }

    // 초기 상태는 닫힌 상태로 설정
    if (this.fileListEl) {
        this.fileListEl.classList.remove(this.classes.open);
    }
};

/**
 * 업로더 HTML 생성
 * @private
 * @returns {string} 업로더 HTML
 */
FileUploader.prototype._createUploaderHTML = function() {
    const allowedExtensionsText = this.options.allowedExtensions.length ?
        `<span>허용 확장자: ${this.options.allowedExtensions.join(', ')}</span>` : '';

    const acceptAttribute = this.options.allowedExtensions.length ?
        `accept=".${this.options.allowedExtensions.join(',.')}"` : '';

    return `
        <div class="${this.classes.header}">
            <div class="${this.classes.title}">파일 업로드</div>
            <div class="${this.classes.info}">
                <span>최대 ${this.options.maxFiles}개 파일</span>
                <span>파일당 최대 ${this.options.maxSize}MB</span>
                ${allowedExtensionsText}
            </div>
        </div>
        
        <div class="${this.classes.dropzone}" id="${this.containerId}-dropzone">
            <div class="${this.classes.placeholder}">
                <svg class="${this.classes.icon}" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 22h16a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"></path>
                    <path d="M12 18v-6"></path>
                    <path d="M9 15l3-3 3 3"></path>
                </svg>
                <p>파일을 끌어다 놓거나 클릭하여 업로드하세요</p>
                <span style="display: block; font-size: 13px; color: #555; margin-top: 8px;">최대 ${this.options.maxFiles}개의 파일을 선택할 수 있습니다</span>
            </div>
            <input type="file" id="${this.containerId}-file-input" multiple style="display: none;" ${acceptAttribute}>
        </div>
        
        <div id="${this.containerId}-file-dropdown" class="${this.classes.dropdown}" style="display: none;">
            <div class="${this.classes.dropdownHeader}" id="${this.containerId}-dropdown-header">
                <span class="${this.classes.fileCount}">파일 목록 (0)</span>
                <svg class="${this.classes.dropdownArrow}" width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 1L7 7L13 1"></path>
                </svg>
            </div>
            <div class="${this.classes.fileList}" id="${this.containerId}-file-list"></div>
        </div>
    `;
};

/**
 * 파일 목록 드롭다운 토글
 * 파일 목록 드롭다운의 열림/닫힘 상태를 전환합니다.
 * 드롭다운이 열려있으면 닫고, 닫혀있으면 엽니다.
 * CSS 클래스를 추가/제거하여 애니메이션 효과와 함께 토글됩니다.
 * 
 * @private
 * @returns {void}
 */
FileUploader.prototype._toggleFileList = function() {
    if (!this.fileListEl || !this.dropdownHeaderEl) return;

    // 클래스로 토글하여 애니메이션 적용
    const isOpen = this.fileListEl.classList.contains(this.classes.open);

    // 헤더 토글 상태 변경
    if (isOpen) {
        // 닫기
        this.fileListEl.classList.remove(this.classes.open);
        this.dropdownHeaderEl.classList.remove(this.classes.active);
    } else {
        // 열기
        this.fileListEl.classList.add(this.classes.open);
        this.dropdownHeaderEl.classList.add(this.classes.active);
    }
};

/**
 * 이벤트 리스너 설정
 * 파일 입력, 드롭존 클릭, 드래그 앤 드롭 등의 이벤트 리스너를 설정합니다.
 * 사용자가 파일을 선택하거나 드래그 앤 드롭할 수 있도록 합니다.
 * 
 * @private
 * @returns {void}
 */
FileUploader.prototype._setupEventListeners = function() {
    const dropzone = document.getElementById(`${this.containerId}-dropzone`);
    const fileInput = document.getElementById(`${this.containerId}-file-input`);

    if (!dropzone || !fileInput) {
        console.error('필수 DOM 요소를 찾을 수 없습니다.');
        return;
    }

    // 파일 입력 이벤트
    fileInput.addEventListener('change', (e) => {
        this._handleFiles(e.target.files);
        // 파일 선택 후 input 초기화 (같은 파일 다시 선택 가능하도록)
        fileInput.value = '';
    });

    // 드롭존 클릭 이벤트
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    // 드래그 앤 드롭 이벤트 설정
    this._setupDragAndDropEvents(dropzone);
};

/**
 * 드래그 앤 드롭 이벤트 설정
 * 파일을 드래그 앤 드롭으로 업로드할 수 있도록 드롭존에 이벤트 리스너를 설정합니다.
 * dragover, dragleave, drop 이벤트를 처리하여 시각적 피드백을 제공하고 파일을 처리합니다.
 * 
 * @private
 * @param {HTMLElement} dropzone - 파일을 드롭할 수 있는 드롭존 요소
 * @returns {void}
 */
FileUploader.prototype._setupDragAndDropEvents = function(dropzone) {
    // 드래그 오버 이벤트
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
    });

    // 드래그 리브 이벤트
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
    });

    // 드롭 이벤트
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');

        const dt = e.dataTransfer;
        if (dt.files.length) {
            this._handleFiles(dt.files);
        }
    });
};

/**
 * 파일 처리
 * 사용자가 선택하거나 드래그 앤 드롭한 파일을 처리합니다.
 * 최대 파일 개수를 확인하고, 유효한 파일만 필터링하여 추가합니다.
 * 
 * @private
 * @param {FileList} fileList - 선택된 파일 목록
 * @returns {void}
 */
FileUploader.prototype._handleFiles = function(fileList) {
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
 * 선택된 파일이 업로더의 제약 조건(크기 제한, 허용된 확장자 등)을 만족하는지 검사합니다.
 * 파일 크기가 maxSize를 초과하거나 허용되지 않는 확장자인 경우 경고 메시지를 표시하고 false를 반환합니다.
 * 
 * @private
 * @param {File} file - 유효성을 검사할 파일 객체
 * @returns {boolean} 파일이 유효하면 true, 그렇지 않으면 false
 */
FileUploader.prototype._validateFile = function(file) {
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
 * 새 파일을 업로더에 추가하고 UI에 렌더링합니다.
 * 파일 객체를 생성하고 내부 파일 목록에 추가한 후 UI를 업데이트합니다.
 * 
 * @private
 * @param {File} file - 추가할 파일
 * @returns {void}
 */
FileUploader.prototype._addFile = function(file) {
    if (!file) return;

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileObj = {
        id: fileId,
        file: file,
        description: '',
        fileSeq: this.options.fileSeq || null,
        fileDetailSeq: null
    };

    this.files.push(fileObj);
    this._renderFileItem(fileObj);
    this._updateFileCount();

    // 파일이 추가되면 드롭다운 컨테이너를 표시
    if (this.fileDropdownEl) {
        this.fileDropdownEl.style.display = 'block';
    }

    // 파일이 추가되면 드롭다운을 열어서 보여줌
    if (this.fileListEl && this.dropdownHeaderEl) {
        this.fileListEl.classList.add(this.classes.open);
        this.dropdownHeaderEl.classList.add(this.classes.active);
    }
};

/**
 * 파일 개수 표시 업데이트
 * @private
 */
FileUploader.prototype._updateFileCount = function() {
    if (!this.dropdownHeaderEl) return;

    const fileCount = this.files.length;
    const fileCountEl = this.dropdownHeaderEl.querySelector('.oyster-uploader-file-count');
    if (fileCountEl) {
        fileCountEl.textContent = `파일 목록 (${fileCount})`;
    }
};

/**
 * 파일 항목 렌더링
 * @private
 * @param {Object} fileObj - 파일 객체
 */
FileUploader.prototype._renderFileItem = function(fileObj) {
    if (!fileObj || !fileObj.file || !this.fileListEl) return;

    const file = fileObj.file;
    const fileItem = document.createElement('div');
    fileItem.className = this.classes.fileItem;
    fileItem.id = fileObj.id;

    const isImage = file.type.startsWith('image/');

    // 파일 미리보기 HTML 생성
    const previewHtml = this._createFilePreviewHTML(file, fileObj.id, isImage);

    // 파일 크기 포맷팅
    const formattedSize = this._formatFileSize(file.size);

    // 파일 설명 입력 필드
    const descriptionField = this._createDescriptionFieldHTML(fileObj.id);

    // 다운로드 버튼
    const downloadButton = this._createDownloadButtonHTML(fileObj.id);

    fileItem.innerHTML = `
        ${previewHtml}
        <div class="${this.classes.fileInfo}">
            <div class="${this.classes.fileName}">${file.name}</div>
            <div class="${this.classes.fileSize}">
                <svg class="${this.classes.fileSizeIcon}" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                </svg>
                ${formattedSize}
            </div>
            ${descriptionField}
        </div>
        ${downloadButton}
        <button type="button" class="${this.classes.fileRemove}" data-file-id="${fileObj.id}" title="삭제">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    this.fileListEl.appendChild(fileItem);

    // 이미지 파일인 경우 미리보기 설정
    if (isImage && this.options.showImagePreview) {
        this._setupImagePreview(file, fileObj.id);
    }

    // 이벤트 리스너 설정
    this._setupFileItemEventListeners(fileItem, fileObj);
};

/**
 * 파일 미리보기 HTML 생성
 * 파일 타입에 따라 적절한 미리보기 HTML을 생성합니다.
 * 이미지 파일인 경우 이미지 미리보기를 표시하고, 그 외의 파일은 파일 타입에 맞는 아이콘을 표시합니다.
 * 
 * @private
 * @param {File} file - 미리보기를 생성할 파일 객체
 * @param {string} fileId - 파일의 고유 식별자
 * @param {boolean} isImage - 이미지 파일 여부 (true: 이미지 파일, false: 일반 파일)
 * @returns {string} 생성된 미리보기 HTML 문자열
 */
FileUploader.prototype._createFilePreviewHTML = function(file, fileId, isImage) {
    if (isImage && this.options.showImagePreview) {
        return `
            <div class="${this.classes.filePreview}">
                <img src="#" alt="${file.name}" id="preview-${fileId}">
            </div>
        `;
    } else {
        // 파일 타입에 따른 아이콘
        let iconSvg = '';

        if (file.type.includes('pdf')) {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#e74c3c" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>`;
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#27ae60" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
        } else if (file.type.includes('word') || file.type.includes('document')) {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#3498db" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>`;
        } else if (file.type.includes('zip') || file.type.includes('archive')) {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#9b59b6" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
        } else if (file.type.includes('audio')) {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#f39c12" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;
        } else if (file.type.includes('video')) {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#e67e22" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#34495e" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
        }

        return `
            <div class="${this.classes.filePreview}">
                <span class="oyster-uploader-file-preview-icon">${iconSvg}</span>
            </div>
        `;
    }
};

/**
 * 파일 설명 입력 필드 HTML 생성
 * 파일에 대한 설명을 입력할 수 있는 텍스트 필드 HTML을 생성합니다.
 * options.showFileDescription이 true인 경우에만 입력 필드를 생성하며,
 * 최대 입력 길이는 options.maxDescriptionLength로 제한됩니다.
 * 
 * @private
 * @param {string} fileId - 파일의 고유 식별자
 * @returns {string} 생성된 설명 입력 필드 HTML 문자열 (showFileDescription이 false인 경우 빈 문자열)
 */
FileUploader.prototype._createDescriptionFieldHTML = function(fileId) {
    return this.options.showFileDescription ?
        `<input type="text" class="${this.classes.fileDescription}" placeholder="파일 설명" data-file-id="${fileId}" maxlength="${this.options.maxDescriptionLength}">` : '';
};

/**
 * 다운로드 버튼 HTML 생성
 * 파일을 다운로드할 수 있는 버튼 HTML을 생성합니다.
 * options.enableDownload가 true인 경우에만 다운로드 버튼을 생성합니다.
 * 버튼에는 파일 ID가 data-file-id 속성으로 포함되어 이벤트 처리 시 사용됩니다.
 * 
 * @private
 * @param {string} fileId - 파일의 고유 식별자
 * @returns {string} 생성된 다운로드 버튼 HTML 문자열 (enableDownload가 false인 경우 빈 문자열)
 */
FileUploader.prototype._createDownloadButtonHTML = function(fileId) {
    return this.options.enableDownload ?
        `<button type="button" class="${this.classes.fileDownload}" data-file-id="${fileId}" title="다운로드">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </button>` : '';
};

/**
 * 이미지 미리보기 설정
 * 이미지 파일에 대한 미리보기를 설정합니다.
 * FileReader API를 사용하여 이미지 파일을 읽고, 해당 이미지를 미리보기 요소에 표시합니다.
 * 이미지 파일을 Data URL로 변환하여 img 태그의 src 속성에 설정합니다.
 * 
 * @private
 * @param {File} file - 미리보기를 설정할 이미지 파일 객체
 * @param {string} fileId - 파일의 고유 식별자 (미리보기 요소를 찾는 데 사용)
 * @returns {void}
 */
FileUploader.prototype._setupImagePreview = function(file, fileId) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById(`preview-${fileId}`);
        if (previewImg) {
            previewImg.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
};

/**
 * 파일 항목 이벤트 리스너 설정
 * 파일 항목에 필요한 모든 이벤트 리스너를 설정합니다.
 * 미리보기 클릭, 다운로드 버튼 클릭, 삭제 버튼 클릭, 설명 입력 등의 이벤트를 처리합니다.
 * 각 이벤트는 해당 기능이 활성화된 경우에만 설정됩니다(예: enableDownload가 true인 경우에만 다운로드 이벤트 설정).
 * 
 * @private
 * @param {HTMLElement} fileItem - 이벤트를 설정할 파일 항목 DOM 요소
 * @param {Object} fileObj - 파일 정보를 담고 있는 객체
 * @param {string} fileObj.id - 파일의 고유 식별자
 * @param {File} [fileObj.file] - 파일 객체 (로컬 파일인 경우)
 * @returns {void}
 */
FileUploader.prototype._setupFileItemEventListeners = function(fileItem, fileObj) {
    // 미리보기 클릭 이벤트 (다운로드 기능)
    const previewEl = fileItem.querySelector('.oyster-uploader-file-preview');
    if (previewEl && this.options.enableDownload) {
        previewEl.addEventListener('click', () => {
            this._downloadFile(fileObj);
        });
    }

    // 다운로드 버튼 이벤트 리스너
    if (this.options.enableDownload) {
        const downloadBtn = fileItem.querySelector('.oyster-uploader-file-download');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this._downloadFile(fileObj);
            });
        }
    }

    // 삭제 버튼 이벤트 리스너
    const removeBtn = fileItem.querySelector('.oyster-uploader-file-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            this._removeFile(fileObj.id);
        });
    }

    // 설명 입력 필드 이벤트 리스너
    if (this.options.showFileDescription) {
        const descriptionInput = fileItem.querySelector('.oyster-uploader-file-description');
        if (descriptionInput) {
            descriptionInput.addEventListener('input', (e) => {
                this._updateFileDescription(fileObj.id, e.target.value);
            });
        }
    }
};

/**
 * 파일 다운로드
 * 로컬에서 선택한 파일을 다운로드합니다.
 * URL.createObjectURL을 사용하여 파일에 대한 임시 URL을 생성하고,
 * 동적으로 생성한 a 태그를 통해 파일을 다운로드합니다.
 * 다운로드 후에는 메모리 누수 방지를 위해 URL 객체를 해제합니다.
 * 
 * @private
 * @param {Object} fileObj - 다운로드할 파일 정보를 담고 있는 객체
 * @param {File} fileObj.file - 다운로드할 파일 객체
 * @returns {void}
 */
FileUploader.prototype._downloadFile = function(fileObj) {
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
};

/**
 * 파일 삭제
 * 업로더에서 파일을 삭제합니다.
 * 파일이 서버에서 로드된 파일인 경우(_removeServerFile 호출)와 
 * 로컬에서 선택한 파일인 경우(_removeFileFromUI 호출)를 구분하여 처리합니다.
 * 서버에서 로드된 파일은 deleteFileDetailSeqs 배열에 추가하여 서버 동기화 시 삭제되도록 합니다.
 * 
 * @private
 * @param {string} fileId - 삭제할 파일의 고유 식별자
 * @returns {void}
 */
FileUploader.prototype._removeFile = function(fileId) {
    if (!fileId) return;

    // 파일 객체 찾기
    const fileObj = this.files.find(f => f.id === fileId);

    // 서버에서 로드한 파일이고 fileDetailSeq가 있는 경우
    if (fileObj && fileObj.isFromServer && fileObj.fileDetailSeq) {
        // 서버에 파일 삭제 요청
        this._removeServerFile(fileId, fileObj.fileDetailSeq);
        return;
    }

    // 일반 파일 삭제 처리
    this._removeFileFromUI(fileId);
};

/**
 * 서버에서 파일 정보 로드
 * 서버에서 파일 정보를 가져와 업로더에 표시합니다.
 * fileSeq와 fileLoadUrl 옵션이 설정되어 있어야 합니다.
 * HTTP GET 요청을 통해 서버에서 파일 정보를 가져오고, 
 * 가져온 정보를 기반으로 파일 목록을 초기화합니다.
 * 
 * 이 메서드는 주로 기존에 업로드된 파일을 편집 화면에서 표시할 때 사용됩니다.
 * 서버에서 가져온 파일은 isFromServer 플래그가 true로 설정되어 로컬 파일과 구분됩니다.
 * 
 * @throws {Error} 파일 시퀀스 또는 로드 URL이 설정되지 않았거나 로드 실패 시 에러
 * @example
 * // 파일 시퀀스와 로드 URL이 설정된 경우 자동으로 호출됨
 * // 수동으로 호출하는 경우:
 * uploader.loadFilesFromServer()
 *   .then(files => console.log('로드된 파일:', files))
 *   .catch(error => console.error('파일 로드 실패:', error));
 */
FileUploader.prototype.loadFilesFromServer = function() {
    // 기존 파일 목록 초기화
    this._clearAllFiles();

    if (!this.options.fileLoadUrl) {
        console.error('로드 URL이 설정되지 않았습니다.');
        return;
    }

    if (!this.options.fileSeq) {
        return;
    }

    // 쿼리 파라미터 구성
    const queryParam = encodeURIComponent(this.options.fileSeq);
    const url = `${this.options.fileLoadUrl}?fileSeq=${queryParam}`;
    
    // fetch API를 사용하여 직접 요청
    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
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
 * 서버에서 가져온 파일 정보로 파일 목록 초기화
 * @private
 * @param {Array} fileDataList - 서버에서 가져온 파일 정보 배열
 */
FileUploader.prototype._initializeFilesFromServer = function(fileDataList) {
    if (!Array.isArray(fileDataList) || fileDataList.length === 0) return;

    // 서버에서 가져온 파일 정보로 파일 목록 생성
    fileDataList.forEach(fileData => {
        // 파일 객체 생성을 위한 ID 생성
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // 파일 객체 생성
        const fileObj = {
            id: fileId,
            fileName: fileData.fileName,  // 서버에서 가져온 파일명
            fileSize: fileData.fileSize,  // 서버에서 가져온 파일 크기
            fileType: fileData.fileType,  // 서버에서 가져온 파일 타입
            description: fileData.description || '',  // 서버에서 가져온 파일 설명
            fileUrl: fileData.fileUrl,    // 서버에서 가져온 파일 다운로드 URL
            thumbnailUrl: fileData.thumbnailUrl, // 서버에서 가져온 썸네일 URL
            fileSeq: this.options.fileSeq,  // 파일 시퀀스
            fileDetailSeq: fileData.fileDetailSeq, // 파일 상세 시퀀스
            isFromServer: true // 서버에서 로드된 파일 여부 (로컬 파일과 구분)
        };

        // 파일 목록에 추가
        this.files.push(fileObj);

        // 파일 항목 렌더링
        this._renderServerFileItem(fileObj);
    });

    // 파일 개수 업데이트
    this._updateFileCount();

    // 파일 목록 드롭다운 표시
    if (this.files.length > 0 && this.fileDropdownEl) {
        setTimeout(() => {
            this.fileDropdownEl.style.display = 'block';
        }, 200); // 애니메이션 지속 시간과 동일하게 설정

        // 파일 목록 드롭다운 열기
        if (this.fileListEl && this.dropdownHeaderEl) {
            this.fileListEl.classList.add('open');
            this.dropdownHeaderEl.classList.add('active');
        }
    }
};

/**
 * 서버에서 가져온 파일 항목 렌더링
 * @private
 * @param {Object} fileObj - 파일 객체
 */
FileUploader.prototype._renderServerFileItem = function(fileObj) {
    if (!fileObj || !this.fileListEl) return;

    const fileItem = document.createElement('div');
    fileItem.className = this.classes.fileItem;
    fileItem.id = fileObj.id;

    // 파일 타입에 따른 미리보기 생성
    const isImage = fileObj.fileType && fileObj.fileType.startsWith('image/');

    // 파일 미리보기 HTML 생성
    let previewHtml = '';
    if (isImage && this.options.showImagePreview && fileObj.thumbnailUrl) {
        // 이미지인 경우 썸네일 표시
        previewHtml = `
            <div class="${this.classes.filePreview}">
                <img src="${fileObj.thumbnailUrl}" alt="${fileObj.fileName}" id="preview-${fileObj.id}">
            </div>
        `;
    } else {
        // 이미지가 아닌 경우 파일 타입에 따른 아이콘 표시
        previewHtml = this._createFileTypeIconHTML(fileObj.fileType || '');
    }

    // 파일 크기 포맷팅
    const formattedSize = fileObj.fileSize ? this._formatFileSize(fileObj.fileSize) : '';

    // 파일 설명 입력 필드
    const descriptionField = this.options.showFileDescription ? 
        `<input type="text" class="${this.classes.fileDescription}" placeholder="파일 설명" data-file-id="${fileObj.id}" value="${fileObj.description || ''}" maxlength="${this.options.maxDescriptionLength}">` : '';

    // 다운로드 버튼
    const downloadButton = this.options.enableDownload ? 
        `<button type="button" class="${this.classes.fileDownload}" data-file-id="${fileObj.id}" title="다운로드">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </button>` : '';

    fileItem.innerHTML = `
        ${previewHtml}
        <div class="${this.classes.fileInfo}">
            <div class="${this.classes.fileName}">${fileObj.fileName}</div>
            <div class="${this.classes.fileSize}">
                <svg class="${this.classes.fileSizeIcon}" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                </svg>
                ${formattedSize}
            </div>
            ${descriptionField}
        </div>
        ${downloadButton}
        <button type="button" class="${this.classes.fileRemove}" data-file-id="${fileObj.id}" data-file-detail-sequence="${fileObj.fileDetailSeq}" title="삭제">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    this.fileListEl.appendChild(fileItem);

    // 이벤트 리스너 설정
    this._setupServerFileItemEventListeners(fileItem, fileObj);
};

/**
 * 서버에서 가져온 파일의 이벤트 리스너 설정
 * @private
 * @param {HTMLElement} fileItem - 파일 항목 요소
 * @param {Object} fileObj - 파일 객체
 */
FileUploader.prototype._setupServerFileItemEventListeners = function(fileItem, fileObj) {
    // 미리보기 클릭 이벤트 (다운로드 기능)
    const previewEl = fileItem.querySelector('.oyster-uploader-file-preview');
    if (previewEl && this.options.enableDownload && fileObj.fileUrl) {
        previewEl.addEventListener('click', () => {
            this._downloadServerFile(fileObj);
        });
    }

    // 다운로드 버튼 이벤트 리스너
    if (this.options.enableDownload) {
        const downloadBtn = fileItem.querySelector('.oyster-uploader-file-download');
        if (downloadBtn && fileObj.fileUrl) {
            downloadBtn.addEventListener('click', () => {
                this._downloadServerFile(fileObj);
            });
        }
    }

    // 삭제 버튼 이벤트 리스너
    const removeBtn = fileItem.querySelector('.oyster-uploader-file-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            this._removeServerFile(fileObj.id, fileObj.fileDetailSeq);
        });
    }

    // 설명 입력 필드 이벤트 리스너
    if (this.options.showFileDescription) {
        const descriptionInput = fileItem.querySelector('.oyster-uploader-file-description');
        if (descriptionInput) {
            descriptionInput.addEventListener('input', (e) => {
                this._updateFileDescription(fileObj.id, e.target.value);
            });
        }
    }
};

/**
 * 서버 파일 다운로드
 * @private
 * @param {Object} fileObj - 파일 객체
 */
FileUploader.prototype._downloadServerFile = function(fileObj) {
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
 * 서버 파일 삭제
 * @private
 * @param {string} fileId - 파일 ID
 * @param {number} fileDetailSeq - 파일 상세 시퀀스
 */
FileUploader.prototype._removeServerFile = function(fileId, fileDetailSeq) {
    if (!fileId && !fileDetailSeq) return;
    // 삭제 대상 파일상세 시퀀스 추가
    this.deleteFileDetailSeqs.push(fileDetailSeq);
    this._removeFileFromUI(fileId);
};

/**
 * UI에서 파일 항목 제거
 * @private
 * @param {string} fileId - 파일 ID
 */
FileUploader.prototype._removeFileFromUI = function(fileId) {
    // 배열에서 파일 제거
    this.files = this.files.filter(f => f.id !== fileId);

    // UI에서 파일 항목 제거 (애니메이션 적용)
    const fileItem = document.getElementById(fileId);
    if (fileItem) {
        // 삭제 애니메이션 추가
        fileItem.style.animation = 'fadeOut 0.3s ease-out';
        fileItem.style.opacity = '0';
        fileItem.style.transform = 'translateY(-10px)';

        // 애니메이션 완료 후 요소 제거
        setTimeout(() => {
            fileItem.remove();
        }, 200);
    }

    // 파일 개수 업데이트
    this._updateFileCount();

    // 파일이 없으면 드롭다운 전체를 숨김
    if (this.files.length === 0 && this.fileListEl && this.dropdownHeaderEl && this.fileDropdownEl) {
        // 애니메이션 후 컨테이너 숨기기
        this.fileListEl.classList.remove(this.classes.open);
        this.dropdownHeaderEl.classList.remove(this.classes.active);

        // 드롭다운 숨김 처리를 애니메이션 완료 후 진행
        setTimeout(() => {
            this.fileDropdownEl.style.display = 'none';
        }, 200); // 애니메이션 지속 시간과 동일하게 설정
    }
};

/**
 * 파일 타입에 따른 아이콘 HTML 생성
 * @private
 * @param {string} fileType - 파일 MIME 타입
 * @returns {string} 아이콘 HTML
 */
FileUploader.prototype._createFileTypeIconHTML = function(fileType) {
    let iconSvg = '';

    if (fileType.includes('pdf')) {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#e74c3c" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>`;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#27ae60" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
    } else if (fileType.includes('word') || fileType.includes('document')) {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#3498db" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>`;
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#9b59b6" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
    } else if (fileType.includes('audio')) {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#f39c12" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;
    } else if (fileType.includes('video')) {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#e67e22" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
    } else {
        iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="#34495e" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    }

    return `
        <div class="${this.classes.filePreview}">
            <span class="oyster-uploader-file-preview-icon">${iconSvg}</span>
        </div>
    `;
};

/**
 * 파일 설명 업데이트
 * 특정 파일의 설명 텍스트를 업데이트합니다.
 * 파일 ID를 기반으로 파일 객체를 찾아 설명 속성을 변경합니다.
 * 이 메서드는 주로 설명 입력 필드의 input 이벤트 핸들러에서 호출됩니다.
 * 
 * @private
 * @param {string} fileId - 설명을 업데이트할 파일의 고유 식별자
 * @param {string} description - 새로운 파일 설명 텍스트
 * @returns {void}
 * @example
 * // 파일 설명 업데이트
 * this._updateFileDescription('file-123456', '중요한 문서입니다.');
 */
FileUploader.prototype._updateFileDescription = function(fileId, description) {
    if (!fileId) return;

    const fileObj = this.files.find(f => f.id === fileId);
    if (fileObj) {
        fileObj.description = description;
    }
};

/**
 * 파일 확장자 추출
 * 파일명에서 확장자 부분을 추출합니다.
 * 마지막 점(.) 이후의 문자열을 확장자로 간주합니다.
 * 파일명에 점이 없는 경우 빈 문자열을 반환합니다.
 * 
 * @private
 * @param {string} filename - 확장자를 추출할 파일명
 * @returns {string} 추출된 파일 확장자 (점 제외, 소문자로 변환되지 않음)
 * @example
 * // "document.pdf" 파일의 확장자 추출
 * const ext = this._getFileExtension("document.pdf"); // "pdf"
 * 
 * // "image.JPG" 파일의 확장자 추출
 * const ext2 = this._getFileExtension("image.JPG"); // "JPG"
 */
FileUploader.prototype._getFileExtension = function(filename) {
    return filename.split('.').pop() || '';
};

/**
 * 파일 크기 포맷팅
 * 바이트 단위의 파일 크기를 사람이 읽기 쉬운 형식(Bytes, KB, MB, GB, TB)으로 변환합니다.
 * 적절한 단위를 자동으로 선택하고 소수점 두 자리까지 표시합니다.
 * 
 * @private
 * @param {number} bytes - 변환할 파일 크기(바이트 단위)
 * @returns {string} 포맷팅된 파일 크기 문자열 (예: "1.25 MB", "820 KB")
 * @example
 * // 1500000 바이트를 포맷팅
 * const formattedSize = this._formatFileSize(1500000); // "1.43 MB"
 */
FileUploader.prototype._formatFileSize = function(bytes) {
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
FileUploader.prototype.setFileSeq = function(fileSeq) {
    this.options.fileSeq = fileSeq;
    return this;
};

/**
 * 파일 시퀀스 가져오기
 * 현재 설정된 파일 시퀀스 번호를 반환합니다.
 * 
 * @returns {number|null} 현재 설정된 파일 시퀀스 번호 또는 설정되지 않은 경우 null
 * @example
 * // 파일 시퀀스 가져오기
 * const fileSeq = uploader.getFileSeq();
 * console.log('현재 파일 시퀀스:', fileSeq);
 */
FileUploader.prototype.getFileSeq = function() {
    return this.options.fileSeq;
};

/**
 * 파일 정보 가져오기
 * 현재 업로더에 추가된 모든 파일의 정보와 삭제된 파일 시퀀스를 객체로 반환합니다.
 * 이 메서드는 주로 파일 정보를 서버에 전송하기 전에 데이터를 준비하는 데 사용됩니다.
 *
 * 반환되는 객체는 다음 속성을 포함합니다:
 * - fileInfos: 파일 정보 객체 배열
 * - deleteFileDetailSeqs: 삭제된 파일의 상세 시퀀스 배열
 *
 * fileInfos 배열의 각 객체는 다음 속성을 포함합니다:
 * - fileName: 파일 이름
 * - fileSeq: 파일 시퀀스 번호
 * - fileDetailSeq: 파일 상세 시퀀스 번호
 * - description: 파일 설명
 * - isFromServer: 서버에서 로드된 파일 여부
 *
 * @returns {{fileInfos: Array<{fileName: string, fileSeq: number, fileDetailSeq: number, description: string, isFromServer: boolean}>, deleteFileDetailSeqs: Array<number>}} 파일 정보 객체
 * @example
 * // 파일 정보 가져오기
 * const { fileInfos, deleteFileDetailSeqs } = uploader.getFileInfo();
 * console.log('파일 정보:', fileInfos);
 * console.log('삭제된 파일 시퀀스:', deleteFileDetailSeqs);
 */
FileUploader.prototype.getFileInfo = function() {
    const files = [];
    const createDescriptions = [];
    const modifyFileDetailSeqs = [];
    const modifyDescriptions = [];

    this.files.filter(f => !f.isFromServer).forEach(f => {
        files.push(f.file);
        createDescriptions.push(f.description || '');
    });

    this.files.filter(f => f.isFromServer).forEach(f => {
        modifyFileDetailSeqs.push(f.fileDetailSeq);
        modifyDescriptions.push(f.description || '');
    });

    return {
        fileSeq: this.options.fileSeq,
        files: files,
        createDescriptions: createDescriptions,
        modifyFileDetailSeqs: modifyFileDetailSeqs,
        modifyDescriptions: modifyDescriptions,
        deleteFileDetailSeqs: this.deleteFileDetailSeqs
    };
};

/**
 * FormData 형식으로 파일 데이터 가져오기
 * 현재 업로더에 추가된 모든 파일을 FormData 객체로 변환합니다.
 * 서버에 파일을 업로드할 때 사용할 수 있는 형식입니다.
 * 
 * 이 메서드는 다음 정보를 FormData에 포함합니다:
 * - 'files': 파일 객체 (로컬 파일인 경우)
 * - 'fileInfos': 모든 파일의 메타데이터 (JSON 문자열)
 * - 'deleteFileDetailSeqs': 삭제된 파일 상세 시퀀스 목록 (JSON 문자열)
 * 
 * FormData는 HTTP 요청의 본문으로 사용하여 서버에 파일을 업로드할 수 있습니다.
 * 
 * @returns {FormData} 서버 업로드에 사용할 수 있는 FormData 객체
 * @example
 * // FormData 가져와서 서버에 업로드하기
 * const formData = uploader.getFormData();
 * fetch('/api/upload', {
 *   method: 'POST',
 *   body: formData
 * }).then(response => response.json())
 *   .then(result => console.log('업로드 결과:', result));
 */
FileUploader.prototype.getFormData = function() {
    const formData = new FormData();
    const { fileSeq, files, createDescriptions, modifyFileDetailSeqs, modifyDescriptions, deleteFileDetailSeqs } = this.getFileInfo();

    formData.append('fileSeq', fileSeq || '');

    files.forEach(file => {
        formData.append('files', file);
    });

    createDescriptions.forEach(description => {
        formData.append('createDescriptions', description);
    });

    modifyFileDetailSeqs.forEach(fileDetailSeq => {
        formData.append('modifyFileDetailSeqs', fileDetailSeq);
    });

    modifyDescriptions.forEach(description => {
        formData.append('modifyDescriptions', description);
    });

    deleteFileDetailSeqs.forEach(fileDetailSeq => {
        formData.append('deleteFileDetailSeqs', fileDetailSeq);
    });

    return formData;
};

/**
 * 모든 파일 삭제
 * @private
 */
FileUploader.prototype._clearAllFiles = function() {
    this.files = [];
    this.deleteFileDetailSeqs = [];

    if (this.fileListEl) {
        this.fileListEl.innerHTML = '';
    }

    // 파일 개수 업데이트
    this._updateFileCount();

    // 파일 목록 드롭다운 숨기기
    if (this.fileListEl && this.dropdownHeaderEl && this.fileDropdownEl) {
        this.fileListEl.classList.remove(this.classes.open);
        this.dropdownHeaderEl.classList.remove(this.classes.active);

        // 드롭다운 숨김 처리를 애니메이션 완료 후 진행
        this.fileDropdownEl.style.display = 'none';
    }
};