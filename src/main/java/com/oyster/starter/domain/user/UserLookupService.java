/** 인증 주체를 로컬 사용자 엔티티로 연결하는 서비스. */
package com.oyster.starter.domain.user;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 세션 로그인과 OAuth2/JWT 주체 변환에서 사용자 저장소 접근을 공통화합니다. */
@Service
public class UserLookupService implements UserDetailsService {
    private final UserRepository userRepository;

    public UserLookupService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** ID로 사용자를 조회하며 계정이 없으면 인증 실패를 반환합니다. */
    @Transactional(readOnly = true)
    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
    }

    /** 사용자 이름으로 세션 로그인 계정을 조회합니다. */
    @Override
    @Transactional(readOnly = true)
    public User loadUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
