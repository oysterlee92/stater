package com.oyster.starter.global.xss;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;

/**
 * XSS 필터링 공통 처리기입니다.
 * <p>
 * DTO 객체의 필드를 리플렉션으로 순회하면서 {@link String}, {@link Collection}, {@link Map},
 * 중첩 DTO 객체에 대해 필드 어노테이션 기반 XSS 필터링을 적용합니다.
 * </p>
 * <p>
 * 순환 참조가 있는 객체 구조에서도 중복 처리를 방지하기 위해 방문한 객체를 추적하며,
 * Java/Jakarta/Spring/Hibernate 등 프레임워크 내부 타입은 처리 대상에서 제외합니다.
 * </p>
 */
@Slf4j
@Component
public class XssObjectSanitizer {

    /**
     * DTO 객체에 XSS 필터링을 적용합니다.
     * <p>
     * 객체 그래프를 순회하면서 문자열 필드, 문자열 컬렉션, 문자열 맵 값,
     * 중첩 DTO 내부의 문자열 값까지 필터링합니다.
     * </p>
     *
     * @param target 필터링 대상 객체
     */
    public void sanitize(Object target) {
        Set<Object> visited = java.util.Collections.newSetFromMap(new IdentityHashMap<>());
        sanitizeObject(target, visited);
    }

    /**
     * 문자열에 지정 정책으로 XSS 필터링을 적용합니다.
     *
     * @param value  필터링 대상 문자열
     * @param policy XSS 필터링 정책
     * @return 필터링된 문자열
     */
    public String sanitize(String value, XssFilterPolicy policy) {
        return policy.sanitize(value);
    }

    /**
     * XSS 처리 대상 DTO 클래스인지 확인합니다.
     * <p>
     * 기본 타입, 배열, enum, Java/Jakarta/Spring/Hibernate 패키지 타입은
     * 애플리케이션 DTO가 아니라고 판단하여 처리 대상에서 제외합니다.
     * </p>
     *
     * @param type 확인 대상 클래스
     * @return 처리 대상이면 {@code true}, 제외 대상이면 {@code false}
     */
    public boolean isTargetDtoClass(Class<?> type) {
        return type != null &&
                !type.isPrimitive() &&
                !type.isArray() &&
                !type.isEnum() &&
                !type.getName().startsWith("java.") &&
                !type.getName().startsWith("javax.") &&
                !type.getName().startsWith("jakarta.") &&
                !type.getName().startsWith("org.springframework.") &&
                !type.getName().startsWith("org.hibernate.");
    }

    /**
     * 객체 단위로 XSS 필터링을 수행합니다.
     * <p>
     * 순환 참조로 인한 무한 재귀를 방지하기 위해 이미 방문한 객체는 다시 처리하지 않습니다.
     * 처리 대상 DTO인 경우 해당 클래스와 상위 클래스에 선언된 모든 필드를 순회합니다.
     * </p>
     *
     * @param target  필터링 대상 객체
     * @param visited 이미 방문한 객체 집합
     */
    private void sanitizeObject(Object target, Set<Object> visited) {
        if (target == null || visited.contains(target)) {
            return;
        }

        visited.add(target);

        Class<?> targetClass = target.getClass();
        if (!isTargetDtoClass(targetClass)) {
            return;
        }

        for (Field field : getAllFields(targetClass)) {
            sanitizeField(target, field, visited);
        }
    }

    /**
     * 단일 필드의 값을 확인하고 타입에 맞는 XSS 필터링을 적용합니다.
     * <p>
     * 문자열은 직접 필터링하고, 컬렉션과 맵은 내부 값을 순회합니다.
     * 중첩 DTO 객체는 재귀적으로 필터링합니다.
     * </p>
     *
     * @param target  필드를 보유한 객체
     * @param field   필터링 대상 필드
     * @param visited 이미 방문한 객체 집합
     */
    private void sanitizeField(Object target, Field field, Set<Object> visited) {
        // 정적 상수와 final 필드는 요청 DTO의 입력값이 아니므로 필터링 대상에서 제외합니다.
        if (!isMutableInstanceField(field)) {
            return;
        }

        field.setAccessible(true);

        try {
            Object value = field.get(target);
            if (value == null) {
                return;
            }

            XssFilterPolicy policy = XssFilterPolicy.fromField(field);

            if (value instanceof String stringValue) {
                sanitizeStringField(target, field, stringValue, policy);
                return;
            }

            if (value instanceof Collection<?> collection) {
                sanitizeCollection(collection, policy, visited);
                return;
            }

            if (value instanceof Map<?, ?> map) {
                sanitizeMap(map, policy, visited);
                return;
            }

            if (isTargetDtoClass(value.getClass())) {
                sanitizeObject(value, visited);
            }
        } catch (IllegalAccessException e) {
            log.warn("XSS 필드 접근 실패 - 필드: {}.{}",
                    target.getClass().getSimpleName(),
                    field.getName(),
                    e);
        } catch (Exception e) {
            log.error("XSS 필드 처리 중 오류 - 필드: {}.{}",
                    target.getClass().getSimpleName(),
                    field.getName(),
                    e);
        }
    }

    /**
     * 요청 DTO의 인스턴스 입력값처럼 sanitizer가 안전하게 교체할 수 있는 필드인지 확인합니다.
     */
    private boolean isMutableInstanceField(Field field) {
        int modifiers = field.getModifiers();
        return !Modifier.isStatic(modifiers) && !Modifier.isFinal(modifiers);
    }

