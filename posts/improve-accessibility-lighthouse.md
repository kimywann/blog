---
title: "웹 접근성 개선 경험기: 스크린 리더와 색상 대비율 문제 해결"
date: "2025-11-24"
description: "PC와 모바일 환경 모두에서 일관된 UX를 제공하기 위해 레이아웃을 개선한 경험을 정리합니다."
---

## 들어가며

프로젝트에 접근성 검사 도구를 적용한 결과, 버튼 접근성과 색상 대비율 문제가 다수 발견되었습니다. 이번 글에서는 발견된 문제와 해결 과정을 공유합니다.

## 발견된 문제들

### 1. 버튼에 접근 가능한 이름이 없음

스크린 리더가 버튼의 목적을 인식하지 못하는 문제가 있었습니다.

- Header의 모바일 메뉴 버튼 (햄버거 아이콘만 있음)
- Select 컴포넌트들의 트리거 버튼 (포지션, 직무, 경력, 지역)

### 2. 색상 대비율 부족

WCAG AA 기준(4.5:1)을 충족하지 못하는 색상 조합이 있었습니다:

- InfoBadge의 배경/텍스트 조합
- 삭제 버튼의 빨간색 배경과 텍스트

## 해결 과정

### 1. 버튼 접근성 개선: aria-label 추가

**문제**: 아이콘만 있는 버튼은 스크린 리더가 "버튼"이라고만 읽습니다.

**해결**: 모든 인터랙티브 요소에 `aria-label` 속성을 추가했습니다.

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

**효과**: 스크린 리더가 각 버튼의 목적을 명확히 전달합니다.

### 2. 색상 대비율 개선

**문제**: 배경과 텍스트의 대비가 낮아 가독성이 떨어집니다.

**해결**: WCAG AA 기준(4.5:1)을 충족하도록 색상을 조정했습니다.

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

**변경 사항**:

- 배경 투명도: `/10` → `/100` (더 진한 배경)
- 텍스트 색상: `-600` → `-700` (더 진한 텍스트)

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

**변경 사항**:

- `red-400` → `red-600` (대비 개선)
- `text-white`로 명확한 대비 확보

## 접근성 기준 이해하기

### WCAG (Web Content Accessibility Guidelines)

- **WCAG AA**: 일반 텍스트 4.5:1, 큰 텍스트 3:1
- **WCAG AAA**: 일반 텍스트 7:1, 큰 텍스트 4.5:1

대부분의 경우 AA 기준을 목표로 합니다.

### 결과

- 접근성 검사 89점 -> 100점 달성

#### before

<img src="/images/posts/improve-accessibility-lighthouse/before.png" width="550px" style="display: block; margin: 0 auto;" />

#### after

<img src="/images/posts/improve-accessibility-lighthouse/after.png" width="550px" style="display: block; margin: 0 auto;" />

### 배운 점

1. **접근성은 기능 개발 후 추가하는 것이 아니라 개발 과정에 포함해야겠다.**
2. **`aria-label`은 아이콘 버튼이나 의미가 불명확한 요소에 필수다.**
3. **색상 대비는 디자인 단계에서부터 고려해야한다.**
