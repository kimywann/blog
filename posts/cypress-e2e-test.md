---
title: "Cypress E2E 테스트 도입"
date: "2025-11-14"
description: "반복되는 수동 QA를 Cypress E2E 테스트 도입하여 QA 부담 줄이고, 1줄 코드 추가만으로 확장 가능한 테스트 구조 만들기"
---

이 글에서는 E2E 테스트를 도입하게 된 배경부터 초기 코드 작성, 문제점 발견, Custom Commands로 리팩토링한 과정, 그리고 자동화 후 얻은 효과까지 순차적으로 정리합니다.

## E2E 테스트 도입 배경

제가 진행한 프로젝트는 사이드 프로젝트 팀 모집과 프로필 기반으로 매칭되는 구조라, 프로필 등록 폼을 계속 개선해 나가야 했습니다. MVP 단계라 필드가 자주 바뀌었고, 새로운 값을 넣는 과정에서 UI가 정상적으로 동작하는지, 저장된 데이터가 화면에 잘 반영되는지 매번 직접 확인해야 했습니다.

처음에는 그냥 수동으로 확인하면서 개발을 진행했는데, 필드가 늘어날수록 같은 검증을 반복하는 데 시간이 꽤 많이 들었습니다. 앞으로도 폼이 더 확장될 가능성이 있어 이런 방식으로는 개발 속도가 계속 떨어질 것 같았습니다. 이런 배경 때문에 E2E 테스트 도입을 고민하게 됐습니다.

## Cypress 선택한 이유

이러한 문제를 해결하고자 E2E 테스트를 도입하기로 결정했습니다. E2E 테스트 경험이 없어 도구를 비교해봤고, 그중 초기 설정이 간단하고 실행 흐름을 눈으로 바로 확인할 수 있는 Cypress를 선택했습니다.

- 초기 설정이 간단하고, 코드를 수정하면 자동으로 테스트를 다시 실행해주는 실시간 리로딩 기능
- GUI 테스트 실행기(Test Runner)를 통해, 테스트 실행 중 발생하는 스냅샷, 에러 로그, 비디오 기록을 확인하고 디버깅 용이

## 초기 테스트 코드

 <img src="/images/posts/cypress-e2e-test/test.gif" width="550px" style="display: block; margin: 0 auto;" />

<br />

프로필 등록 플로우 전체 실제 사용자 시나리오(로그인 → 프로필 등록 입력 → 저장)를 그대로 재현함으로써 필드가 늘어나도 수동 QA 의존도를 낮추는 것이 1차 목표였습니다.

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

- 추후의 팀 모집 글 작성에서도 E2E 테스트 작성할 때, 로그인 로직이 계속 반복되어 같은 코드를 여러 번 작성해야 한다는 문제가 보였습니다.
- 셀렉트 박스를 선택하는 패턴(다이얼로그 안에서 클릭 → listbox 대기 → 옵션 선택)이 여러 번 반복되었습니다.

## Custom Commands로 공통 로직 추출

Cypress의 Custom Commands 기능을 활용하여 반복되는 로직을 재사용 가능한 함수로 만들었습니다.

#### 1. 로그인 커맨드

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

#### 2. 셀렉트 커맨드

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

#### 개선된 테스트 코드

```ts
cy.login();
cy.selectInDialog("select-job", "대학생");
cy.selectInDialog("select-position", "프론트엔드");
cy.selectInDialog("select-region", "서울");
```

#### 개선 효과

- 나중에 새로운 필드가 추가 될 때 한줄만 추가
- 로그인이나 셀렉트 박스 동작이 변경되어도 `commands.ts` 파일만 수정하면 모든 테스트에 반영

<br />

## 테스트 과정에서 잡아낸 UI 오류

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

`Cypress Test Runner`로 실행 흐름을 확인하던 중, 새로 추가한 희망 도메인 필드의 셀렉트 UI 레이아웃이 예상과 다르게 깨져 있는 것을 발견했습니다. 수동으로는 놓칠 수 있었던 부분이었는데, 테스트 실행 과정에서 바로 드러나 빠르게 수정할 수 있었습니다.

## 개선 결과

- QA 검증 시간 감소
- Custom Commands 적용으로 테스트 유지보수성 향상
- 기능 · 디자인 변경 시 발생하는 UI 오류 조기 발견

## 러닝 포인트

모든 테스트에 적용하기보다는 비즈니스 로직에 선택적으로 쓰는 편이 더 효율적이라고 느꼈습니다. E2E 테스트는 비용은 높지만 실제 유저 흐름을 그대로 검증할 수 있어 핵심 기능이 깨지지 않도록 마지막으로 한 번 더 잡아주는 역할을 해준다는 느낌을 받았습니다.
