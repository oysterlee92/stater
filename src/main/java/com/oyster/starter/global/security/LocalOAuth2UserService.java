/** OAuth2 계정 ID를 로컬 사용자 principal로 변환하는 서비스. */
package com.oyster.starter.global.security;

import com.oyster.starter.domain.user.User;
import com.oyster.starter.domain.user.UserLookupService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/** OAuth2 제공자의 sub를 로컬 사용자 ID로 사용해 공통 User를 반환합니다. */
@Service
public class LocalOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final UserLookupService users;

    public LocalOAuth2UserService(UserLookupService users) {
        this.users = users;
    }

    /** 제공자 프로필을 가져와 sub에 대응하는 로컬 사용자를 principal로 반환합니다. */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User providerUser = delegate.loadUser(request);
        Object subject = providerUser.getAttribute("sub");
        if (subject == null) {
            throw new OAuth2AuthenticationException("OAuth2 사용자 정보에 sub가 없습니다.");
        }
        User user = users.findById(subject.toString());
        user.setAttributes(providerUser.getAttributes());
        return user;
    }
}
