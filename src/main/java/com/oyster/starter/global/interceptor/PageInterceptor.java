package com.oyster.starter.global.interceptor;

import com.oyster.starter.global.utils.DeviceUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;


import java.util.Map;

/** 화면 응답 모델에 기기 정보와 검색 엔진용 페이지 메타데이터를 추가합니다. */
@Component
public class PageInterceptor implements HandlerInterceptor {

    private static final String DEFAULT_TITLE = "기본 타이틀";
    private static final String DEFAULT_DESCRIPTION = "기본 설명";
    private static final String DEFAULT_KEYWORDS = "키워드";
    private static final String DEFAULT_IMAGE = "";

    @Value("${server.url}")
    private String serverUrl;

    /** 렌더링할 화면 응답에 기기, 현재 주소, 기본값이 보완된 메타데이터를 추가합니다.
     *
     * <p>뷰가 없거나 리다이렉트 응답이면 화면 모델이 없으므로 변경하지 않습니다.</p>
     *
     * @param request 현재 HTTP 요청
     * @param response 현재 HTTP 응답
     * @param handler 선택된 요청 처리기
     * @param modelAndView 렌더링할 뷰와 모델, 응답 종류에 따라 {@code null}일 수 있음
     */
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable ModelAndView modelAndView) {
        // ModelAndView가 null이거나 view가 없으면 처리하지 않음 (API 응답 등)
        if (modelAndView == null || modelAndView.getViewName() == null) {
            return;
        }

        // redirect 요청은 처리하지 않음
        if (modelAndView.getViewName().startsWith("redirect:")) {
            return;
        }

        // 디바이스 설정
        DeviceUtil.DeviceType deviceType = DeviceUtil.getDeviceType(request);
        String device = switch (deviceType) {
            case MOBILE -> "mobile";
            case TABLET, DESKTOP -> "pc";
            default -> "";
        };
        modelAndView.addObject("device", device);

        // 현재 URL 설정
        String currentUrl = request.getRequestURI();
        String queryString = request.getQueryString();
        if (queryString != null) {
            currentUrl += "?" + queryString;
        }
        modelAndView.addObject("currentUrl", serverUrl + currentUrl);

        Map<String, Object> model = modelAndView.getModel();

        String title = DEFAULT_TITLE;
        if (model.containsKey("title")) {
            String modelTitle = (String) model.get("title");
            if (StringUtils.hasText(modelTitle)) {
                title = title + " - " + modelTitle;
            }
        }
        modelAndView.addObject("title", title);

        String description = DEFAULT_DESCRIPTION;
        if (model.containsKey("description")) {
            String modelDescription = (String) model.get("description");
            if (StringUtils.hasText(modelDescription)) {
                description = modelDescription;
            }
        }
        modelAndView.addObject("description", description);

        String keywords = DEFAULT_KEYWORDS;
        if (model.containsKey("keywords")) {
            String modelKeywords = (String) model.get("keywords");
            if (StringUtils.hasText(modelKeywords)) {
                keywords = modelKeywords;
            }
        }
        modelAndView.addObject("keywords", keywords);

        String image = DEFAULT_IMAGE;
        if (model.containsKey("image")) {
            String modelImage = (String) model.get("image");
            if (StringUtils.hasText(modelImage)) {
                image = modelImage;
            }
        }

        image = serverUrl + image;
        modelAndView.addObject("image", image);
    }
}
