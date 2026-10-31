
export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      return new Response("Cake Order Skill Server is running!");
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405
      });
    }

    let payload;
  
    try {
      payload = await request.json();
    } catch (error) {
      return Response.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const utterance =
      payload?.userRequest?.utterance ?? "";

    // 고객 메시지의 첫 줄에서 주문 유형 확인
    const firstLine = utterance.trim().split(/\r?\n/)[0];

    const match = firstLine.match(/^\[([^\]]+)\]$/);

    const orderType = match ? match[1] : "";

    // 주문서 또는 주문으로 끝나는 제목 인식
    const isOrder =
      /(?:주문서|주문)$/.test(orderType);

    const message = isOrder
      ? `주문서 수신 테스트 성공!\n주문 유형: ${orderType}\n\n${utterance.slice(0, 750)}`
      : `스킬 서버 연결 성공!\n주문서 제목을 확인하지 못했습니다.\n전달받은 글자 수: ${utterance.length}`;

    return Response.json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: message
            }
          }
        ]
      }
    });
  }
};
