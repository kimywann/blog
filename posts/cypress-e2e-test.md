---
title: "Cypress E2E 테스트로 QA 자동화한 경험"
date: "2025-11-14"
description: "반복되는 수동 QA를 Cypress E2E 테스트로 자동화하고, 1줄 코드 추가만으로 확장 가능한 테스트 구조 만들기"
---

이 글에서는 E2E 테스트를 도입하게 된 배경부터 초기 코드 작성, 문제점 발견, Custom Commands로 리팩토링한 과정, 그리고 자동화 후 얻은 효과까지 순차적으로 정리합니다.

### 문제

프로필 등록 폼에서 필드를 추가할 때마다 DB에 잘 들어가는지 UI가 깨지지 않는지, 입력 · 저장 과정에서 오류는 없는지 매번 직접 확인해야 하는 점이 비효율적이라고 느꼈습니다. QA에 시간을 많이 쓰다 보니 실제 개발에 집중할 시간이 줄어들었습니다. 추후에도 필드가 추가될 가능성이 있었기 때문에 자동화된 테스트가 필요했습니다.

### Cypress E2E 테스트 도입

이러한 문제를 해결하고자 E2E 테스트를 도입하기로 결정했습니다. E2E 테스트를 해본 적은 없어, 빠르게 적용해보고 싶어서 도구를 찾아보던 중 Cypress를 선택하게 되었습니다.

**Cypress를 선택한 이유**

- E2E 테스트 경험이 없었기 때문에, 바로 테스트를 작성하고 실행해볼 수 있어야 했습니다.
- 초기 설정이 간단하고, 코드를 수정하면 자동으로 테스트를 다시 실행해주는 실시간 리로딩 기능도 활용할 수 있었습니다.
- 자체 GUI 테스트 실행기(Test Runner)를 통해, 테스트 실행 중 발생하는 스냅샷, 에러 로그, 비디오 기록을 직관적으로 확인하고 디버깅할 수 있었습니다.

### 초기 테스트 코드 시연

 <img src="/images/posts/cypress-e2e-test/test.gif" width="550px" style="display: block; margin: 0 auto;" />

<br />

빠르게 문법을 익힌 후, Cypress를 사용해 프로필 등록 플로우 테스트 코드를 작성하고 실행해보았습니다.

### 초기 테스트 코드 문제점

처음 작성한 테스트 코드는 동작은 했지만, 몇 가지 문제점이 있었습니다.

```ts
describe("프로필 등록", () => {
  it("프로필 등록 플로우", () => {
    // 로그인 과정, 이후에도 E2E 테스트 작성하려고 할 때,
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

<br />

#### 문제점

- 다른 테스트를 작성하려고 할 때, 로그인 로직이 계속 반복되어 같은 코드를 여러 번 작성해야 한다는 문제가 보였습니다.
- 셀렉트 박스를 선택하는 패턴(다이얼로그 안에서 클릭 → listbox 대기 → 옵션 선택)이 여러 번 반복되었습니다.

### Custom Commands로 개선

Cypress의 Custom Commands 기능을 활용하여 반복되는 로직을 재사용 가능한 함수로 만들었습니다.

**1. 로그인 커맨드**

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

<br />

로그인은 거의 모든 테스트의 시작점이므로, 한 번 정의해두면 cy.login()만 호출하면 됩니다.

**2. 셀렉트 커맨드**

```ts
Cypress.Commands.add("selectInDialog", (id: string, selectedOption: string) => {
  cy.get("[role='dialog']").within(() => {
    cy.get(`[data-testid="${id}"]`).click();
  });
  cy.get("[role='listbox']").should("be.visible");
  cy.get("[role='option']").contains(selectedOption).click();
});
```

id와 selectedOption를 파라미터로 받아 다양한 셀렉트 박스에 재사용할 수 있습니다.

### 개선된 테스트 코드

```ts
describe("프로필 등록", () => {
  it("프로필 등록 플로우", () => {
    // 1. 로그인
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

    // 4. 필드 선택 - 한 줄로 간결하게
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

- 나중에 새로운 필드가 추가 될 때 한줄만 추가
- 로그인이나 셀렉트 박스 동작이 변경되어도 commands.ts 파일만 수정하면 모든 테스트에 반영

### 시각적 회귀 테스트

Cypress Test Runner의 스냅샷을 확인하던 중, 프로필 등록 폼의 희망 도메인 셀렉트 UI 레이아웃이 흐트러진 것을 발견했습니다.

<div style="display: flex; gap: 30px; justify-content: center; align-items: flex-start; margin: 20px 0;">
  <div style="text-align: center;">
    <img src="/images/posts/cypress-e2e-test/before.png" width="500px" style="display: block; margin: 0 auto;" />
    <p style="margin-top: 10px; font-size: 14px; color: #666;">Before</p>
  </div>
  <div style="text-align: center;">
    <img src="/images/posts/cypress-e2e-test/after.png" width="500px" style="display: block; margin: 0 auto;" />
    <p style="margin-top: 10px; font-size: 14px; color: #666;">After</p>
  </div>
</div>

E2E 테스트 과정에서 UI를 직접 확인할 수 있어 문제를 빠르게 발견하고 수정할 수 있었습니다.

### 마무리

처음에는 초기 설정에 시간이 들어 “차라리 수동으로 검증하는 게 더 빠르지 않을까?” 싶었지만, 한 번 구축해두니 이후 반복 검증 시간이 크게 줄었습니다. 또 테스트를 돌리다 UI가 깨진 것도 바로 발견해 기능 테스트만으로는 놓칠 시각적 회귀 문제까지 잡아낼 수 있었어요.

다만 모든 테스트에 적용하기보다는 비즈니스 로직에 선택적으로 쓰는 편이 더 효율적이라고 느꼈습니다. E2E 테스트는 비용은 높지만 실제 유저 흐름을 그대로 검증할 수 있어, 중요 기능을 지켜주는 마지막 안전망에 가깝다는 느낌이었습니다.
