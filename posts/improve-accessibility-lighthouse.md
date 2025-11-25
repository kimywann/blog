---
title: "웹 접근성: 스크린 리더와 색상 대비율 문제 해결"
date: "2025-11-24"
description: "PC와 모바일 환경 모두에서 일관된 UX를 제공하기 위해 레이아웃을 개선한 경험을 정리합니다."
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

✅ 매우 좋음

- 회색 배경(`#CCCCCC`) + 검은색 텍스트(`#000000`) = 약 12.6:1

❌ 읽기 어려움

- 연한 회색 배경(`#F0F0F0`) + 회색 텍스트(`#888888`) = 약 2.5:1

✅ 완벽

- 흰색 배경(`#FFFFFF`) + 검은색 텍스트(`#000000`) = 21:1

### WCAG (Web Content Accessibility Guidelines)

WCAG는 웹 콘텐츠 접근성 지침으로, 시각 장애인이나 색맹 사용자도 웹사이트를 사용할 수 있도록 하는 국제 표준입니다.

**WCAG AA (일반적으로 목표로 하는 기준)**

- 일반 텍스트, 최소 4.5:1 대비율
- 큰 텍스트(18pt 이상 또는 14pt 이상의 굵은 글씨), 최소 3:1 대비율
- 대부분의 웹사이트가 달성해야 하는 수준

**WCAG AAA (더 엄격한 기준)**

- 일반 텍스트, 최소 7:1 대비율
- 큰 텍스트, 최소 4.5:1 대비율
- 특수한 경우나 높은 접근성이 필요한 사이트에서 목표로 함

**왜 AA 기준을 목표로 하나요?**

- AAA는 매우 엄격해서 디자인 제약이 큽니다
- AA만 충족해도 대부분의 사용자가 충분히 읽을 수 있습니다

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

1. **접근성은 기능 개발 후 추가하는 것이 아니라 개발 과정에 포함해야겠다.**
2. **`aria-label`은 아이콘 버튼이나 의미가 불명확한 요소에 필수다.**
3. **색상 대비는 디자인 단계에서부터 고려해야한다.**
