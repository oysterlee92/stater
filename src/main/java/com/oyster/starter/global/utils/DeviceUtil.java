package com.oyster.starter.global.utils;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 디바이스 정보 관련 유틸리티 클래스.
 * User-Agent를 기반으로 디바이스 종류, 브라우저, OS 정보를 제공합니다.
 */
public class DeviceUtil {

    // 인스턴스화 방지
    private DeviceUtil() {
    }

    // ========== 디바이스 타입 ==========

    /**
     * 디바이스 타입 열거형
     */
    public enum DeviceType {
        MOBILE("Mobile"),
        TABLET("Tablet"),
        DESKTOP("Desktop"),
        UNKNOWN("Unknown");

        private final String displayName;

        DeviceType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * 브라우저 타입 열거형
     */
    public enum BrowserType {
        CHROME("Chrome"),
        FIREFOX("Firefox"),
        SAFARI("Safari"),
        EDGE("Edge"),
        OPERA("Opera"),
        IE("Internet Explorer"),
        SAMSUNG_BROWSER("Samsung Browser"),
        UNKNOWN("Unknown");

        private final String displayName;

        BrowserType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * OS 타입 열거형
     */
    public enum OsType {
        WINDOWS("Windows"),
        MAC_OS("macOS"),
        LINUX("Linux"),
        ANDROID("Android"),
        IOS("iOS"),
        UNKNOWN("Unknown");

        private final String displayName;

        OsType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // ========== User-Agent 가져오기 ==========

    /**
     * HttpServletRequest에서 User-Agent 헤더를 가져옵니다.
     *
     * @param request HTTP 요청
     * @return User-Agent 문자열, 없으면 빈 문자열
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * String userAgent = DeviceUtil.getUserAgent(request);
     * </pre>
     */
    public static String getUserAgent(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "";
    }

    // ========== 디바이스 타입 판별 ==========

    /**
     * User-Agent를 기반으로 디바이스 타입을 판별합니다.
     *
     * @param request HTTP 요청
     * @return 디바이스 타입
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * DeviceType deviceType = DeviceUtil.getDeviceType(request);
     * if (deviceType == DeviceType.MOBILE) {
     *     // 모바일 처리
     * }
     * </pre>
     */
    public static DeviceType getDeviceType(HttpServletRequest request) {
        return getDeviceType(getUserAgent(request));
    }

    /**
     * User-Agent 문자열을 기반으로 디바이스 타입을 판별합니다.
     *
     * @param userAgent User-Agent 문자열
     * @return 디바이스 타입
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * DeviceType deviceType = DeviceUtil.getDeviceType(userAgentString);
     * </pre>
     */
    public static DeviceType getDeviceType(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return DeviceType.UNKNOWN;
        }

        String ua = userAgent.toLowerCase();

        // 태블릿 체크 (모바일보다 먼저 체크해야 함)
        if (isTablet(ua)) {
            return DeviceType.TABLET;
        }

        // 모바일 체크
        if (isMobile(ua)) {
            return DeviceType.MOBILE;
        }

        return DeviceType.DESKTOP;
    }

    /**
     * 모바일 디바이스인지 확인합니다.
     *
     * @param request HTTP 요청
     * @return 모바일 디바이스이면 true
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * if (DeviceUtil.isMobile(request)) {
     *     // 모바일 전용 처리
     * }
     * </pre>
     */
    public static boolean isMobile(HttpServletRequest request) {
        return isMobile(getUserAgent(request).toLowerCase());
    }

    /**
     * 모바일 디바이스인지 확인합니다 (User-Agent 문자열 기반).
     *
     * @param userAgentLower 소문자로 변환된 User-Agent 문자열
     * @return 모바일 디바이스이면 true
     */
    private static boolean isMobile(String userAgentLower) {
        return userAgentLower.contains("mobile")
                || userAgentLower.contains("android")
                || userAgentLower.contains("iphone")
                || userAgentLower.contains("ipod")
                || userAgentLower.contains("blackberry")
                || userAgentLower.contains("windows phone")
                || userAgentLower.contains("opera mini")
                || userAgentLower.contains("opera mobi");
    }

    /**
     * 태블릿 디바이스인지 확인합니다.
     *
     * @param request HTTP 요청
     * @return 태블릿 디바이스이면 true
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * if (DeviceUtil.isTablet(request)) {
     *     // 태블릿 전용 처리
     * }
     * </pre>
     */
    public static boolean isTablet(HttpServletRequest request) {
        return isTablet(getUserAgent(request).toLowerCase());
    }

    /**
     * 태블릿 디바이스인지 확인합니다 (User-Agent 문자열 기반).
     *
     * @param userAgentLower 소문자로 변환된 User-Agent 문자열
     * @return 태블릿 디바이스이면 true
     */
    private static boolean isTablet(String userAgentLower) {
        return userAgentLower.contains("ipad")
                || (userAgentLower.contains("android") && !userAgentLower.contains("mobile"))
                || userAgentLower.contains("tablet")
                || userAgentLower.contains("kindle")
                || userAgentLower.contains("silk")
                || userAgentLower.contains("playbook");
    }

    /**
     * 데스크톱 디바이스인지 확인합니다.
     *
     * @param request HTTP 요청
     * @return 데스크톱 디바이스이면 true
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * if (DeviceUtil.isDesktop(request)) {
     *     // 데스크톱 전용 처리
     * }
     * </pre>
     */
    public static boolean isDesktop(HttpServletRequest request) {
        DeviceType deviceType = getDeviceType(request);
        return deviceType == DeviceType.DESKTOP;
    }

