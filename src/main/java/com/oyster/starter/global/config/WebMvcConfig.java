package com.oyster.starter.global.config;

import com.oyster.starter.global.interceptor.PageInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** 웹 요청 인터셉터와 프로필별 정적 리소스 경로를 설정합니다. */
@Configuration

@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.images-dir}")
    private String imagesDir;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    private final PageInterceptor pageInterceptor;

    /**
     * 화면 요청에 페이지 메타데이터 인터셉터를 적용하고 정적 리소스와 API는 제외합니다.
     *
     * @param registry 요청 경로별 인터셉터를 등록하는 레지스트리
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(pageInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/thumbnail/**", "/api/**", "/css/**", "/js/**", "/images/**", "/fonts/**", "/icon/**");
    }

    /**
     * 실행 프로필에 따라 업로드 파일 또는 클래스패스 리소스 경로와 캐시 정책을 등록합니다.
     *
     * @param registry 정적 리소스 핸들러를 등록하는 레지스트리
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 로컬일 경우
        if (activeProfile.isEmpty()) {
            // thumbnail 경로 설정
            registry.addResourceHandler("/thumbnail/**")
                    .addResourceLocations(uploadDir)
                    .setCachePeriod(3600); // 1시간 캐싱

            // images 경로 설정
            registry.addResourceHandler("/images/**")
                    .addResourceLocations(imagesDir)
                    .setCachePeriod(3600); // 1시간 캐싱
        } else {
            // 운영 환경 정적 리소스 캐시 설정
            registry.addResourceHandler("/assets/**")
                    .addResourceLocations("classpath:/static/assets/")
                    .setCacheControl(CacheControl.maxAge(365, java.util.concurrent.TimeUnit.DAYS)
                            .cachePublic());

            registry.addResourceHandler("/fonts/**")
                    .addResourceLocations("classpath:/static/fonts/")
                    .setCacheControl(CacheControl.maxAge(365, java.util.concurrent.TimeUnit.DAYS)
                            .cachePublic());

            registry.addResourceHandler("/icon/**")
                    .addResourceLocations("classpath:/static/icon/")
                    .setCacheControl(CacheControl.maxAge(365, java.util.concurrent.TimeUnit.DAYS)
                            .cachePublic());

            registry.addResourceHandler("/images/**")
                    .addResourceLocations("classpath:/static/images/")
                    .setCacheControl(CacheControl.maxAge(30, java.util.concurrent.TimeUnit.DAYS)
                            .cachePublic());
        }
    }
}