    /**
     * 문자열 필드에 XSS 필터링을 적용하고 필드 값을 필터링된 문자열로 교체합니다.
     *
     * @param target 필드를 보유한 객체
     * @param field  필터링 대상 문자열 필드
     * @param value  원본 문자열 값
     * @param policy 적용할 XSS 필터링 정책
     * @throws IllegalAccessException 필드 값 설정 권한이 없을 경우 발생
     */
    private void sanitizeStringField(Object target,
                                     Field field,
                                     String value,
                                     XssFilterPolicy policy) throws IllegalAccessException {

        String sanitized = policy.sanitize(value);
        field.set(target, sanitized);

        if (log.isDebugEnabled() && !value.equals(sanitized)) {
            log.debug("XSS 필터링 적용 - 필드: {}.{}, 정책: {}",
                    target.getClass().getSimpleName(),
                    field.getName(),
                    policy);
        }
    }

    /**
     * 컬렉션 내부의 문자열 값 또는 중첩 DTO 객체에 XSS 필터링을 적용합니다.
     * <p>
     * {@link List}는 인덱스 기반으로 문자열 값을 교체하고,
     * {@link Set}은 값의 해시 변경 문제를 피하기 위해 제거 대상과 추가 대상을 분리해 처리합니다.
     * 불변 컬렉션은 값을 변경할 수 없으므로 필터링을 건너뜁니다.
     * </p>
     *
     * @param collection 필터링 대상 컬렉션
     * @param policy     적용할 XSS 필터링 정책
     * @param visited    이미 방문한 객체 집합
     */
    @SuppressWarnings("unchecked")
    private void sanitizeCollection(Collection<?> collection,
                                    XssFilterPolicy policy,
                                    Set<Object> visited) {

        if (isImmutableCollection(collection)) {
            log.debug("불변 컬렉션 감지, XSS 필터링 건너뜀");
            return;
        }

        if (collection instanceof List<?> list) {
            List<Object> mutableList = (List<Object>) list;

            for (int i = 0; i < mutableList.size(); i++) {
                Object item = mutableList.get(i);

                if (item instanceof String stringValue) {
                    mutableList.set(i, policy.sanitize(stringValue));
                } else if (item != null && isTargetDtoClass(item.getClass())) {
                    sanitizeObject(item, visited);
                }
            }

            return;
        }

        if (collection instanceof Set<?> set) {
            Set<Object> mutableSet = (Set<Object>) set;
            Set<Object> removeItems = new HashSet<>();
            Set<Object> addItems = new HashSet<>();

            for (Object item : mutableSet) {
                if (item instanceof String stringValue) {
                    String sanitized = policy.sanitize(stringValue);

                    if (!stringValue.equals(sanitized)) {
                        removeItems.add(item);
                        addItems.add(sanitized);
                    }
                } else if (item != null && isTargetDtoClass(item.getClass())) {
                    sanitizeObject(item, visited);
                }
            }

            if (!removeItems.isEmpty()) {
                mutableSet.removeAll(removeItems);
                mutableSet.addAll(addItems);
            }

            return;
        }

        for (Object item : collection) {
            if (item != null && isTargetDtoClass(item.getClass())) {
                sanitizeObject(item, visited);
            }
        }
    }

    /**
     * 맵 내부의 value에 대해 XSS 필터링을 적용합니다.
     * <p>
     * 문자열 value는 필터링된 값으로 교체하고, DTO value는 재귀적으로 필터링합니다.
     * key는 식별 용도로 사용될 수 있으므로 변경하지 않습니다.
     * 불변 맵은 값을 변경할 수 없으므로 필터링을 건너뜁니다.
     * </p>
     *
     * @param map     필터링 대상 맵
     * @param policy  적용할 XSS 필터링 정책
     * @param visited 이미 방문한 객체 집합
     */
    @SuppressWarnings("unchecked")
    private void sanitizeMap(Map<?, ?> map,
                             XssFilterPolicy policy,
                             Set<Object> visited) {

        if (isImmutableMap(map)) {
            log.debug("불변 맵 감지, XSS 필터링 건너뜀");
            return;
        }

        Map<Object, Object> mutableMap = (Map<Object, Object>) map;

        for (Map.Entry<Object, Object> entry : mutableMap.entrySet()) {
            Object value = entry.getValue();

            if (value instanceof String stringValue) {
                entry.setValue(policy.sanitize(stringValue));
            } else if (value != null && isTargetDtoClass(value.getClass())) {
                sanitizeObject(value, visited);
            }
        }
    }

    /**
     * 대상 클래스와 상위 클래스에 선언된 모든 필드를 조회합니다.
     *
     * @param type 필드를 조회할 클래스
     * @return 대상 클래스 계층에 선언된 필드 목록
     */
    private List<Field> getAllFields(Class<?> type) {
        List<Field> fields = new ArrayList<>();

        Class<?> current = type;
        while (current != null && current != Object.class) {
            fields.addAll(Arrays.asList(current.getDeclaredFields()));
            current = current.getSuperclass();
        }

        return fields;
    }

    /**
     * 컬렉션이 불변 또는 수정 불가능한 컬렉션인지 확인합니다.
     *
     * @param collection 확인 대상 컬렉션
     * @return 불변 또는 수정 불가능한 컬렉션이면 {@code true}
     */
    private boolean isImmutableCollection(Collection<?> collection) {
        String className = collection.getClass().getName();

        return className.contains("Immutable") ||
                className.contains("Unmodifiable") ||
                className.startsWith("java.util.ImmutableCollections");
    }

    /**
     * 맵이 불변 또는 수정 불가능한 맵인지 확인합니다.
     *
     * @param map 확인 대상 맵
     * @return 불변 또는 수정 불가능한 맵이면 {@code true}
     */
    private boolean isImmutableMap(Map<?, ?> map) {
        String className = map.getClass().getName();

        return className.contains("Immutable") ||
                className.contains("Unmodifiable") ||
                className.startsWith("java.util.ImmutableCollections");
    }
}
