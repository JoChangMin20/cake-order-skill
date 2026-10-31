
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
      return Response.json({
        error: "Invalid JSON"
      }, { status: 400 });
    }

    const utterance =
      payload?.userRequest?.utterance ?? "";

    const blockName =
      payload?.userRequest?.block?.name ?? "";

    const isOrder =
      utterance.includes("[몽땅케이크 주문서]");

    const message = isOrder
      ? `주문서 수신 테스트 성공!\n\n${utterance.slice(0, 800)}`
      : `스킬 서버 연결 성공!\n현재 블록: ${blockName}\n전달받은 글자 수: ${utterance.length}`;

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
