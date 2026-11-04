/**
 * Oyster 웹 애플리케이션 유틸리티 라이브러리의 진입점입니다.
 * @module oyster
 * @version 1.0.0
 */

import debug from '@/resource/lib/debug.js';
import storage from '@/resource/lib/storage.js';
import cookie from '@/resource/lib/cookie.js';
import object from '@/resource/lib/object.js';
import date from '@/resource/lib/date.js';
import http from '@/resource/lib/http.js';
import string from '@/resource/lib/string.js';
import array from '@/resource/lib/array.js';
import number from '@/resource/lib/number.js';
import dom from '@/resource/lib/dom.js';
import browser from '@/resource/lib/browser.js';
import url from '@/resource/lib/url.js';
import loading from '@/resource/lib/loading.js';
import FormValidator from '@/resource/lib/formValidator.js';
import Pagination from '@/resource/lib/pagination.js';
import ScrollPagination from '@/resource/lib/scrollPagination.js';
import Carousel from '@/resource/lib/carousel.js';
import FileUploader from '@/resource/lib/fileUploader.js';
import ButtonFileUploader from '@/resource/lib/buttonFileUploader.js';
import PopupView from '@/resource/lib/popupView.js';
import ModuleView from '@/resource/lib/moduleView.js';
import PageView from '@/resource/lib/pageView.js';

/**
 * 라이브러리의 공개 API를 모아 제공하는 네임스페이스입니다.
 * 각 속성은 대응하는 모듈의 기본 내보내기를 그대로 참조합니다.
 * @namespace oyster
 * @property {string} version 라이브러리 버전
 * @property {Object} debug 디버그 로그 유틸리티
 * @property {Object} storage 브라우저 저장소 유틸리티
 * @property {Object} cookie 쿠키 유틸리티
 * @property {Object} object 객체 처리 유틸리티
 * @property {Object} date 날짜 처리 유틸리티
 * @property {Object} http HTTP 요청 유틸리티
 * @property {Object} string 문자열 처리 유틸리티
 * @property {Object} array 배열 처리 유틸리티
 * @property {Object} number 숫자 처리 유틸리티
 * @property {Object} dom DOM 조작 유틸리티
 * @property {Object} browser 브라우저 및 기기 정보 유틸리티
 * @property {Object} url URL 처리 유틸리티
 * @property {Function} loading 로딩 표시 제어 함수
 * @property {Function} FormValidator 폼 유효성 검사 생성자
 * @property {Function} Pagination 페이지네이션 생성자
 * @property {Function} ScrollPagination 무한 스크롤 페이지네이션 생성자
 * @property {Function} Carousel 캐러셀 생성자
 * @property {Function} FileUploader 파일 업로더 생성자
 * @property {Function} ButtonFileUploader 버튼 파일 업로더 생성자
 * @property {Function} PopupView 팝업 뷰 생성자
 * @property {Function} ModuleView 모듈 뷰 생성자
 * @property {Function} PageView 페이지 뷰 생성자
 */
const oyster = {
    /** @type {string} 라이브러리 버전 */
    version: '1.0.0',
    /** @type {Object} 디버그 로그 유틸리티. @see debug.js */
    debug,
    /** @type {Object} 브라우저 저장소 유틸리티. @see storage.js */
    storage,
    /** @type {Object} 쿠키 유틸리티. @see cookie.js */
    cookie,
    /** @type {Object} 객체 처리 유틸리티. @see object.js */
    object,
    /** @type {Object} 날짜 처리 유틸리티. @see date.js */
    date,
    /** @type {Object} HTTP 요청 유틸리티. @see http.js */
    http,
    /** @type {Object} 문자열 처리 유틸리티. @see string.js */
    string,
    /** @type {Object} 배열 처리 유틸리티. @see array.js */
    array,
    /** @type {Object} 숫자 처리 유틸리티. @see number.js */
    number,
    /** @type {Object} DOM 조작 유틸리티. @see dom.js */
    dom,
    /** @type {Object} 브라우저 및 기기 정보 유틸리티. @see browser.js */
    browser,
    /** @type {Object} URL 처리 유틸리티. @see url.js */
    url,
    /** @type {Function} 로딩 표시를 생성하고 제어하는 함수. @see loading.js */
    loading,
    /** @type {Function} 폼 유효성 검사 생성자. @see formValidator.js */
    FormValidator,
    /** @type {Function} 페이지네이션 생성자. @see pagination.js */
    Pagination,
    /** @type {Function} 무한 스크롤 페이지네이션 생성자. @see scrollPagination.js */
    ScrollPagination,
    /** @type {Function} 캐러셀 생성자. @see carousel.js */
    Carousel,
    /** @type {Function} 파일 업로더 생성자. @see fileUploader.js */
    FileUploader,
    /** @type {Function} 버튼 파일 업로더 생성자. @see buttonFileUploader.js */
    ButtonFileUploader,
    /** @type {Function} 팝업 뷰 생성자. @see popupView.js */
    PopupView,
    /** @type {Function} 모듈 뷰 생성자. @see moduleView.js */
    ModuleView,
    /** @type {Function} 페이지 뷰 생성자. @see pageView.js */
    PageView,
};

/**
 * 공개 API 속성을 변경할 수 없도록 고정합니다.
 * 속성 값이 참조하는 객체 내부의 변경 가능성은 각 모듈의 구현을 따릅니다.
 * @private
 */
Object.keys(oyster).forEach(key => {
    const value = oyster[key];
    Object.defineProperty(oyster, key, {
        value,
        writable: false,
        enumerable: true,
        configurable: false,
    });
});

/** 라이브러리 공개 API를 기본 내보내기로 제공합니다. @exports oyster */
export default oyster;
