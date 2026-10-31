
export default {
  async fetch(request, env, ctx) {
    // 서버 작동 확인
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

    // 고객이 실제로 전송한 메시지
    const utterance =
      payload?.userRequest?.utterance ?? "";

    // 메시지 첫 줄의 대괄호 제목 확인
    const firstLine = utterance.trim().split(/\r?\n/)[0];

    const match = firstLine.match(/^\[([^\]]+)\]$/);

    const orderTitle = match ? match[1] : "";

    // 주문서 또는 주문 제목인지 확인
    const isOrder =
      /(?:주문서|주문)$/.test(orderTitle);

    let message;

    if (isOrder) {
      message =
        `주문서 수신 테스트 성공!\n` +
        `주문 유형: ${orderTitle}\n\n` +
        utterance.slice(0, 750);
    } else {
      message =
        "스킬 서버 연결 성공!\n" +
        "주문서 제목을 확인하지 못했습니다.\n" +
        `전달받은 글자 수: ${utterance.length}`;
    }

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
