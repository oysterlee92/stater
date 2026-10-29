package com.oyster.starter.global.config;

import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

/** 정적 리소스와 애플리케이션 요청에 적용할 웹 보안 규칙을 구성합니다. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * 공통 위치의 정적 리소스를 Spring Security 필터 체인에서 제외합니다.
     *
     * @return 정적 리소스 요청을 무시하도록 설정한 웹 보안 커스터마이저
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations());
    }

    /**
     * 모든 요청에 HTTPS를 요구하고 나머지 보안 동작을 구성합니다.
     * HTTP Basic 인증과 익명 인증은 비활성화하며, 동일 출처 iframe은 허용하고 요청 인가는 모두 허용합니다.
     *
     * @param http Spring Security 웹 보안 설정 빌더
     * @return 구성된 보안 필터 체인
     * @throws Exception 보안 필터 체인을 구성할 수 없는 경우
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // HTTP Basic 인증 필터를 비활성화합니다.
                .httpBasic(AbstractHttpConfigurer::disable)
                // H2 콘솔은 SQL 실행 요청에 CSRF 토큰을 보내지 않으므로 콘솔 경로만 검증에서 제외합니다.
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**")
                        // 테스트에서는 CSRF 비활성화
                        //.disable()
                )
                // H2 콘솔 등 같은 출처에서 표시해야 하는 iframe을 허용합니다.
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                // HTTP 요청을 HTTPS로 리다이렉트합니다.
                .redirectToHttps(withDefaults())
                // HTTPS 요청의 인가 검사를 통과시키며, 인증 기능 자체를 제공하지는 않습니다.
                .authorizeHttpRequests(authorize -> authorize
                        .anyRequest().permitAll())
                // 익명 인증 객체를 SecurityContext에 생성하지 않습니다.
                .anonymous(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
