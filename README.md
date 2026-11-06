# 학교 생활 캘린더

## 고성고등학교 급식 연동

급식은 NEIS(나이스) 학교급식식단정보 API에서 가져옵니다. 웹 화면은 기존 HTML/CSS/JavaScript를 그대로 사용하고, Cloudflare Worker가 API 키를 숨긴 채 NEIS와 통신합니다. 교육청 코드는 강원도 `K10`이며, 학교 코드는 `schoolInfo` API에서 `고성고등학교`로 조회합니다.

### 1. NEIS API 키 발급

NEIS 교육정보 개방 포털에서 학교급식식단정보 API 사용 신청을 하고 인증키를 발급받습니다. 키를 저장소에 커밋하거나 `meal-api-config.js`에 넣지 마세요.

### 2. Worker 배포 및 키 등록

1. Cloudflare 계정에서 Worker를 만들고 이 저장소의 `worker.js`를 배포합니다.
2. Worker의 **Settings → Variables and Secrets**에서 `NEIS_API_KEY`라는 이름의 **Secret**을 만들고 발급받은 키를 입력합니다.
3. Worker URL(예: `https://goseong-meals.<계정>.workers.dev`)을 확인합니다.

### 3. 웹 페이지에 Worker 주소 설정

`meal-api-config.js`에서 빈 주소를 배포한 Worker URL로 변경합니다.

```js
window.MEAL_API_URL = "https://goseong-meals.<계정>.workers.dev";
```

그 후 변경사항을 GitHub Pages에 배포합니다. 이 주소는 비밀이 아니며, NEIS 키는 Worker Secret에만 보관됩니다.

### 동작 방식

1. 브라우저의 `meal-integration.js`가 현재 달을 확인해 Worker의 `/meals?month=YYYY-MM`에 요청합니다.
2. Worker는 NEIS 학교정보 API로 강원도 고성고등학교의 학교 코드를 확인한 뒤, 해당 월의 급식식단정보를 조회합니다.
3. 메뉴를 날짜별 JSON으로 반환하고, 브라우저는 달력의 급식 표시와 선택일 메뉴를 갱신합니다.
4. 월별 응답은 브라우저 `localStorage`에 캐시되어 재방문 시 빠르게 표시됩니다.

Worker는 매월 최대 100개 급식 레코드를 요청합니다. 메뉴가 비어 있는 날에는 달력에 급식 칩을 표시하지 않습니다. API 키의 발급 조건/쿼터는 NEIS 포털 정책을 따릅니다.
