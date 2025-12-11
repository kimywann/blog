---
title: "접근성을 해치는 작은 실수들 바로잡기"
date: "2025-12-11"
description: "링크 레이블 누락, heading 계층 깨짐 문제를 수정하며 접근성 문제 에러 해결기"
---

이 글은 네비게이션 링크 레이블 누락과 heading 계층 오류를 어떻게 발견하고 수정했는지, 그 개선 과정을 정리한 기록입니다.

## 문제 배경

<img src="/images/posts/improve-accessibility/1.png" width="550px" style="display: block; margin: 0 auto;" />

장바구니 · 로그인 등 주요 네비게이션 요소와 상품 리스트 페이지를 개발한 뒤 Lighthouse로 접근성을 점검하였고, 두 가지 경고가 발생했습니다.

### 1. 링크에 인식 가능한 이름이 없음

<img src="/images/posts/improve-accessibility/2.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

헤더 네비게이션에서 아이콘만 있는 링크들이 스크린리더에서 이름 없이 읽히는 문제가 있었습니다. 처음에는 아이콘 링크에 레이블을 주기 위해 `<li>` 요소에 aria-label을 적용했는데, Lighthouse에서는 여전히 **"인식 가능한 링크 이름이 없음"** 경고가 사라지지 않았습니다.

원인을 조사하면서 스크린리더는 포커스 가능한 요소(a, button 등)에서만 레이블을 읽고, `<li>`처럼 포커스되지 않는 컨테이너에 있는 aria-label은 무시한다는 규칙을 확인했습니다.

이 기준을 반영해, 기존처럼 `<li aria-label="프로필">` 형태가 아닌, 실제 클릭 가능한 `<Link>` 또는 `<button>` 요소에 aria-label을 부여하도록 구조를 변경하여 문제를 해결하였습니다.

### 2. 제목 요소가 내림차순으로 표시되지 않음

<img src="/images/posts/improve-accessibility/3.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

상품 카드에서 상품명 제목을 `<h3>`로 사용했지만, 페이지 전체 구조에 `<h2>`가 없어 **heading 계층이 끊어지는 문제**가 발생했습니다. 이 과정을 통해 스크린리더가 heading 태그를 문서 구조의 핵심 정보로 사용한다는 점을 학습했습니다.

상품 카드는 문서의 새로운 섹션이 아니라 목록의 반복 요소이기 때문에 heading 태그를 사용하면 구조가 불필요하게 깊어지고, 스크린리더에서는 의미 없는 제목 목록으로 과도하게 노출될 수 있습니다. 이를 고려해 상품명을 `<p>`로 변경하여 문제를 해결했습니다.

### **결과**

<img src="/images/posts/improve-accessibility/4.png" width="600px" style="display: block; margin: 0 auto;" />

<br />

문서 구조와 네비게이션 요소의 접근성이 개선되며 Lighthouse 접근성 점수가 94점 → 100점으로 향상되었습니다.

<br />

## 러닝 포인트

이번 작업을 통해 그동안 무심코 사용하던 HTML 구조와 ARIA 속성의 의미를 다시 점검할 수 있었습니다. 단순히 Lighthouse 경고를 없애는 수준이 아니라, 왜 이런 규칙이 존재하는지, 그리고 문서 구조와 접근성이 실제 사용자 경험에 어떤 영향을 주는지를 이해하는 과정이었습니다.
