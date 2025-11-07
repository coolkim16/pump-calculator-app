const CACHE_NAME = 'pump-calculator-v1';

// 캐시할 파일 목록
// 앱의 핵심 파일 및 모든 페이지, 외부 CDN 리소스 포함
const URLS_TO_CACHE = [
  './',
  './index.html',
  './inertia.html',
  './npsha.html',
  './cheonsei_logo.png',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. 서비스 워커 설치
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열림, 핵심 파일 저장 중...');
        // addAll은 하나라도 실패하면 전체가 실패함
        return cache.addAll(URLS_TO_CACHE).catch(err => {
          console.error('캐시 저장 실패:', err);
          // 일부 리소스 (특히 외부 CDN)가 실패할 수 있으므로, 
          // 실패하더라도 설치를 강행할 수 있으나, 여기서는 일단 에러를 로깅합니다.
        });
      })
  );
});

// 2. 요청 가로채기 (Fetch) - 오프라인 우선 전략
// "Cache First, falling back to Network"
// 캐시에 파일이 있으면 바로 반환하고 (빠름, 오프라인),
// 없으면 네트워크로 요청을 시도합니다.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 응답이 있으면 그것을 반환
        if (response) {
          return response;
        }

        // 캐시에 없으면 네트워크로 요청
        return fetch(event.request).then(
          (networkResponse) => {
            // 네트워크 요청이 성공하면, 캐시에 저장하고 반환
            
            // 유효하지 않은 응답은 캐시하지 않음
            if (!networkResponse || networkResponse.status !== 200) {
                 return networkResponse;
            }
            
            // 외부 리소스(e.g. 폰트, CDN)가 아니거나, 'basic' 타입일 때만 캐시
            // (Tailwind, Google Fonts 등)
            if(networkResponse.type === 'basic' || event.request.url.startsWith('https:')) {
                // 응답을 복제해야 함 (캐시와 브라우저가 각각 사용)
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                      cache.put(event.request, responseToCache);
                  });
            }

            return networkResponse;
          }
        ).catch(() => {
          // 네트워크 요청도 실패 (완전 오프라인)
          console.log('네트워크 요청 실패 및 캐시에 없음');
          // (오프라인일 때 캐시에 없는 파일을 요청하면 여기서 실패함)
        });
      })
  );
});

// 3. 오래된 캐시 정리 (Activate)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 이 캐시 이름이 화이트리스트에 없으면 삭제
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
