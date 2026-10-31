
export default {
  async fetch(request, env, ctx) {
    // 서버 상태 확인
    if (request.method === "GET") {
      return new Response("Cake Order Skill Server is running!");
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405
      });
    }

    // 카카오 요청 데이터 읽기
    let payload;

    try {
      payload = await request.json();
    } catch (error) {
      return Response.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // 고객 메시지 및 카카오 사용자 ID
    const utterance =
      payload?.userRequest?.utterance ?? "";

    const customerId =
      payload?.userRequest?.user?.id ?? null;

    // 공통 응답 함수
    const response = (message) => {
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
    };

    // 빈 메시지 확인
    if (!utterance.trim()) {
      return response(
        "메시지 내용을 확인할 수 없습니다. 다시 보내주세요."
      );
    }

    // 주문서 제목 확인
    const firstLine = utterance.trim().split(/\r?\n/)[0];

    const match = firstLine.match(/^\[([^\]]+)\]$/);

    const orderType = match ? match[1].trim() : "";

    // 지원하는 주문서 종류
    const orderTypes = [
      "홀케이크 주문서",
      "몽땅케이크 주문서",
      "빼빼로 세트 A 주문서",
      "빼빼로 세트 B 주문서",
      "빼빼로 세트 C 주문서",
      "빼빼로 단품 주문서"
    ];

    const isOrder = orderTypes.includes(orderType);

    // 번호가 붙은 항목의 내용 추출
    function getField(number) {
      const lines = utterance.split(/\r?\n/);

      const startIndex = lines.findIndex(line => {
        const regex = new RegExp(
          "^\\s*" + number + "\\.\\s*"
        );
        return regex.test(line);
      });

      if (startIndex === -1) {
        return "";
      }

      const firstValue = lines[startIndex]
        .replace(
          new RegExp("^\\s*" + number + "\\.\\s*[^:：]*[:：]\\s*"),
          ""
        );

      const values = [firstValue];

      for (let i = startIndex + 1; i < lines.length; i++) {
        if (/^\s*\d+\.\s*/.test(lines[i])) {
          break;
        }

        values.push(lines[i]);
      }

      return values.join("\n").trim() || "";
    }

    // 공통 주문 정보
    const customerName = isOrder
      ? getField(1)
      : "";

    const customerPhone = isOrder
      ? getField(2)
      : "";

    const pickupDatetime = isOrder
      ? getField(3)
      : "";

    // 주문 상품 및 수량
    const productValue = isOrder
      ? getField(4)
      : "";

    // 상품 정보를 JSON 형태로 보관
    const productDetails = isOrder
      ? JSON.stringify({
          orderType: orderType,
          product: productValue
        })
      : null;

    // 레터링 요청사항
    const lettering =
      orderType === "홀케이크 주문서" ||
      orderType === "몽땅케이크 주문서"
        ? getField(5)
        : "";

    // 기타 요청사항 및 환불규정 확인 항목
    const extraRequest = isOrder
      ? getField(
          orderType === "홀케이크 주문서" ||
          orderType === "몽땅케이크 주문서"
            ? 6
            : 5
        )
      : "";

    const refundConfirmed = isOrder
      ? getField(
          orderType === "홀케이크 주문서" ||
          orderType === "몽땅케이크 주문서"
            ? 7
            : 6
        )
      : "";

    // DB에 저장할 주문 유형
    const recordType = isOrder
      ? orderType
      : "일반 문의";

    // 주문서 접수 안내
    const orderMessage = `📋 [주문서 접수가 완료되었습니다]

소중한 주문서를 정상적으로 접수했습니다! 🫶

매장에서 주문 내용을 꼼꼼하게 확인한 후, 순차적으로 입금 계좌와 최종 결제 금액을 안내해 드리겠습니다.

👩‍🍳 베이킹 작업이나 고객 응대 중에는 답변이 다소 늦어질 수 있는 점 너른 양해 부탁드립니다.

조금만 기다려 주시면 확인 후 정성껏 안내해 드리겠습니다.

감사합니다! ♡`;

    // 일반 문의 접수 안내
    const inquiryMessage = `📋 [문의 접수가 완료되었습니다]

소중한 문의를 보내주셔서 감사합니다! 🫶

매장에서 내용을 확인한 후 순차적으로 답변드리겠습니다.

👩‍🍳 베이킹 작업이나 고객 응대 중에는 답변이 다소 늦어질 수 있는 점 너른 양해 부탁드립니다.

조금만 기다려 주시면 확인 후 정성껏 안내해 드리겠습니다.

감사합니다! ♡`;

    // DB 저장
    try {
      await env.DB.prepare(`
        INSERT INTO orders (
          order_type,
          customer_id,
          customer_message,
          customer_name,
          customer_phone,
          pickup_datetime,
          product_details,
          lettering,
          extra_request,
          refund_confirmed
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          recordType,
          customerId,
          utterance,
          customerName || null,
          customerPhone || null,
          pickupDatetime || null,
          productDetails,
          lettering || null,
          extraRequest || null,
          refundConfirmed || null
        )
        .run();

    } catch (error) {
      console.error("D1 save failed:", error);

      return response(
        "죄송합니다. 메시지 접수 과정에서 오류가 발생했습니다. 잠시 후 다시 보내주세요."
      );
    }

    // 저장 성공 후 고객에게 접수 안내
    return response(
      isOrder ? orderMessage : inquiryMessage
    );
  }
};
