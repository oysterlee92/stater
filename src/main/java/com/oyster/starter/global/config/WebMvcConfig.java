package com.oyster.starter.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.images-dir}")
    private String imagesDir;

    @Value("${spring.profiles.active:}")
    private String activeProfile;


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