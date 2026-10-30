package com.oyster.starter.global.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Vite 빌드 매니페스트를 읽고 템플릿에서 사용할 에셋 경로를 제공합니다. */
@Configuration
@Slf4j
public class ViteManifestConfig {

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    /** 매니페스트를 읽는 리소스 로더와 Jackson 설정을 주입합니다.
     *
     * @param resourceLoader 클래스패스 매니페스트 리소스 로더
     * @param objectMapper 애플리케이션의 JSON 역직렬화 설정
     */
    public ViteManifestConfig(ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
    }

    /**
     * 배포 프로필에서 Vite 매니페스트를 읽어 Bean으로 등록합니다.
     *
     * @return 엔트리 이름을 키로, manifest 항목을 값으로 갖는 맵. 로컬 프로필이거나 파일을 읽지 못하면 빈 맵
     */
    @Bean
    public Map<String, ManifestEntry> viteManifest() {
        // 개발 환경에서는 매니페스트가 필요 없음
        if (activeProfile.isEmpty()) {
            return Collections.emptyMap();
        }

        try {
            Resource resource = resourceLoader.getResource("classpath:/static/.vite/manifest.json");
            if (!resource.exists()) {
                log.warn("Vite manifest.json not found. Make sure to run 'npm run build' in the frontend directory.");
                return Collections.emptyMap();
            }
            try (InputStream inputStream = resource.getInputStream()) {
                return objectMapper.readValue(inputStream, new TypeReference<>() {});
            }
        } catch (IOException e) {
            log.error("Error reading Vite manifest", e);
            return Collections.emptyMap();
        }
    }

    /**
     * 템플릿에서 사용할 Vite 에셋 경로 조회 객체를 Bean으로 등록합니다.
     *
     * @param viteManifest Vite 매니페스트 맵
     * @return Vite 에셋 경로 제공 객체
     */
    @Bean
    public ViteAssetResolver viteAssetResolver(Map<String, ManifestEntry> viteManifest) {
        return new ViteAssetResolver(viteManifest);
    }

    /** 매니페스트 항목을 템플릿에서 사용할 URL 경로로 변환합니다. */
    public static class ViteAssetResolver {
        private final Map<String, ManifestEntry> manifest;

        /** 에셋 조회에 사용할 매니페스트를 보관합니다.
         *
         * @param manifest 엔트리 이름과 Vite 빌드 결과를 연결하는 맵
         */
        public ViteAssetResolver(Map<String, ManifestEntry> manifest) {
            this.manifest = manifest;
        }

        /**
         * 매니페스트에서 에셋의 실제 경로를 조회합니다.
         *
         * @param entryName 원본 에셋 키 (예: {@code src/main.js})
         * @return 애플리케이션 루트 기준 빌드 파일 경로 또는 키가 없을 때 {@code null}
         */
        public String getAssetPath(String entryName) {
            ManifestEntry entry = manifest.get(entryName);
            return (entry != null) ? "/" + entry.getFile() : null;
        }

        /**
         * 특정 에셋에 연결된 CSS 파일의 경로 목록을 조회합니다.
         *
         * @param entryName 원본 에셋 키 (예: {@code src/main.js})
         * @return 애플리케이션 루트 기준 CSS 경로 목록. 키가 없거나 CSS가 없으면 빈 목록
         */
        public List<String> getJsAssetCssPath(String entryName) {
            ManifestEntry entry = manifest.get(entryName);
            if (entry != null && entry.getCss() != null) {
                return entry.getCss().stream().map(path -> "/" + path).collect(Collectors.toList());
            }
            return Collections.emptyList();
        }
    }

    /** Vite manifest 항목에서 템플릿 렌더링에 필요한 파일 정보를 보관합니다. */
    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ManifestEntry {
        private String file;
        private String name;
        private String src;
        private boolean isEntry;
        private List<String> css;
    }

}
