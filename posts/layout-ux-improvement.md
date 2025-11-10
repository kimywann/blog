---
title: "사용자 경험을 중심으로 한 UI/UX 개선"
date: "2025-11-07"
description: "PC와 모바일 환경 모두에서 일관된 UX를 제공하기 위해 레이아웃을 개선한 경험을 정리합니다."
---

### 들어가며

이번 글에서는 WeCode 프로젝트의 **동료 찾기 페이지**를 개선하면서 겪었던 문제와 해결 과정을 정리합니다.
처음 만들 때는 괜찮아 보였던 레이아웃이 실제로 사용해보니 **불편한 점들이 드러났습니다**. 특히 모바일에서 사용하기 힘들다는 걸 느꼈습니다. 어떤 문제가 있었고, 어떻게 개선했는지 공유해보려 합니다.

<br />

## 1. 문제 배경

<figure>
  <img src="/images/posts/layout-ux-improvement/before.png" />
  <figcaption style="text-align: center; color: #666; font-size: 1em; margin-top: 8px;">
    개선 전 사이드바 레이아웃의 동료 찾기 페이지
  </figcaption>
</figure>

<br />

처음 만든 동료 찾기 페이지는 **데스크톱 중심의 사이드바 레이아웃**으로 구성되어 있었습니다. 왼쪽에 프로필 등록과 필터 옵션을, 오른쪽에 프로필 카드들을 배치한 구조였습니다. **데스크톱에서는 괜찮아 보였지만**, 막상 **모바일로 확인해보니 문제가 드러나기 시작했습니다**.

### 1-1. 문제점

<div style="text-align: center;">
  <img src="/images/posts/layout-ux-improvement/problem.jpeg" width="230px" style="display: block; margin: 0 auto;" />
  <br />
  <p style="color: #666; font-size: 0.9em; margin-top: 8px;">
    모바일 화면에서 사이드바가 과도한 공간을 차지
  </p>
</div>

<br />

개선 전 모바일 화면에서는 **사이드바가 화면의 절반 넘게 차지**하여 등록된 프로필을 확인하기엔 문제가 있고 개선 여지가 있었습니다.

또 하나의 문제는 **내 프로필 접근성**이었습니다. 프로필이 **생성 순으로 정렬**되다 보니, 등록자가 많아질수록 **내 프로필을 찾기가 점점 어려워졌습니다**. 기존 구조에서는 내 프로필을 확인하려면 목록을 스크롤하거나 수정 버튼으로만 접근할 수 있었습니다.

### 1-2. 어떻게 개선해 나갈지

**문제점 정리**

- 모바일 화면에서 사이드바를 사용하기엔 비효율적
- 모바일쪽 개선하게되면 데스크톱과 모바일 간 레이아웃 일관성 유지가 어려움
- 내 프로필 **접근성 떨어짐**

**개선 방법**

- 사이드바를 제거하고 **수직 레이아웃**으로 전환
- 데스크톱 · 모바일 **같은 정보 순서와 인터랙션 유지**
- 프로필 등록 후에 그 영역은 **내 프로필 영역으로 전환**

<br />

이렇게 하면 모바일에서도 위에서 아래로 자연스럽게 스크롤하면 되고, 데스크톱과 모바일이 일관된 느낌으로 보일 것 같았습니다.

## 2. 개선 과정

### 2-1. 프로필 미등록 상태

<figure>
  <img src="/images/posts/layout-ux-improvement/after-1.png" />
  <br />
  <figcaption style="text-align: center; color: #666; font-size: 1em; margin-top: 8px;">
    프로필 미등록 시, 프로필 등록 양식 표시
  </figcaption>
</figure>

<br />

#### 주요 변경 사항

- 사이드바 제거하고, 상단에 프로필 등록과 필터 재배치
- 프로필 미등록 상태일 때 → **프로필 등록 표시**

<br />

### 2-2. 프로필 등록 상태

<figure>
  <img src="/images/posts/layout-ux-improvement/after-2.png" width="500px" style="display: block; margin: 0 auto;" />
  <br />
  <figcaption style="text-align: center; color: #666; font-size: 1em; margin-top: 8px;">
    프로필 등록 후, 내 프로필 카드로 전환 (수정/삭제 버튼 포함)
  </figcaption>
</figure>

<br />

프로필 등록 후에는 동일한 영역이 **내 프로필 카드로 전환**되어, 언제든지 내 프로필 정보를 확인하고 수정할 수 있습니다.

### 2-3. 모바일 레이아웃 개선

<figure>
  <img src="/images/posts/layout-ux-improvement/mobile.gif" width="350px" style="display: block; margin: 0 auto;" />
  <br />
  <figcaption style="text-align: center; color: #666; font-size: 1em; margin-top: 8px;">
    모바일에서도 일관된 사용자 경험
  </figcaption>
</figure>

## 3. 개선 결과

- 페이지 들어가자마자 **등록된 내 프로필이 상단에 보임**
- 데스크톱과 모바일 간 **일관된 사용자 경험** 제공

## 마치며

#### 작은 화면부터 먼저 생각하기

다음에는 작은 화면부터 설계해 나가면서, 꼭 필요한 정보와 기능이 무엇인지 먼저 고민하려 합니다. 데스크톱에서 보기 좋은 디자인이 모바일에서는 불편할 수 있다는 걸 이번 개선을 통해 확실히 느꼈습니다. 반응형 디자인은 단순히 화면 크기를 맞추는 게 아니라, **어떤 환경에서도 자연스럽게 사용할 수 있게 만드는 것**이라는 걸 배웠습니다.
