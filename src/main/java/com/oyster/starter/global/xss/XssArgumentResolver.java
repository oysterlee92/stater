package com.oyster.starter.global.xss;

import com.oyster.starter.global.security.annotation.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.mvc.method.annotation.ServletModelAttributeMethodProcessor;

/**
 * XSS 필터링을 처리하는 통합 ArgumentResolver
 * <p>
 * 1. String 파라미터에 XSS 어노테이션이 있는 경우 직접 처리
 * 2. DTO 파라미터의 필드에 어노테이션 기반 XSS 필터링 적용
 * </p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class XssArgumentResolver implements HandlerMethodArgumentResolver {

    // Spring 기본 처리기에 위임
    private final ServletModelAttributeMethodProcessor delegate = new ServletModelAttributeMethodProcessor(false);

    private final XssObjectSanitizer xssObjectSanitizer;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // Spring Security 및 커스텀 인증 관련 어노테이션은 처리하지 않음
        if (parameter.hasParameterAnnotation(AuthenticationPrincipal.class) ||
                parameter.hasParameterAnnotation(CurrentUser.class)) {
            return false;
        }

        // @RequestBody는 XssRequestBodyAdvice에서 처리하므로 제외
        if (parameter.hasParameterAnnotation(RequestBody.class)) {
            return false;
        }

        Class<?> paramType = parameter.getParameterType();

        // 1. 모든 String 타입 파라미터 처리 (어노테이션 없어도 기본 XSS 필터링)
        if (paramType == String.class) {
            return true;
        }

        // 2. DTO 클래스 (java.*, jakarta.* 등 제외)
        return xssObjectSanitizer.isTargetDtoClass(paramType);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) throws Exception {

        Class<?> paramType = parameter.getParameterType();

        // 1. String 파라미터 처리
        if (paramType == String.class) {
            return resolveStringParameter(parameter, webRequest);
        }

        // 2. DTO 파라미터 처리
        return resolveDtoParameter(parameter, mavContainer, webRequest, binderFactory);
    }

    /**
     * String 파라미터를 처리합니다.
     * 어노테이션이 없으면 기본 GENERAL 정책(모든 HTML 제거)을 적용합니다.
     */
    private Object resolveStringParameter(MethodParameter parameter, NativeWebRequest webRequest) {
        String paramName = parameter.getParameterName();
        String value = webRequest.getParameter(paramName);

        if (value == null || value.isEmpty()) {
            return value;
        }

        XssFilterPolicy policy = XssFilterPolicy.fromParameter(parameter);
        String sanitized = xssObjectSanitizer.sanitize(value, policy);

        if (log.isDebugEnabled() && !value.equals(sanitized)) {
            log.debug("XSS 필터링 적용 - 파라미터: {}, 정책: {}", paramName, policy);
        }

        return sanitized;
    }

    /**
     * DTO 파라미터를 처리합니다.
     */
    private Object resolveDtoParameter(MethodParameter parameter,
                                       ModelAndViewContainer mavContainer,
                                       NativeWebRequest webRequest,
                                       WebDataBinderFactory binderFactory) throws Exception {

        // 1. Spring 기본 방식으로 DTO 생성 및 바인딩
        Object dto = delegate.resolveArgument(parameter, mavContainer, webRequest, binderFactory);

        if (dto == null) {
            return null;
        }

        // 2. DTO 필드에 어노테이션 기반 XSS 필터링 적용
        try {
            xssObjectSanitizer.sanitize(dto);
        } catch (Exception e) {
            log.error("DTO XSS 필터링 중 오류 발생: {}", dto.getClass().getName(), e);
            return dto;
        }

        return dto;
    }
}
