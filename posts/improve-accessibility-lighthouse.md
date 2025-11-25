---
title: "웹 접근성: 스크린 리더와 색상 대비율 문제 해결"
date: "2025-11-24"
description: "Lighthouse 접근성 검사에서 발견된 스크린 리더 문제와 색상 대비율 이슈를 해결한 경험을 정리합니다."
---

## 들어가며

WeCode 프로젝트에서 Lighthouse 접근성 검사 결과, 버튼 접근성과 색상 대비율 문제가 발견되었습니다. 이번 글에서는 발견된 문제와 해결 과정을 공유합니다.

## 발견된 문제들

### 1. 버튼에 접근 가능한 이름이 없음

<img src="/images/posts/improve-accessibility-lighthouse/aria.png" width="550px" style="display: block; margin: 0 auto;" />

<br />
스크린 리더가 버튼의 목적을 인식하지 못하는 문제가 있었습니다.

- Header의 모바일 메뉴 버튼 (햄버거 아이콘만 있음)
- Select 컴포넌트들의 트리거 버튼 (포지션, 직무, 경력, 지역)

### 2. 색상 대비율 부족

<img src="/images/posts/improve-accessibility-lighthouse/wcag.png" width="550px" style="display: block; margin: 0 auto;" />

<br />
WCAG AA 기준(4.5:1)을 충족하지 못하는 색상 조합이 있었습니다.

- InfoBadge의 배경/텍스트 조합
- 삭제 버튼의 빨간색 배경과 텍스트

## 해결 과정

### 1. aria-label 추가

**문제**

- 아이콘만 있는 버튼은 스크린 리더가 "버튼"이라고만 읽습니다.

**해결**

- 모든 인터랙티브 요소에 `aria-label` 속성을 추가했습니다.

#### Header 모바일 메뉴 버튼

```tsx
// Before
<SheetTrigger asChild>
  <Button variant="ghost">
    <Menu className="size-6" />
  </Button>
</SheetTrigger>

// After
<SheetTrigger asChild>
  <Button variant="ghost" aria-label="메뉴 열기">
    <Menu className="size-6" />
  </Button>
</SheetTrigger>
```

#### Select 컴포넌트들

```tsx
// Before
<SelectTrigger data-testid="select-position">
  <SelectValue placeholder="전체" />
</SelectTrigger>

// After
<SelectTrigger
  data-testid="select-position"
  aria-label="희망 포지션 선택"
>
  <SelectValue placeholder="전체" />
</SelectTrigger>
```

스크린 리더가 각 버튼의 목적을 명확히 전달합니다.

### 2. 색상 대비율 개선

**문제**

- 배경과 텍스트의 대비가 낮아 가독성이 떨어집니다.

**해결**

- WCAG AA 기준(4.5:1)을 충족하도록 색상을 조정했습니다.

<br />

#### InfoBadge 색상 개선

```tsx
// Before
const badgeThemes = {
  green: "border-none bg-green-300/10 text-sm text-green-600 font-semibold",
  blue: "border-none bg-blue-300/10 text-sm text-blue-600 font-semibold",
  red: "border-none bg-red-300/10 text-sm text-red-600 font-semibold",
  gray: "bg-gray-200 text-gray-700",
  white: "bg-slate-50 text-slate-500",
};

// After
const badgeThemes = {
  green: "border-none bg-green-100 text-green-700 font-semibold",
  blue: "border-none bg-blue-100 text-blue-700 font-semibold",
  red: "border-none bg-red-100 text-red-700 font-semibold",
  gray: "bg-gray-200 text-gray-800",
  white: "bg-slate-100 text-slate-700 font-bold",
};
```

**변경 사항**

- 배경 투명도: `/10` → `/100` (더 진한 배경)
- 텍스트 색상: `-600` → `-700` (더 진한 텍스트)

<br />

#### 삭제 버튼 색상 개선

```tsx
// Before
<Button
  variant="outline"
  className="!w-full !bg-red-400 text-white"
>
  삭제
</Button>

// After
<Button
  variant="outline"
  className="!w-full !bg-red-600 text-white hover:!bg-red-700"
>
  삭제
</Button>
```

**변경 사항**

- `red-400` → `red-600` (대비 개선)
- `text-white`로 명확한 대비 확보

## 접근성 기준 이해하기

### 색상 대비율이란?

색상 대비율(Contrast Ratio)은 배경색과 텍스트 색상의 밝기 차이를 나타내는 수치입니다. 대비율이 높을수록 텍스트가 더 잘 보이고 읽기 쉬워집니다.

**대비율 계산 방식**

- 1:1 = 같은 색상 (완전히 읽을 수 없음)
- 4.5:1 = WCAG AA 기준 (일반 텍스트)
- 7:1 = WCAG AAA 기준 (일반 텍스트)

**실제 예시**

<img src="/images/posts/improve-accessibility-lighthouse/compare.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

## 개선 결과

- 접근성 검사 89점 -> 100점 달성

<br />

### before

<img src="/images/posts/improve-accessibility-lighthouse/before.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

### after

<img src="/images/posts/improve-accessibility-lighthouse/after.png" width="550px" style="display: block; margin: 0 auto;" />

<br />

## 배운 점

#### 1. 접근성은 나중에 추가하는 게 아니라 처음부터 함께 만들어가는 거였다

Lighthouse로 검사를 돌리고 나서야 접근성 문제들을 발견했는데, 만약 개발 시작할 때부터 "이 버튼을 스크린 리더 사용자는 어떻게 인식할까?"를 고민했다면 미리 해결 했을텐데 하는 아쉬움이 남았습니다. 다음부터는 접근성을 함께 체크하는 습관을 들여야겠습니다.

#### 2. aria-label 하나가 누군가에게는 웹사이트를 쓸 수 있고 없고의 차이였다

저는 햄버거 메뉴 아이콘을 보면 당연히 "메뉴 버튼"이라는 걸 알지만, 스크린 리더로는 그냥 "버튼"이라고만 읽힙니다. 이게 단순히 "접근성 점수를 높이기 위한 기술"이 아니라, 실제로 스크린리더 사용자가 제 서비스를 사용할 수 있는지 없는지의 문제였습니다. 기능 구현에만 집중하다 보면 놓치기 쉬운 부분인데, 이제는 "모든 사용자가 이 기능을 사용할 수 있을까?"를 생각하게 되었습니다.

#### 3. 내 눈에 보기 좋다고 모두에게 보기 좋은 건 아니다

색상 대비율 문제를 고치면서 가장 놀랐던 건, 제가 보기에는 전혀 문제없어 보이던 색 조합들이 기준을 통과하지 못했다는 점입니다. 디자인적인 감각도 중요하지만, 모든 사용자가 내용을 읽을 수 있는 게 더 중요하다는 걸 배웠습니다.

## 마무리

이번 경험을 통해 **웹 접근성**이 특수 사용자만을 위한 것이 아니라는 걸 체감했습니다. 명확한 라벨, 충분한 색상 대비, 키보드로도 사용 가능한 인터페이스는 결국 모든 사용자에게 더 나은 경험을 제공한다고 생각합니다.

개발자로서 코드를 잘 짜는 것도 중요하지만, 내가 만든 서비스를 누구나 사용할 수 있게 만드는 것이 진짜 책임이라는 걸 느꼈습니다. 앞으로도 "이 기능을 모든 사람이 사용할 수 있을까?"를 항상 염두에 두고 개발해야겠습니다.
