package com.oyster.starter.global.utils;

import com.oyster.starter.domain.user.User;
import com.oyster.starter.domain.user.UserLookupService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.jwt.Jwt;

/** 현재 인증 정보에서 로컬 사용자와 인증 상태를 조회하는 유틸리티. */
public final class AuthenticationUtil {

    private AuthenticationUtil() {
    }

    /**
     * 현재 보안 컨텍스트에 인증된 Authentication이 있는지 확인합니다.
     *
     * @return 인증 객체가 있고 인증 상태이면 true
     */
    public static boolean isAuthenticated() {
        Authentication authentication = getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }

    /**
     * 현재 스레드의 보안 컨텍스트에서 인증 객체를 조회합니다.
     *
     * @return 현재 인증 객체, 없으면 null
     */
    public static Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /**
     * 현재 principal을 로컬 사용자로 변환합니다.
     * JWT와 OAuth2는 sub로, 일반 UserDetails는 로그인 이름으로 조회합니다.
     *
     * @param users 로컬 사용자 조회 서비스
     * @return 로컬 사용자, 인증되지 않았거나 지원하지 않는 principal이면 null
     * @throws UsernameNotFoundException principal에 해당하는 로컬 사용자가 없을 때
     */
    public static User getUser(UserLookupService users) {
        if (!isAuthenticated()) return null;

        Object principal = getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        if (principal instanceof Jwt jwt && jwt.getSubject() != null) {
            return users.findById(jwt.getSubject());
        }
        if (principal instanceof UserDetails userDetails) {
            return users.loadUserByUsername(userDetails.getUsername());
        }
        if (principal instanceof OAuth2User oauth2User && oauth2User.getAttribute("sub") != null) {
            return users.findById(oauth2User.getAttribute("sub").toString());
        }
        return null;
    }
}
