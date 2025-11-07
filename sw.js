const CACHE_NAME = 'pump-calculator-v4'; // 캐시 버전을 v4로 강제 업데이트

// [수정] 캐시할 목록의 CDN 주소를 올바른 실제 주소로 수정
const URLS_TO_CACHE = [
'./',
'./index.html',
'./inertia.html',
'./npsha.html',
'./cheonsei_logo.png',
'./manifest.json',
'https://www.google.com/url?sa=E&source=gmail&q=https://cdn.tailwindcss.com', // 수정됨
'https://www.google.com/search?q=https://fonts.googleapis.com/css2%3Ffamily%3DNoto%2BSans%2BKR:wght%40400%3B700%26display%3Dswap', // 수정됨
'https://www.google.com/search?q=https://fonts.googleapis.com/css2%3Ffamily%3DInter:wght%40400%3B500%3B600%3B700%26display%3Dswap' // 수정됨
];

// 1. 서비스 워커 설치
self.addEventListener('install', event => {
self.skipWaiting(); // 즉시 활성화
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => {
console.log('캐시 열림(v4), 핵심 파일 저장 중...');
return cache.addAll(URLS_TO_CACHE).catch(err => {
console.error('v4 캐시 저장 실패:', err);
});
})
);
});

// 2. 요청 가로채기 (Fetch) - 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', event => {
event.respondWith(
fetch(event.request).catch(() => { // 네트워크 우선
// 네트워크 요청이 실패하면 (오프라인)
console.log('네트워크 요청 실패. 캐시에서 찾습니다: ', event.request.url);
return caches.match(event.request).then(response => {
if (response) {
return response; // 캐시에서 반환
}
});
})
);
});

// 3. 오래된 캐시 정리 (Activate) - v1, v2, v3 캐시 삭제
self.addEventListener('activate', event => {
const cacheWhitelist = [CACHE_NAME]; // v4만 허용
event.waitUntil(
caches.keys().then(cacheNames => {
return Promise.all(
cacheNames.map(cacheName => {
if (cacheWhitelist.indexOf(cacheName) === -1) {
// 이 캐시 이름(v1, v2, v3)이 화이트리스트에 없으면 삭제
console.log('오래된 캐시 삭제: ', cacheName);
return caches.delete(cacheName);
}
})
);
}).then(() => self.clients.claim()) // 활성화 즉시 클라이언트 제어
);
});
