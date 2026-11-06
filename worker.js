export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=900",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "GET" || url.pathname !== "/meals") {
      return Response.json({ error: "지원하지 않는 요청입니다." }, { status: 404, headers: cors });
    }
    if (!env.NEIS_API_KEY) {
      return Response.json({ error: "서버에 NEIS_API_KEY가 설정되지 않았습니다." }, { status: 500, headers: cors });
    }

    const month = url.searchParams.get("month") || "";
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return Response.json({ error: "month는 YYYY-MM 형식이어야 합니다." }, { status: 400, headers: cors });
    }

    try {
      const [year, monthNumber] = month.split("-").map(Number);
      const from = `${year}${String(monthNumber).padStart(2, "0")}01`;
      const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
      const to = `${year}${String(monthNumber).padStart(2, "0")}${String(lastDay).padStart(2, "0")}`;
      const schoolCode = await findSchoolCode(env.NEIS_API_KEY);
      const query = new URLSearchParams({
        KEY: env.NEIS_API_KEY,
        Type: "json",
        pIndex: "1",
        pSize: "100",
        ATPT_OFCDC_SC_CODE: "K10",
        SD_SCHUL_CODE: schoolCode,
        MLSV_FROM_YMD: from,
        MLSV_TO_YMD: to,
      });
      const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error("NEIS 급식 API 요청에 실패했습니다.");
      const rows = data.mealServiceDietInfo?.[1]?.row || [];
      const meals = {};
      rows.forEach((row) => {
        const key = `${row.MLSV_YMD.slice(0, 4)}-${row.MLSV_YMD.slice(4, 6)}-${row.MLSV_YMD.slice(6, 8)}`;
        meals[key] = String(row.DDISH_NM || "")
          .replace(/<br\s*\/?\s*>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .split("\n")
          .map((item) => item.replace(/\s*\([^)]*\)\s*$/, "").trim())
          .filter(Boolean);
      });
      return Response.json({ school: "고성고등학교", month, meals }, { headers: cors });
    } catch (error) {
      return Response.json({ error: error.message || "급식 API 처리 중 오류가 발생했습니다." }, { status: 502, headers: cors });
    }
  },
};

async function findSchoolCode(apiKey) {
  const query = new URLSearchParams({
    KEY: apiKey,
    Type: "json",
    pIndex: "1",
    pSize: "100",
    ATPT_OFCDC_SC_CODE: "K10",
    SCHUL_NM: "고성고등학교",
  });
  const response = await fetch(`https://open.neis.go.kr/hub/schoolInfo?${query}`);
  const data = await response.json();
  if (!response.ok) throw new Error("NEIS 학교 정보 조회에 실패했습니다.");
  const schools = data.schoolInfo?.[1]?.row || [];
  const school = schools.find((row) => row.SCHUL_NM === "고성고등학교");
  if (!school) throw new Error("강원도 고성고등학교를 NEIS에서 찾지 못했습니다.");
  return school.SD_SCHUL_CODE;
}
