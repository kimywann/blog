---
title: "Cypress E2E 테스트로 QA 자동화한 경험"
date: "2025-11-14"
description: "반복되는 수동 QA를 Cypress E2E 테스트로 자동화하고, 1줄 코드 추가만으로 확장 가능한 테스트 구조 만들기"
---

### 들어가며

이번 글에서는 Cypress E2E 테스트를 활용해 프로필 등록 폼의 반복적인 QA를 자동화한 경험을 정리합니다. 이 글에서는 제가 E2E 테스트 도입 배경, 초기 테스트 코드 작성, 문제점 발견, Custom Commands를 통한 리팩토링, 그리고 자동화 후 얻은 효과까지 경험을 순차적으로 공유하려 합니다.

### 배경

프로필 등록 폼에서 필드를 추가할 때마다 DB에 잘 들어가는지 UI는 깨지지 않는지 기타 에러사항은 없는지 매번 직접 검증하는 것이 비효율적이라고 느꼈습니다. QA에 시간을 많이 쓰다 보니 실제 개발에 집중할 시간이 줄어들었습니다. 추후에도 필드가 추가될 가능성이 있었기 때문에 자동화된 테스트가 필요했습니다.

### Cypress E2E 테스트 도입

이러한 문제를 해결하고자 E2E 테스트를 도입하기로 결정했습니다. E2E 테스트를 경험해본 적은 없어, 빠르게 적용해보고 싶어서 도구를 찾아보던 중 Cypress를 선택하게 되었습니다.

**Cypress를 선택한 이유**

- E2E 테스트 경험이 없었기 때문에, 바로 테스트를 작성하고 실행해볼 수 있어야 했습니다.
- 초기 설정이 간단하고, 코드를 수정하면 자동으로 테스트를 다시 실행해주는 실시간 리로딩 기능을 제공합니다.
- 자체 GUI 테스트 실행기(Test Runner)를 통해, 테스트 실행 중 발생하는 스냅샷, 에러 로그, 비디오 기록을 직관적으로 확인하고 디버깅할 수 있습니다.

### 초기 테스트 코드 시연

 <img src="/images/posts/cypress-e2e-test/test.gif" width="550px" style="display: block; margin: 0 auto;" />

<br />

빠르게 문법을 익힌 후, 실제 Cypress를 사용해 테스트 코드를 작성하고 실행해보았습니다.

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

<br />

#### 문제점

- 다른 테스트를 작성하려고 할 때, 로그인 로직이 반복되어 똑같은 코드를 써야 했습니다.
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

    // 4. 필드 선택 - 한 줄로 개선
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

2. 로그인이나 셀렉트 박스 동작이 변경되어도 commands.ts 파일만 수정하면 모든 테스트에 반영됩니다.

### 부수효과

E2E 테스트를 작성하고 실행하는 과정에서 예상치 못한 부수 효과를 얻었습니다. 테스트 실행 중 Cypress Test Runner의 스냅샷을 확인하던 중, 프로필 등록 폼의 희망 도메인 셀렉트 UI 레이아웃이 흐트러진 것을 발견했습니다.

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

기능 테스트만으로는 놓치기 쉬운 부분이었는데, Cypress가 각 단계마다 스냅샷을 저장해주니까 테스트하면서 UI를 직접 확인할 수 있어서 문제를 빠르게 찾고 해결할 수 있었습니다.

### 마무리

처음에는 초기 설정에 시간을 써야해서. 이 시간에 그냥 수동으로 검증하면 더 빠르지않을까 싶었습니다.. e2e 테스트를 왜하는거지 싶었는데 직접 해보니 초기 설정만 해놓으면 이후 검증에 들이는 시간이 줄어드는 것을 체감할 수 있었습니다. 또한, e2e 테스트 실행하면서 Cypress Test Runner 스냅샷 보다가 UI 레이아웃 깨진 것도 발견했습니다. 기능 테스트만으로는 못 찾았을 시각적 회귀 문제였는데, 테스트 돌리면서 자연스럽게 UI 확인하게 되어서 문제 빨리 찾고 고칠 수 있었습니다.
