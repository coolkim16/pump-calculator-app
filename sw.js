const CACHE_NAME = 'pump-calculator-v1';

// [수정] 캐시할 목록의 CDN 주소를 올바르게 수정
const URLS_TO_CACHE = [
'./',
'./index.html',
'./inertia.html',
'./npsha.html',
'./cheonsei_logo.png',
'./manifest.json',
'https://www.google.com/search?q=https://cdn.tailwindcss.com', // 수정됨
'https://www.google.com/search?q=https://fonts.googleapis.com/css2%3Ffamily%3DNoto%2BSans%2BKR:wght%40400%3B700%26display%3Dswap', // 수정됨
'https://www.google.com/search?q=https://fonts.googleapis.com/css2%3Ffamily%3DInter:wght%40400%3B500%3B600%3B700%26display%3Dswap' // 수정됨
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
});
})
);
});

// 2. 요청 가로채기 (Fetch) - 오프라인 우선 전략
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
        // 유효하지 않은 응답은 캐시하지 않음
        if (!networkResponse || networkResponse.status !== 200) {
             return networkResponse;
        }
        
        // 응답을 복제 (캐시와 브라우저가 각각 사용)
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
              // PUT 요청은 캐시하지 않음 (필요시)
              if(event.request.method !== 'PUT') {
                cache.put(event.request, responseToCache);
              }
          });
        
        return networkResponse;
      }
    ).catch(() => {
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
