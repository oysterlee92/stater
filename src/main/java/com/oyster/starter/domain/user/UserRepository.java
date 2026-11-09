/** 로컬 사용자 엔티티 조회를 제공하는 Repository. */
package com.oyster.starter.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** 사용자 ID와 로그인 이름으로 계정을 조회합니다. */
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
}
