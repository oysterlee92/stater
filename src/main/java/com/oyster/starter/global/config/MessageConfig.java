package com.oyster.starter.global.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

@Configuration
public class MessageConfig {

    /**
     * 메시지 소스를 등록하고 기본 파일 경로를 설정합니다.
     * @return MessageSource
     */
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages"); // messages.properties 파일 경로 지정
        messageSource.setDefaultEncoding("UTF-8"); // 한글 메시지 처리를 위한 UTF-8 설정
        return messageSource;
    }
}
