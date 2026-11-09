package com.oyster.starter.global.xss;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import com.oyster.starter.global.security.annotation.CurrentUser;

import java.lang.reflect.Type;

/**
 * {@code @RequestBody}로 바인딩되는 요청 본문에 XSS 필터링을 적용하는 Advice입니다.
 * <p>
 * Jackson이 JSON 요청 본문을 DTO로 역직렬화한 이후 실행되며,
 * DTO 필드에 선언된 XSS 관련 어노테이션을 기준으로 문자열 값을 필터링합니다.
 * </p>
 * <p>
 * 단순 문자열 요청 본문은 메서드 파라미터 어노테이션을 기준으로 필터링하고,
 * DTO 요청 본문은 {@link XssObjectSanitizer}를 통해 객체 내부 필드를 재귀적으로 처리합니다.
 * </p>
 */
@Slf4j
@ControllerAdvice
@RequiredArgsConstructor
public class XssRequestBodyAdvice extends RequestBodyAdviceAdapter {

    private final XssObjectSanitizer xssObjectSanitizer;

    /**
     * 현재 요청 본문 파라미터가 XSS 필터링 적용 대상인지 판단합니다.
     * <p>
     * 인증 주체 주입용 파라미터인 {@link AuthenticationPrincipal}, {@link CurrentUser}는
     * 요청 본문 DTO가 아니므로 필터링 대상에서 제외합니다.
     * </p>
     * <p>
     * 파라미터 타입이 {@link String}이거나 애플리케이션 DTO로 판단되는 경우에만
     * {@link #afterBodyRead(Object, HttpInputMessage, MethodParameter, Type, Class)}에서
     * 실제 필터링을 수행합니다.
     * </p>
     *
     * @param methodParameter 컨트롤러 메서드 파라미터 정보
     * @param targetType      요청 본문이 변환될 대상 타입
     * @param converterType   요청 본문 변환에 사용되는 메시지 컨버터 타입
     * @return XSS 필터링 적용 대상이면 {@code true}, 제외 대상이면 {@code false}
     */
    @Override
    public boolean supports(MethodParameter methodParameter,
                            Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {

        if (methodParameter.hasParameterAnnotation(AuthenticationPrincipal.class) ||
                methodParameter.hasParameterAnnotation(CurrentUser.class)) {
            return false;
        }

        Class<?> parameterType = methodParameter.getParameterType();

        return parameterType == String.class || xssObjectSanitizer.isTargetDtoClass(parameterType);
    }

    /**
     * 요청 본문이 객체로 변환된 이후 XSS 필터링을 수행합니다.
     * <p>
     * 본문이 문자열이면 파라미터 어노테이션에서 XSS 정책을 추출해 문자열 자체를 필터링합니다.
     * DTO 객체이면 객체 내부의 문자열 필드, 컬렉션, 맵, 중첩 DTO를 순회하며 필터링합니다.
     * </p>
     * <p>
     * DTO 필터링 중 오류가 발생하더라도 요청 처리가 중단되지 않도록 오류 로그를 남기고
     * 원본 body 객체를 반환합니다.
     * </p>
     *
     * @param body          메시지 컨버터가 변환한 요청 본문 객체
     * @param inputMessage  원본 HTTP 입력 메시지
     * @param parameter     컨트롤러 메서드 파라미터 정보
     * @param targetType    요청 본문이 변환된 대상 타입
     * @param converterType 요청 본문 변환에 사용된 메시지 컨버터 타입
     * @return XSS 필터링이 적용된 요청 본문 객체
     */
    @Override
    public Object afterBodyRead(Object body,
                                HttpInputMessage inputMessage,
                                MethodParameter parameter,
                                Type targetType,
                                Class<? extends HttpMessageConverter<?>> converterType) {

        if (body == null) {
            return null;
        }

        if (body instanceof String value) {
            XssFilterPolicy policy = XssFilterPolicy.fromParameter(parameter);
            return xssObjectSanitizer.sanitize(value, policy);
        }

        try {
            xssObjectSanitizer.sanitize(body);
        } catch (Exception e) {
            log.error("@RequestBody XSS 필터링 중 오류 발생: {}", body.getClass().getName(), e);
        }

        return body;
    }
}
