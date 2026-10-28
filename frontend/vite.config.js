import { defineConfig, loadEnv } from 'vite';
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path';
import fg from 'fast-glob';


// src/pages 디렉토리 아래의 모든 .js 파일을 동적으로 찾아 입력 객체를 생성합니다.
const pageEntries = fg.sync('src/pages/**/*.js', {
    ignore: ['src/pages/**/module/**']
}).reduce((acc, path) => {
    // 파일 경로를 기반으로 '폴더명_파일명' 형식의 키를 생성합니다.
    // 예: 'src/pages/home/index.js' -> 'home_index'
    const entryName = path
        .slice('src/pages/'.length, path.lastIndexOf('.'))
        .replace(/\//g, '_');
    acc[entryName] = resolve(__dirname, path);
    return acc;
}, {});


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        root: './',
        base: '/',
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        // CSS 전처리기 옵션 추가
        css: {
            preprocessorOptions: {
                scss: {
                    // 외부 라이브러리/의존성 파일의 @import 경고를 숨깁니다.
                    quietDeps: true,
                    // 모든 deprecation 경고 숨기기
                    silenceDeprecations: ['import']
                },
            },
        },
        build: {
            outDir: '../src/main/resources/static', // 빌드 결과물이 Spring Boot 정적 자원 디렉토리로
            emptyOutDir: true, // 빌드 시 이전 빌드 결과물 삭제
            assetsDir: 'assets', // asset 폴더 경로 설정
            manifest: true, // Vite 내장 매니페스트 생성
            minify: env.VITE_MINIFY === 'true' ? 'terser' : false, // VITE_MINIFY=true일 때 Terser로 압축

            terserOptions: {
                compress: {
                    drop_console: env.VITE_DROP_CONSOLE === 'true', // console.log 삭제
                    drop_debugger: env.VITE_DROP_DEBUGGER === 'true', // debugger 삭제
                },
            },
            rollupOptions: {
                input: {
                    core: resolve(__dirname, 'src/resource/core.js'),
                    fragment: resolve(__dirname, 'src/fragments/fragment.js'),
                    style: resolve(__dirname, 'public/css/style.css'),
                    ...pageEntries
                },
                output: {
                    // 모든 에셋에 대한 일관된 명명 패턴 적용
                    // entryFileNames: 엔트리 포인트 파일(main.js, home.js 등)의 출력 이름 패턴
                    entryFileNames: 'assets/[name]-[hash].js',
                    // assetFileNames: CSS, 이미지 등 정적 에셋의 출력 이름 패턴
                    assetFileNames: 'assets/[name]-[hash][extname]',
                },
            },
        },
        plugins: [
            legacy({
                targets: ['chrome >= 64', 'safari >= 12'],
                modernPolyfills: true
            })
        ],
        server: {
            port: 5173, // Vite 개발 서버 포트
            strictPort: true, // 포트 사용 중일 경우 실패
            host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 허용
        },
    }
});
