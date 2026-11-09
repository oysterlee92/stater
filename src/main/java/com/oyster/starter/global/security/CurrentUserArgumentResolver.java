package com.oyster.starter.global.security;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import com.oyster.starter.global.security.annotation.CurrentUser;
import com.oyster.starter.global.utils.AuthenticationUtil;
import com.oyster.starter.domain.user.UserLookupService;

/**
 * CurrentUserArgumentResolver 클래스는 @CurrentUser 주석이 붙은 매개변수를 처리하여
 * 현재 인증된 사용자 정보를 바인딩합니다.
 */

@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final UserLookupService users;

    public CurrentUserArgumentResolver(UserLookupService users) {
        this.users = users;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // supportsParameter 메서드는 매개변수에 @CurrentUser 주석이 붙어있는지 확인합니다.
        return parameter.hasParameterAnnotation(CurrentUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        return AuthenticationUtil.getUser(users);
    }
}
