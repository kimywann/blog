---
title: "Cypress E2E 테스트로 QA 자동화한 경험"
date: "2025-11-14"
description: "반복되는 수동 QA를 Cypress E2E 테스트로 자동화하고, 1줄 코드 추가만으로 확장 가능한 테스트 구조 만들기"
---

### 배경

프로젝트에서 프로필 등록 폼을 개발하던 중, 필드를 추가할 때마다 매번 수동으로 테스트하는 것이 비효율적이라고 느꼈습니다. 특히 "연락 수단", "현재 직무", "희망 포지션" 등 여러 필드가 있고, 앞으로도 필드가 추가될 가능성이 있었기 때문에 자동화된 테스트가 필요했습니다.

### 문제 상황

반복적인 수동 QA

- 새 필드를 추가하거나 수정할 때마다 로그인부터 프로필 등록까지 전체 플로우를 직접 테스트해야 했습니다

회귀 테스트 부담

- 한 부분을 수정했을 때 다른 부분이 제대로 작동하는지 확인하기 위해 모든 필드를 다시 테스트해야 했습니다

개발 생산성 저하

- QA에 시간을 많이 쓰다 보니 실제 개발에 집중할 시간이 줄어들었습니다

### Cypress E2E 테스트 도입

**E2E 테스트 도구 중 Cypress를 선택한 이유**

1. 낮은 러닝 커브 : 처음 E2E 테스트 도구를 사용하는 입장에서 문법이 직관적이고 이해하기 쉬웠습니다
2. 시각적 피드백 : 테스트가 실행되는 과정을 브라우저에서 직접 볼 수 있어 UI가 깨지는 부분을 쉽게 발견할 수 있었습니다
3. 간결한 문법 : cy.get(), cy.click() 같은 직관적인 API로 빠르게 테스트를 작성할 수 있었습니다

### 초기 테스트 코드 문제점

처음 작성한 테스트 코드는 동작은 했지만, 몇 가지 문제가 있었습니다.

```ts
describe("프로필 등록", () => {
  it("프로필 등록 플로우", () => {
    // 로그인 과정
    cy.visit("http://localhost:5173/");
    cy.get("button").contains("로그인").click();
    cy.url().should("include", "/sign-in");
    cy.get("input[name='email']").type("test@test.com");
    cy.get("input[name='password']").type("123123123");
    cy.get("form").within(() => {
      cy.get("button[type='submit']").contains("로그인").click();
    });

    // 필드 선택 과정이 반복됨
    cy.get("[role='dialog']").within(() => {
      cy.get("[data-testid='select-job']").click();
    });
    cy.get("[role='listbox']").should("be.visible");
    cy.get("[role='option']").contains("대학생").click();

    cy.get("[role='dialog']").within(() => {
      cy.get("[data-testid='select-position']").click();
    });
    cy.get("[role='listbox']").should("be.visible");
    cy.get("[role='option']").contains("프론트엔드").click();

    // 이런 패턴이 계속 반복...
  });
});
```

문제점 분석

- 로그인 로직이 매번 반복되어 다른 테스트를 작성하려고 할 때, 똑같은 코드를 써야 했습니다.
- 셀렉트 박스를 선택하는 패턴(다이얼로그 안에서 클릭 → listbox 대기 → 옵션 선택)이 여러 번 반복되었습니다.
- 나중에 테스트 파일 많아질 때, 로그인 URL이나 방식이 바뀌면 모든 파일을 수정해야 했습니다.

### 리팩토링: Custom Commands로 개선

Cypress의 Custom Commands 기능을 활용하여 반복되는 로직을 재사용 가능한 함수로 만들었습니다.

1. 로그인 커맨드 분리

```ts
// cypress/support/commands.ts
Cypress.Commands.add("login", () => {
  cy.visit("http://localhost:5173/");
  cy.get("button").contains("로그인").click();
  cy.get("input[name='email']").type("test@test.com");
  cy.get("input[name='password']").type("123123123");
  cy.get("form").within(() => {
    cy.get("button[type='submit']").click();
  });
});
```

#### 왜 이렇게 했을까?

로그인은 거의 모든 테스트의 시작점이므로, 한 번 정의해두면 cy.login()만 호출하면 됩니다
로그인 방식이 바뀌어도 이 파일 한 곳만 수정하면 모든 테스트에 반영됩니다

