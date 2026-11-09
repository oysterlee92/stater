package com.oyster.starter.global.config;

import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.ObjectProvider;
import com.oyster.starter.global.security.JwtUserAuthenticationConverter;
import com.oyster.starter.global.security.LocalOAuth2UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

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

    /** 세션 로그인 비밀번호 검증에 사용할 해시 인코더를 제공합니다. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 모든 요청에 HTTPS를 요구하고 나머지 보안 동작을 구성합니다.
     * HTTP Basic 인증과 익명 인증은 비활성화하며, 동일 출처 iframe은 허용하고 요청 인가는 모두 허용합니다.
     *
     * @param http Spring Security 웹 보안 설정 빌더
     * @param oauth2UserService OAuth2 제공자 사용자 정보를 로컬 User principal로 변환하는 서비스
     * @param jwtUserConverter 검증된 JWT의 sub를 로컬 User principal로 변환하는 컨버터
     * @param registrationsProvider OAuth2 제공자 등록 저장소를 선택적으로 제공하는 객체 공급자
     * @param jwtDecoderProvider JWT 서명과 클레임을 검증하는 디코더를 선택적으로 제공하는 객체 공급자
     * @return 구성된 보안 필터 체인
     * @throws Exception 보안 필터 체인을 구성할 수 없는 경우
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   LocalOAuth2UserService oauth2UserService,
                                                   JwtUserAuthenticationConverter jwtUserConverter,
                                                   ObjectProvider<ClientRegistrationRepository> registrationsProvider,
                                                   ObjectProvider<JwtDecoder> jwtDecoderProvider) throws Exception {
        http
                // HTTP Basic 인증 필터를 비활성화합니다.
                .httpBasic(AbstractHttpConfigurer::disable)
                // H2 콘솔은 SQL 실행 요청에 CSRF 토큰을 보내지 않으므로 콘솔 경로만 검증에서 제외합니다.
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**")
                        // CSRF 비활성화
                        .disable()
                )
                // H2 콘솔 등 같은 출처에서 표시해야 하는 iframe을 허용합니다.
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                // HTTP 요청을 HTTPS로 리다이렉트합니다.
                .redirectToHttps(withDefaults())

                // 폼 로그인과 기본 로그인 페이지를 사용하지 않습니다.
                // .formLogin(AbstractHttpConfigurer::disable)
                // 세션 기반 폼 로그인을 활성화합니다.
                // .formLogin(withDefaults())
                // 인증 상태를 HTTP 세션에 저장하지 않고 매 요청의 Bearer 토큰으로 인증합니다.
                // .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // OAuth2 브라우저 로그인 흐름을 기본값으로 활성화하지 않습니다.
                // OAuth2 제공자가 등록된 경우 아래 조건부 설정에서 필요한 흐름만 다시 구성합니다.
                // .oauth2Login(AbstractHttpConfigurer::disable)

                // HTTPS 요청의 인가 검사를 통과시키며, 인증 기능 자체를 제공하지는 않습니다.
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                // 익명 인증 객체를 SecurityContext에 생성하지 않습니다.
                .anonymous(AbstractHttpConfigurer::disable);

        // OAuth2 제공자 설정이 있을 때만 소셜 로그인을 활성화합니다.
        // 설정이 없으면 빈을 요구하지 않아 로컬 환경에서도 애플리케이션이 시작됩니다.
        ClientRegistrationRepository registrations = registrationsProvider.getIfAvailable();
        if (registrations != null) {
            // 제공자의 사용자 정보에서 sub를 읽어 같은 ID의 로컬 User를 인증 주체로 사용합니다.
            http.oauth2Login(oauth2 -> oauth2.clientRegistrationRepository(registrations)
                    .userInfoEndpoint(userInfo -> userInfo.userService(oauth2UserService)));
        }

        // JWT 검증 설정으로 JwtDecoder 빈이 준비된 경우에만 Bearer 토큰 인증을 활성화합니다.
        JwtDecoder jwtDecoder = jwtDecoderProvider.getIfAvailable();
        if (jwtDecoder != null) {
            // 검증된 JWT의 sub로 로컬 User를 조회해 인증 주체로 변환합니다.
            http.oauth2ResourceServer(resourceServer -> resourceServer
                    .jwt(jwt -> jwt.decoder(jwtDecoder).jwtAuthenticationConverter(jwtUserConverter)));
        }

        return http.build();
    }
}
