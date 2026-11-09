package com.oyster.starter.global.utils;

import org.apache.commons.text.StringEscapeUtils;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.stereotype.Component;


/**
 * XSS 방지 유틸리티 클래스.
 */
@Component( "xssUtil")
public class XssUtil {

    // ... (내부 정책 코드는 이전과 동일)
    private static final PolicyFactory GENERAL_POLICY = new HtmlPolicyBuilder().toFactory();

    private static final PolicyFactory SIMPLE_FORMAT_POLICY = Sanitizers.FORMATTING
            .and(Sanitizers.BLOCKS)
            .and(Sanitizers.LINKS)
            .and(new HtmlPolicyBuilder().allowElements("br")
            .toFactory());

    private static final PolicyFactory EDITOR_POLICY = SIMPLE_FORMAT_POLICY
            .and(Sanitizers.TABLES)
            .and(Sanitizers.STYLES)
            .and(Sanitizers.IMAGES)
            .and(new HtmlPolicyBuilder()
                // 링크 속성 확장 (새 창 열기 등)
                .allowAttributes("target", "rel").onElements("a")
                // 코드 블럭 지원
                .allowElements("pre", "code", "hr")
                // 공통 속성 허용
                .allowAttributes("class", "id", "data-language", "data-line", "data-nodeid").globally()
                .toFactory()
            );

    /**
     * 일반 입력값에 대한 XSS 필터링을 수행하며, 모든 HTML 태그를 제거합니다.
     * 순수 텍스트만 필요한 사용자 이름, 검색어 등에 사용합니다.
     * * @param untrustedHtml 신뢰할 수 없는 HTML 문자열
     * @return 모든 HTML이 제거된 안전한 텍스트
     * * <p><b>사용 예시:</b></p>
     * <pre>
     * 입력: "<b>홍길동</b><script>alert('xss');</script>"
     * 결과: "홍길동"
     * </pre>
     */
    public static String sanitizeGeneral(String untrustedHtml) {
        if (untrustedHtml == null) return null;
        return GENERAL_POLICY.sanitize(untrustedHtml);
    }

    /**
     * 단순 서식(굵게, 목록 등)이 필요한 콘텐츠에 대한 XSS 필터링을 수행합니다.
     * 테이블 태그는 허용하지 않으며, 댓글이나 간단한 설명 등에 적합합니다.
     * * @param untrustedHtml 신뢰할 수 없는 HTML 문자열
     * @return 기본 서식과 링크만 허용된 안전한 HTML
     * * <p><b>사용 예시:</b></p>
     * <pre>
     * 입력: "<p><b>안녕</b></p> <ul><li>목록</li></ul> <script>alert('xss')</script> <table><tr><td>표</td></tr></table>"
     * 결과: "<p><b>안녕</b></p> <ul><li>목록</li></ul> 표"
     * </pre>
     */
    public static String sanitizeSimple(String untrustedHtml) {
        if (untrustedHtml == null) return null;
        return SIMPLE_FORMAT_POLICY.sanitize(untrustedHtml);
    }

    /**
     * 이미지, 테이블을 포함한 범용 웹 에디터 콘텐츠에 대한 XSS 필터링을 수행합니다.
     * 게시판 본문, 상품 설명 등 대부분의 WYSIWYG 에디터에 사용합니다.
     * * @param untrustedHtml 신뢰할 수 없는 HTML 문자열
     * @return 이미지, 테이블까지 허용된 안전한 HTML
     * * <p><b>사용 예시:</b></p>
     * <pre>
     * 입력: "<p>콘텐츠</p><img src='x' onerror='alert(\"xss\")'> <table><tr><td>표</td></tr></table>"
     * 결과: "<p>콘텐츠</p><img src="x" /> <table><tbody><tr><td>표</td></tr></tbody></table>"
     * </pre>
     */
    public static String sanitizeEditor(String untrustedHtml) {
        if (untrustedHtml == null) return null;
        return EDITOR_POLICY.sanitize(untrustedHtml);
    }

    /**
     * HTML 특수문자를 HTML 엔티티로 변환 (Escape)
     * 예: <p> -> &lt;p&gt;
     */
    public static String encode(String text) {
        if (text == null) return null;
        return StringEscapeUtils.escapeHtml4(text);
    }

    /**
     * HTML 엔티티를 원래의 특수문자로 역변환 (Unescape)
     * 예: &lt;p&gt; -> <p>
     */
    public static String decode(String encodedText) {
        if (encodedText == null) return null;
        return StringEscapeUtils.unescapeHtml4(encodedText);
    }
}