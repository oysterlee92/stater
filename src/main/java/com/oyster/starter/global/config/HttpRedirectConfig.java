package com.oyster.starter.global.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;


/** SSL 활성화 여부에 따라 HTTP 요청을 HTTPS로 리다이렉트하는 Tomcat 커넥터를 구성합니다. */
@Configuration
public class HttpRedirectConfig {

    @Value("${server.http.port}")
    private int httpPort;

    @Value("${server.port}")
    private int httpsPort;

    @Autowired
    private Environment environment;


    /**
     * {@code server.ssl.enabled}가 {@code true}일 때 HTTP 포트 커넥터를 추가해 HTTPS로 리다이렉트합니다.
     *
     * @return SSL 활성화 시 HTTP 커넥터를 추가하는 웹 서버 커스터마이저
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> servletContainerCustomizer() {
        return container -> {
            // SSL이 꺼진 환경에서는 리다이렉션 대상 HTTPS 포트가 없으므로 커넥터를 추가하지 않습니다.
            if (Boolean.parseBoolean(environment.getProperty("server.ssl.enabled", "false"))) {
                container.addAdditionalConnectors(createHttpConnector());
            }
        };
    }


    /**
     * {@code server.http.port}에서 수신하고, 보안이 필요한 요청을 {@code server.port}로 리다이렉트하는 커넥터를 생성합니다.
     *
     * @return HTTP에서 HTTPS로 리다이렉트하도록 설정된 Tomcat 커넥터
     */
    private Connector createHttpConnector() {
        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
        connector.setScheme("http");
        connector.setPort(httpPort);
        connector.setSecure(false);
        connector.setRedirectPort(httpsPort);
        return connector;
    }
}