    // ========== 브라우저 판별 ==========

    /**
     * User-Agent를 기반으로 브라우저 타입을 판별합니다.
     *
     * @param request HTTP 요청
     * @return 브라우저 타입
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * BrowserType browser = DeviceUtil.getBrowserType(request);
     * </pre>
     */
    public static BrowserType getBrowserType(HttpServletRequest request) {
        return getBrowserType(getUserAgent(request));
    }

    /**
     * User-Agent 문자열을 기반으로 브라우저 타입을 판별합니다.
     *
     * @param userAgent User-Agent 문자열
     * @return 브라우저 타입
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * BrowserType browser = DeviceUtil.getBrowserType(userAgentString);
     * </pre>
     */
    public static BrowserType getBrowserType(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return BrowserType.UNKNOWN;
        }

        String ua = userAgent.toLowerCase();

        // 순서가 중요함 (Edge, Opera, Chrome 순서로 체크해야 함)
        if (ua.contains("edg")) {
            return BrowserType.EDGE;
        }
        if (ua.contains("opr") || ua.contains("opera")) {
            return BrowserType.OPERA;
        }
        if (ua.contains("samsungbrowser")) {
            return BrowserType.SAMSUNG_BROWSER;
        }
        if (ua.contains("chrome") || ua.contains("crios")) {
            return BrowserType.CHROME;
        }
        if (ua.contains("firefox") || ua.contains("fxios")) {
            return BrowserType.FIREFOX;
        }
        if (ua.contains("safari")) {
            return BrowserType.SAFARI;
        }
        if (ua.contains("msie") || ua.contains("trident")) {
            return BrowserType.IE;
        }

        return BrowserType.UNKNOWN;
    }

    // ========== OS 판별 ==========

    /**
     * User-Agent를 기반으로 OS 타입을 판별합니다.
     *
     * @param request HTTP 요청
     * @return OS 타입
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * OsType os = DeviceUtil.getOsType(request);
     * </pre>
     */
    public static OsType getOsType(HttpServletRequest request) {
        return getOsType(getUserAgent(request));
    }

    /**
     * User-Agent 문자열을 기반으로 OS 타입을 판별합니다.
     *
     * @param userAgent User-Agent 문자열
     * @return OS 타입
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * OsType os = DeviceUtil.getOsType(userAgentString);
     * </pre>
     */
    public static OsType getOsType(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return OsType.UNKNOWN;
        }

        String ua = userAgent.toLowerCase();

        // iOS 체크 (iPhone, iPad, iPod)
        if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ipod")) {
            return OsType.IOS;
        }
        // Android 체크
        if (ua.contains("android")) {
            return OsType.ANDROID;
        }
        // Windows 체크
        if (ua.contains("windows")) {
            return OsType.WINDOWS;
        }
        // macOS 체크
        if (ua.contains("macintosh") || ua.contains("mac os")) {
            return OsType.MAC_OS;
        }
        // Linux 체크
        if (ua.contains("linux")) {
            return OsType.LINUX;
        }

        return OsType.UNKNOWN;
    }

    // ========== 종합 정보 ==========

    /**
     * 디바이스 정보를 담는 DTO 클래스
     */
    public static class DeviceInfo {
        private final DeviceType deviceType;
        private final BrowserType browserType;
        private final OsType osType;
        private final String userAgent;

        public DeviceInfo(DeviceType deviceType, BrowserType browserType, OsType osType, String userAgent) {
            this.deviceType = deviceType;
            this.browserType = browserType;
            this.osType = osType;
            this.userAgent = userAgent;
        }

        public DeviceType getDeviceType() {
            return deviceType;
        }

        public BrowserType getBrowserType() {
            return browserType;
        }

        public OsType getOsType() {
            return osType;
        }

        public String getUserAgent() {
            return userAgent;
        }

        public boolean isMobile() {
            return deviceType == DeviceType.MOBILE;
        }

        public boolean isTablet() {
            return deviceType == DeviceType.TABLET;
        }

        public boolean isDesktop() {
            return deviceType == DeviceType.DESKTOP;
        }

        @Override
        public String toString() {
            return "DeviceInfo{" +
                    "deviceType=" + deviceType.getDisplayName() +
                    ", browserType=" + browserType.getDisplayName() +
                    ", osType=" + osType.getDisplayName() +
                    '}';
        }
    }

    /**
     * 요청에서 종합적인 디바이스 정보를 가져옵니다.
     *
     * @param request HTTP 요청
     * @return 디바이스 정보 객체
     *
     * <p><b>사용 예시:</b></p>
     * <pre>
     * DeviceInfo info = DeviceUtil.getDeviceInfo(request);
     * System.out.println("Device: " + info.getDeviceType().getDisplayName());
     * System.out.println("Browser: " + info.getBrowserType().getDisplayName());
     * System.out.println("OS: " + info.getOsType().getDisplayName());
     *
     * if (info.isMobile()) {
     *     // 모바일 처리
     * }
     * </pre>
     */
    public static DeviceInfo getDeviceInfo(HttpServletRequest request) {
        String userAgent = getUserAgent(request);
        return new DeviceInfo(
                getDeviceType(userAgent),
                getBrowserType(userAgent),
                getOsType(userAgent),
                userAgent
        );
    }
}