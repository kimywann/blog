---
title: "Cypress E2E 테스트로 QA 자동화한 경험"
date: "2025-11-14"
description: "반복되는 수동 QA를 Cypress E2E 테스트로 자동화하고, 1줄 코드 추가만으로 확장 가능한 테스트 구조 만들기"
---

이 글에서는 E2E 테스트를 도입하게 된 배경부터 초기 코드 작성, 문제점 발견, Custom Commands로 리팩토링한 과정, 그리고 자동화 후 얻은 효과까지 순차적으로 정리합니다.

### E2E 테스트 도입 배경

제가 진행한 프로젝트는 사이드 프로젝트 팀 모집 웹 서비스로, 사용자는 팀 모집글을 작성해 팀원을 구하거나 프로필을 등록해 팀빌딩 제안을 받을 수 있습니다. 팀을 모집하는 사용자 역시 등록된 프로필을 살펴보며 적합한 사람에게 직접 제안을 보낼 수 있어, 양방향으로 팀빌딩이 이루어지는 구조입니다.

여기서 프로필 등록 폼은 MVP 단계에서 기능 확장에 따라 필드가 점점 추가되는 구조였고, 새로운 항목을 넣을 때마다 UI가 정상적으로 동작하는지, 저장된 값이 화면에 제대로 반영되는지 등을 매번 수동으로 확인해야 했습니다. 이러한 반복적인 QA 때문에 개발 시간이 줄어들었고, 향후 필드가 더 늘어날 가능성까지 고려하면 자동화된 E2E 테스트 도입이 필요했습니다.

### Cypress E2E 테스트 도입

이러한 문제를 해결하고자 E2E 테스트를 도입하기로 결정했습니다. E2E 테스트 경험이 없어, 도구를 찾아보던 중 Cypress를 선택하게 되었습니다.

**Cypress를 선택한 이유**

- 초기 설정이 간단하고, 코드를 수정하면 자동으로 테스트를 다시 실행해주는 실시간 리로딩 기능
- GUI 테스트 실행기(Test Runner)를 통해, 테스트 실행 중 발생하는 스냅샷, 에러 로그, 비디오 기록을 직관적으로 확인하고 디버깅 용이

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

- 추후의 팀 모집 글 작성에서도 E2E 테스트 작성할 때, 로그인 로직이 계속 반복되어 같은 코드를 여러 번 작성해야 한다는 문제가 보였습니다.
- 셀렉트 박스를 선택하는 패턴(다이얼로그 안에서 클릭 → listbox 대기 → 옵션 선택)이 여러 번 반복되었습니다.

### Custom Commands로 공통 로직 추출

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

- `cy.login()`으로 로그인 공통화

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

- `cy.selectInDialog(id, value)`로 셀렉트 패턴 공통화

### 개선된 테스트 코드

```ts
cy.login();
cy.selectInDialog("select-job", "대학생");
cy.selectInDialog("select-position", "프론트엔드");
cy.selectInDialog("select-region", "서울");
```

<br />

#### 개선 효과

- 나중에 새로운 필드가 추가 될 때 한줄만 추가
- 로그인이나 셀렉트 박스 동작이 변경되어도 commands.ts 파일만 수정하면 모든 테스트에 반영

### 테스트 과정에서 잡아낸 UI 오류

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

## 마무리

처음에는 초기 설정에 시간이 들어 “차라리 수동으로 검증하는 게 더 빠르지 않을까?” 싶었지만, 한 번 구축해두니 이후 반복 검증 시간이 크게 줄었습니다. 또 테스트를 돌리다 UI가 깨진 것도 바로 발견해 기능 테스트만으로는 놓칠 시각적 회귀 문제까지 잡아낼 수 있었어요.

다만 모든 테스트에 적용하기보다는 비즈니스 로직에 선택적으로 쓰는 편이 더 효율적이라고 느꼈습니다. E2E 테스트는 비용은 높지만 실제 유저 흐름을 그대로 검증할 수 있어, 중요 기능을 지켜주는 마지막 안전망에 가깝다는 느낌이었습니다.
