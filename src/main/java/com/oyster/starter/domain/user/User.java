/** 로컬 계정과 Spring Security 인증 주체로 사용하는 사용자 엔티티. */
package com.oyster.starter.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** JWT sub, 세션 로그인, OAuth2 로그인에서 공통으로 사용하는 사용자입니다. */
@Entity
@Table(name = "app_user")
public class User implements UserDetails, OAuth2User {

    @Id
    @Column(length = 200)
    private String id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Transient
    private Map<String, Object> attributes = Map.of();

    protected User() {
    }

    public User(String id, String username, String passwordHash) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public String getId() { return id; }

    /** 세션 인증에서 계정을 식별하는 로그인 이름을 반환합니다. */
    @Override
    public String getUsername() { return username; }

    @Override
    public String getName() { return username; }

    @Override
    public Map<String, Object> getAttributes() { return attributes; }

    public void setAttributes(Map<String, Object> attributes) { this.attributes = Map.copyOf(attributes); }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
