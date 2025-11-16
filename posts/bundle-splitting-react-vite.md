---
title: "React 코드드 스플리팅"
date: "2025-09-10"
description: "React에서 코드 스플리팅으로 최적화한 경험 정리"
---

### 들어가며

이번 글에서는 React 페이지 단위 코드 스플리팅으로 불필요한 리소스 다운로드를 줄이는 방법을 실제 사례를 중심으로 설명합니다.

### 1. 문제

Lighthouse 성능 측정 결과, 초기 페이지 로드 시 3MB가 넘는 번들 크기 때문에
LCP(Largest Contentful Paint)가 4초 이상 지연되는 문제가 있었습니다.
wisesub 프로젝트에서는 Recharts 시각화 라이브러리, Supabase 관련 라이브러리 등이 초기 메인 번들에 포함되어 있었습니다.
Recharts는 차트 페이지에서만 사용됨에도 불구하고 메인 번들에 포함되면서 불필요한 다운로드가 발생했습니다.

![번들 최적화 전](/images/posts/bundle-splitting-react-vite/bundle-before.png)

이렇게 되면 아래와 같은 문제가 발생합니다.

- 웹사이트 초기 진입 시 사용하지 않는 페이지 리소스까지 함께 로드
- 번들 크기 증가로 인해 LCP(Largest Contentful Paint)가 4초 이상 지연
- Lighthouse에서 텍스트 압축 사용 권고 등 최적화 경고 발생

### 1-1. React.lazy로 페이지 단위 코드 스플리팅

앞선 문제를 해결하기 위해, `React.lazy`를 활용하여 페이지 단위 코드 스플리팅을 적용했습니다.

핵심은 간단합니다.

> "사용자가 방문할 때만 필요한 코드와 라이브러리를 불러오자!"

<br />

#### Before (개선 전)

모든 페이지 컴포넌트를 초기 로딩 시 미리 불러오기 때문에, 사용하지 않는 페이지의 코드와 라이브러리까지 함께 번들에 포함됩니다.

```tsx
// 모든 페이지 컴포넌트를 미리 불러옵니다.
import HomePage from "./pages/HomePage";
import ChartPage from "./pages/ChartPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/chart",
    element: <ChartPage />,
  },
]);
```

<br />

#### After (개선 후)

React.lazy와 Suspense를 사용하여, 사용자가 해당 페이지를 방문할 때만 코드가 로드되도록 변경했습니다.

```tsx
import { lazy, Suspense } from "react";

// '필요할 때' 불러오도록 동적 import를 사용합니다.
const ChartPage = lazy(() => import("./pages/HomePage"));
const HomePage = lazy(() => import("./pages/HomePage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<div>메인 페이지 로딩 중...</div>}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/chart",
    element: (
      <Suspense fallback={<div>차트 데이터 로딩 중...</div>}>
        <ChartPage />
      </Suspense>
    ),
  },
]);
```

이렇게 lazy를 사용해 컴포넌트를 동적으로 불러오도록 바꾸자, 문제는 동적으로 컴포넌트를 불러오는 동안 화면이 잠시 비어버린다는 점입니다. 이때 사용자는 페이지가 멈췄다고 느낄 수 있습니다.

이때 Suspense가 등장합니다.
동적으로 컴포넌트를 불러오는 동안 빈 화면 대신 '로딩 중...' 과 같은 fallback UI를 보여줄 수 있습니다.
덕분에 사용자는 페이지가 정상적으로 로딩 중이라는 것을 인지할 수 있습니다.

### 1-2. 라우팅 중복 코드 리팩토링

코드를 작성하다 보니 한 가지 아쉬운 점이 보였습니다.
기존 코드는 모든 라우트마다 공통 레이아웃인 `<Layout>`을 반복해서 작성하였습니다.

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <HomePage />
      </Layout>
    ),
  },
  {
    path: "/chart",
    element: (
      <Layout>
        <ChartPage />
      </Layout>
    ),
  },
  // ...
]);

export default router;
```

저는 이 중복을 줄이기 위해 **중첩 라우팅을 활용**했습니다.

```tsx
// 중첩 라우팅을 이용한 개선
const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<div>로딩 중...</div>}>
        <Layout />
      </Suspense>
    ),
    children: [
      { path: "/", element: <HomePage /> },
      // ... 다른 모든 라우트
    ],
  },
]);
```

이렇게 공통으로 적용될 컴포넌트들을 하나의 부모 라우트에 모으고, 자식 라우트들은 children으로 관리했습니다.
이로써 코드의 중복을 깔끔하게 제거하고, 가독성과 유지보수성을 모두 잡을 수 있었습니다.

### 2. 성능 지표 개선

최적화 후, 주요 성능 지표가 크게 개선되었습니다.

![번들 최적화 후](/images/posts/bundle-splitting-react-vite/bundle-after.png)

- LCP (Largest Contentful Paint) 4.6초 → 0.4초
- FCP(First Contentful Paint) 2.1초 → 0.4초
