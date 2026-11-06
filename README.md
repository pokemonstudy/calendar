# 학교 생활 캘린더

## 날짜와 고성고등학교 급식

달력은 페이지를 여는 기기의 현재 날짜로 이동합니다. 기존에 들어 있던 일정과 요일별 메뉴는 예시 데이터이므로 실제 학교 일정이나 급식표로 간주하면 안 됩니다.

급식 데이터는 NEIS(나이스) 학교급식식단정보 API를 사용합니다. 화면은 HTML/CSS/JavaScript이며, Cloudflare Worker가 인증키를 보관하고 NEIS에 요청합니다. Worker는 강원도 교육청 코드 `K10`을 사용해 학교정보 API에서 `고성고등학교`의 학교 코드를 찾고 해당 월의 메뉴를 반환하도록 되어 있습니다.

### 설정 및 배포

1. NEIS 교육정보 개방 포털에서 급식식단정보 API 인증키를 발급받습니다.
2. Cloudflare Worker에 저장소의 `worker.js`를 배포합니다.
3. Worker 설정의 **Variables and Secrets**에 `NEIS_API_KEY`를 Secret으로 추가합니다. 키를 저장소나 웹페이지 코드에 기록하지 마세요.
4. `meal-api-config.js`의 빈 주소를 Worker URL로 변경합니다. 예: `window.MEAL_API_URL = "https://your-worker.workers.dev";`
5. 저장소를 GitHub Pages에 배포합니다. 사이트는 현재 날짜로 열리고 해당 월의 급식을 Worker를 통해 불러옵니다.

브라우저의 `meal-integration.js`는 Worker에 `GET /meals?month=YYYY-MM` 요청을 보내고, 결과를 월별로 `localStorage`에 캐시합니다. 달력의 급식 표시와 선택일 메뉴는 API 응답으로 갱신됩니다. 날짜별 학교 행사 일정은 여전히 별도 데이터이므로 학교의 실제 학사일정으로 교체해야 합니다.

현재 코드는 Worker와 API 키 없이는 실제 급식을 가져올 수 없습니다. 배포 후 Worker URL과 NEIS 키 설정을 완료해야 연동이 동작합니다.
