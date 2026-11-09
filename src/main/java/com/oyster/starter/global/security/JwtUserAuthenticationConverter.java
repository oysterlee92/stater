/** 검증된 JWT를 로컬 User principal로 변환하는 Converter. */
package com.oyster.starter.global.security;

import com.oyster.starter.domain.user.User;
import com.oyster.starter.domain.user.UserLookupService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/** JWT sub로 계정을 조회하고 JWT의 authorities와 로컬 사용자 principal을 결합합니다. */
@Component
public class JwtUserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final UserLookupService users;

    public JwtUserAuthenticationConverter(UserLookupService users) {
        this.users = users;
    }

    /** sub가 없는 토큰이나 로컬 계정이 없는 토큰은 인증 principal로 변환하지 않습니다. */
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("JWT sub claim이 필요합니다.");
        }
        User user = users.findById(subject);
        return UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities());
    }
}
