package com.oyster.starter.global.xss;

import com.oyster.starter.global.utils.XssUtil;
import com.oyster.starter.global.xss.annotation.XssEditor;
import com.oyster.starter.global.xss.annotation.XssExclude;
import com.oyster.starter.global.xss.annotation.XssSimple;
import org.springframework.core.MethodParameter;

import java.lang.reflect.Field;

/**
 * XSS 필터링 정책 열거형
 * <p>
 * JSON 요청과 Form Data 요청 모두에서 공통으로 사용됩니다.
 * </p>
 *
 * @see XssRequestBodyAdvice
 * @see XssArgumentResolver
 */
public enum XssFilterPolicy {

    /** 필터링 제외 (원본 유지) */
    EXCLUDE,

    /** 기본 서식만 허용 (굵게, 목록, 링크) */
    SIMPLE,

    /** 에디터 콘텐츠 허용 (이미지, 테이블 포함) */
    EDITOR,

    /** 기본 필터링 (모든 HTML 제거) */
    GENERAL;

    /**
     * 정책에 따라 XSS 필터링을 적용합니다.
     *
     * @param value 필터링할 문자열
     * @return 필터링된 문자열
     */
    public String sanitize(String value) {
        if (value == null) {
            return null;
        }

        return switch (this) {
            case EXCLUDE -> value;
            case EDITOR -> XssUtil.sanitizeEditor(value);
            case SIMPLE -> XssUtil.sanitizeSimple(value);
            case GENERAL -> XssUtil.sanitizeGeneral(value);
        };
    }

    /**
     * 메서드 파라미터에 적용된 XSS 어노테이션으로부터 필터링 정책을 결정합니다.
     * <p>
     * 우선순위: XssExclude > XssEditor > XssSimple > GENERAL
     * </p>
     *
     * @param parameter 대상 메서드 파라미터
     * @return 결정된 필터링 정책
     */
    public static XssFilterPolicy fromParameter(MethodParameter parameter) {
        if (parameter == null) {
            return GENERAL;
        }

        return determine(
                parameter.getParameterAnnotation(XssExclude.class),
                parameter.getParameterAnnotation(XssSimple.class),
                parameter.getParameterAnnotation(XssEditor.class)
        );
    }

    /**
     * 어노테이션으로부터 필터링 정책을 결정합니다.
     * <p>
     * 우선순위: XssExclude > XssEditor > XssSimple > GENERAL
     * </p>
     *
     * @param exclude XssExclude 어노테이션
     * @param simple  XssSimple 어노테이션
     * @param editor  XssEditor 어노테이션
     * @return 결정된 필터링 정책
     */
    private static XssFilterPolicy determine(XssExclude exclude, XssSimple simple, XssEditor editor) {
        if (exclude != null) return EXCLUDE;
        if (editor != null) return EDITOR;
        if (simple != null) return SIMPLE;
        return GENERAL;
    }

    /**
     * 필드에 적용된 어노테이션으로부터 필터링 정책을 결정합니다.
     *
     * @param field 대상 필드
     * @return 결정된 필터링 정책
     */
    public static XssFilterPolicy fromField(Field field) {
        if (field.isAnnotationPresent(XssExclude.class)) return EXCLUDE;
        if (field.isAnnotationPresent(XssEditor.class)) return EDITOR;
        if (field.isAnnotationPresent(XssSimple.class)) return SIMPLE;
        return GENERAL;
    }
}