2. 셀렉트 박스 선택 커맨드

```ts
Cypress.Commands.add("selectInDialog", (testId: string, optionText: string) => {
  cy.get("[role='dialog']").within(() => {
    cy.get(`[data-testid="${testId}"]`).click();
  });
  cy.get("[role='listbox']").should("be.visible");
  cy.get("[role='option']").contains(optionText).click();
});
```

testId와 optionText를 인자로 받아 다양한 셀렉트 박스에 재사용할 수 있습니다

### 개선된 테스트 코드

```ts
describe("프로필 등록", () => {
  it("프로필 등록 플로우", () => {
    // 1. 간결해진 로그인
    cy.login();

    // 2. 프로필 등록 페이지로 이동
    cy.get("a[href='/find-teammates']", { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.get("button").contains("프로필 등록").click();
    cy.get("[role='dialog']", { timeout: 5000 }).should("be.visible");

    // 3. 연락 수단 입력
    cy.get("[role='dialog']").within(() => {
      cy.get("input[placeholder='오픈채팅 링크 또는 이메일 주소']")
        .clear()
        .type("contact@example.com");
    });

    // 4. 필드 선택 - 한 줄로 간결하게!
    cy.selectInDialog("select-job", "대학생");
    cy.selectInDialog("select-position", "프론트엔드");
    cy.selectInDialog("select-experience", "신입 (1년 이하)");
    cy.selectInDialog("select-region", "서울");
    cy.selectInDialog("select-domain", "커머스");

    // 5. 나머지 필드 입력
    cy.get("[role='dialog']").within(() => {
      cy.get("textarea[placeholder='간단히 역량 어필해 주세요.']")
        .clear()
        .type(
          "안녕하세요. React와 TypeScript를 다루는 프론트엔드 개발자입니다."
        );

      cy.get("input[placeholder='https://example.com']")
        .clear()
        .type("https://github.com/test");

      cy.get("button[type='submit']").contains("등록 완료").click();
    });

    // 6. 검증
    cy.get("[role='dialog']").should("not.exist");
    cy.contains("프로필 등록이 완료되었습니다", { timeout: 5000 }).should(
      "be.visible"
    );
  });
});
```

### 개선 효과

1. 나중에 새로운 필드가 추가 될 때 한줄만 추가하면 됩니다.

```ts
cy.selectInDialog("select-new-field", "새로운 옵션");
```

2. 로그인 방식이나 셀렉트 박스 동작이 변경되어도 commands.ts 파일만 수정하면 모든 테스트가 자동으로 업데이트됩니다.

### 알아두면 좋은 점

1. 테스트 코드도 프로덕션 코드처럼 작성하기
   테스트 코드를 "임시로 작성하는 코드"가 아닌, 유지보수해야 하는 코드로 생각하고 리팩토링했습니다. DRY(Don't Repeat Yourself) 원칙은 테스트 코드에도 적용됩니다.
2. Portal 렌더링 패턴 이해의 중요성
   처음에는 다이얼로그 안에서 listbox를 찾으려다 실패했습니다. React Portal이 어떻게 동작하는지 이해하고 나서야 올바른 셀렉터를 작성할 수 있었습니다. DOM 구조를 정확히 이해하는 것이 E2E 테스트의 핵심입니다.
3. data-testid 속성의 중요성
   초기에는 placeholder나 class로 요소를 찾았지만, 이는 디자인 변경 시 테스트가 깨질 수 있습니다. data-testid 같은 테스트 전용 속성을 사용하면 테스트의 안정성이 크게 향상됩니다.

```ts
// 프로덕션 코드에 테스트를 위한 속성 추가
<Select data-testid="select-job">{/* ... */}</Select>
```

### 마무리

처음에는 초기 설정에 시간을 써야해서. 이 시간에 그냥 수동으로 더 빠르지않을까 싶었습니다.. 테스트를 왜하는거지 싶었는데 하고 나니깐 테스트 자동화는 단순히 "시간 절약" 이상의 가치가 있습니다. 안심하고 코드를 수정할 수 있는 환경을 만들어주고, 더 빠르게 기능을 개선할 수 있게 해줍니다. 다음 프로젝트에서는 처음부터 테스트를 염두에 두고 개발할 계획입니다. 그만큼 테스트 자동화의 가치를 확실히 느꼈습니다.
