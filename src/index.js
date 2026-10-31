
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

    // 고객이 보낸 메시지
    const utterance =
      payload?.userRequest?.utterance ?? "";

    // 카카오 사용자 ID
    const customerId =
      payload?.userRequest?.user?.id ?? null;

    // 첫 번째 줄에서 주문서 제목 확인
    const firstLine = utterance.trim().split(/\r?\n/)[0];

    const match = firstLine.match(/^\[([^\]]+)\]$/);

    const orderType = match ? match[1].trim() : "";

    // 주문서 또는 주문으로 끝나는 제목인지 확인
    const isOrder =
      /(?:주문서|주문)$/.test(orderType);

    // DB에 저장할 유형
    const recordType = isOrder ? orderType : "일반 문의";

    // 주문서 접수 메시지
    const orderMessage = `📋 [주문서 접수가 완료되었습니다]

소중한 주문서를 정상적으로 접수했습니다! 🫶

매장에서 주문 내용을 꼼꼼하게 확인한 후, 순차적으로 입금 계좌와 최종 결제 금액을 안내해 드리겠습니다.

👩‍🍳 베이킹 작업이나 고객 응대 중에는 답변이 다소 늦어질 수 있는 점 너른 양해 부탁드립니다.

조금만 기다려 주시면 확인 후 정성껏 안내해 드리겠습니다.

감사합니다! ♡`;

    // 일반 문의 접수 메시지
    const inquiryMessage = `📋 [문의 접수가 완료되었습니다]

소중한 문의를 보내주셔서 감사합니다! 🫶

매장에서 내용을 확인한 후 순차적으로 답변드리겠습니다.

👩‍🍳 베이킹 작업이나 고객 응대 중에는 답변이 다소 늦어질 수 있는 점 너른 양해 부탁드립니다.

조금만 기다려 주시면 확인 후 정성껏 안내해 드리겠습니다.

감사합니다! ♡`;

    // 빈 메시지는 저장하지 않음
    if (!utterance.trim()) {
      return Response.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "메시지 내용을 확인할 수 없습니다. 다시 보내주세요."
              }
            }
          ]
        }
      });
    }

    // 주문서와 일반 문의 모두 DB 저장
    try {
      await env.DB.prepare(`
        INSERT INTO orders (
          order_type,
          customer_id,
          customer_message
        )
        VALUES (?, ?, ?)
      `)
        .bind(
          recordType,
          customerId,
          utterance
        )
        .run();

    } catch (error) {
      return Response.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "죄송합니다. 메시지 접수 과정에서 오류가 발생했습니다. 잠시 후 다시 보내주세요."
              }
            }
          ]
        }
      });
    }

    // DB 저장 성공 후 유형별 응답 반환
    const message = isOrder
      ? orderMessage
      : inquiryMessage;

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
