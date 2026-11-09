/** P6Spy SQL 로그를 정렬하고 민감한 컬럼 값을 가리는 포매터. */
package com.oyster.starter.global.config;

import com.p6spy.engine.spy.appender.MessageFormattingStrategy;
import org.hibernate.engine.jdbc.internal.FormatStyle;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** SQL과 실행 시간을 로그에 표시합니다. */
public class P6SpySqlFormatter implements MessageFormattingStrategy {

    // 마스킹할 컬럼은 이 목록에서만 추가하거나 제거합니다.
    private static final Set<String> PRIVATE_COLUMNS = Set.of("password", "pwd");
    private static final String COLUMN_NAMES = PRIVATE_COLUMNS.stream()
            .map(Pattern::quote).collect(Collectors.joining("|"));
    private static final Pattern ASSIGNMENT = Pattern.compile(
            "(?i)((?<![\\w])(?:" + COLUMN_NAMES + ")[`\"\\]]?\\s*=\\s*)('(?:''|[^'])*'|[^\\s,)]+)");
    private static final Pattern INSERT = Pattern.compile(
            "(?is)\\binsert\\s+into\\s+[^\\s(]+\\s*\\(([^)]*)\\)\\s*values\\s*\\(((?:'(?:''|[^'])*'|[^)])*)\\)");
    private static final Pattern NEXT_ROW = Pattern.compile(
            "\\s*,\\s*\\(((?:'(?:''|[^'])*'|[^)])*)\\)");
    private static final Pattern COMMA = Pattern.compile(",(?=(?:[^']*'[^']*')*[^']*$)");
    private static final Pattern DDL = Pattern.compile("(?i)^(?:create|alter|drop|comment)\\b");

    /** 민감 컬럼의 값만 마스킹한 뒤 SQL 종류와 실행 시간을 반환합니다. */
    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category,
                                String prepared, String sql, String url) {
        if (sql == null || sql.isBlank()) {
            return "\nExecute Command: " + category + "\nExecution Time: " + elapsed + " ms";
        }
        String statement = maskInsert(maskAssignments(sql.trim()));
        boolean ddl = DDL.matcher(statement).find();
        String formatted = (ddl ? FormatStyle.DDL : FormatStyle.BASIC).getFormatter().format(statement);
        return "\nExecute " + (ddl ? "DDL" : "SQL") + " (" + category + "):"
                + "\n" + formatted + "\nExecution Time: " + elapsed + " ms";
    }

    /** UPDATE와 WHERE의 컬럼 대입값을 마스킹합니다. */
    private String maskAssignments(String sql) {
        Matcher matcher = ASSIGNMENT.matcher(sql);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(result, Matcher.quoteReplacement(matcher.group(1) + "'****'"));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    /** INSERT의 각 VALUES 행에 같은 컬럼 순서를 적용해 마스킹합니다. */
    private String maskInsert(String sql) {
        Matcher matcher = INSERT.matcher(sql);
        if (!matcher.find()) return sql;

        String[] columns = matcher.group(1).split(",");
        StringBuilder result = new StringBuilder(sql.substring(0, matcher.start(2)));
        int end = matcher.end(2);
        String masked = maskValues(matcher.group(2), columns);
        if (masked == null) return sql;
        result.append(masked);

        Matcher nextRow = NEXT_ROW.matcher(sql);
        int position = matcher.end();
        while (nextRow.region(position, sql.length()).lookingAt()) {
            masked = maskValues(nextRow.group(1), columns);
            if (masked == null) return sql;
            result.append(sql, end, nextRow.start(1)).append(masked);
            end = nextRow.end(1);
            position = nextRow.end();
        }
        return result.append(sql.substring(end)).toString();
    }

    private String maskValues(String row, String[] columns) {
        String[] values = COMMA.split(row, -1);
        if (columns.length != values.length) return null;

        for (int i = 0; i < columns.length; i++) {
            String column = columns[i].trim().replace("\"", "").replace("`", "");
            if (PRIVATE_COLUMNS.contains(column.toLowerCase(java.util.Locale.ROOT))) {
                values[i] = "'****'";
            }
        }
        return String.join(", ", values);
    }
}
