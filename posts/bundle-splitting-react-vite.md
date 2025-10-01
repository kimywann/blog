---
title: "대규모 번들 파일로 인한 초기 렌더링 지연 문제"
date: "2025-09-10"
description: "React.lazy, Suspense, Vite manualChunks를 활용해 LCP와 라우팅 지연을 개선한 사례를 정리"
---

### 들어가며

초기 로딩 시 3MB가 넘는 대규모 번들 파일 때문에
LCP(Largest Contentful Paint)가 4초 이상 지연되는 문제가 있었습니다.
wisesub 프로젝트에서는 Recharts시각화 라이브러리, Supabase 관련 라이브러리 등
대용량 라이브러리들을 초기 로딩 시 모두 번들에 포함되어 있었습니다.

![번들 최적화 전](/images/posts/bundle-splitting-react-vite/bundle-before.png)

이렇게 되면 아래와 같은

- 웹사이트 초기 로딩 시 엄청난 양의 데이터를 다운로드
- 사용하지 않는 페이지의 리소스까지 무조건 로딩
- 초기 로딩 속도 느려짐

문제가 발생합니다.

이 문제를 해결하기위해 3가지 과정을 거치게 되었습니다.

### 1-1. React.lazy로 코드 스플리팅

이 문제를 해결하기 위해 페이지 단위로 코드 스플리팅을 적용하기로 했습니다.

핵심은 간단합니다. "필요할 때 필요한 코드만 불러오자!"

이를 위해 저는 React에서 제공하는 lazy와 Suspense 기능을 사용했습니다.

```tsx
// Before (기존 코드)
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

```tsx
// After (개선 코드)
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

이렇게 lazy를 사용해 컴포넌트를 동적으로 불러오도록 바꾸자, 빌드 시 별도의 파일(청크)로 분리되었습니다. 그리고 이 파일은 이제 사용자가 Chart 페이지에 실제로 접속할 때만 다운로드됩니다.
하지만 여기서 문제가 생기게 되는데, 동적으로 컴포넌트를 불러오는 동안 화면이 텅 비어버리는 현상 생깁니다.

이때 Suspense가 등장합니다.
동적으로 컴포넌트를 불러오는 동안 빈 화면이 아닌 '로딩 중...' 메시지를 보여줌으로써,
사용자는 페이지가 정상적으로 로딩 중이라는 것을 인지할 수 있습니다.

### 1-2. 라우팅 중복 코드 리팩토링

코드를 작성하다 보니 한 가지 아쉬운 점이 보였습니다.
기존 코드는 모든 라우트마다 공통 레이아웃인 <Layout>을 반복해서 작성하였습니다.

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

저는 이 중복을 줄이기 위해 중첩 라우팅을 활용했습니다.

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

### 1-3. 빌드 단계에서의 청크 최적화

React.lazy로 페이지 단위 분리를 하면서 초기 로딩 속도를 개선했지만,
여기서 한 가지 고민이 더 필요했습니다.

바로 여러 페이지에서 공통으로 사용하는 라이브러리들입니다.
예를 들어, react, react-dom, react-router-dom 같은 핵심 라이브러리는 거의 모든 페이지에서 쓰이는데, 이걸 매번 각 페이지 청크에 포함시키면 중복 다운로드가 발생합니다.

이를 해결하기 위해 Vite/Rollup의 manualChunks 옵션을 활용했습니다.
쉽게 말해, 빌드 툴에게 이렇게 지시하는 겁니다.

> react, supabase처럼 공통으로 자주 쓰이는 애들은 따로 vendor.js 같은 파일로 빼줍니다.

```ts
// vite.config.ts

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // manualChunks 설정 - 빌드 시점에 특정 라이브러리를 별도 파일로 분리해요.
        manualChunks: {
          // 'vendor' 청크: React, ReactDOM 등 모든 페이지에서 공통으로 사용하는 핵심 라이브러리
          vendor: ["react", "react-dom", "react-router-dom"],
          // 'supabase' 청크: Supabase 관련 코드
          supabase: ["@supabase/supabase-js", "@supabase/auth-helpers-react"],
          // 'ui' 청크: Recharts, Tailwind UI 컴포넌트 등 UI 관련 라이브러리
          ui: ["recharts", "sonner", "clsx"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### 1-4. 이렇게 분리하면 생기는 장점

- 사용자가 한 번 vendor.js를 받으면, 다른 페이지 이동 시 재다운로드할 필요 없이 캐시를 사용합니다.
- 공통 코드가 각 페이지 청크에 중복 포함되지 않아, 전체 다운로드 용량이 줄어듭니다.
- 첫 페이지 진입 시 꼭 필요한 코드만 로드하고, 나머지는 상황에 따라 불러옵니다.

React.lazy는 필요한 시점에 필요한 페이지만 불러오기, manualChunks는 공통으로 자주 쓰이는 코드 묶어서 효율적으로 캐싱하기로 이해할 수 있습니다.

### 마치며

이번 사례를 통해 React와 Vite를 활용한 대규모 번들 최적화 방법을 정리했습니다.

- React.lazy + Suspense로 페이지 단위 코드 스플리팅을 적용해, 사용자가 실제로 필요할 때만 리소스를 불러오도록 개선했습니다.
- 중첩 라우팅으로 공통 레이아웃 중복을 제거하여 코드 가독성과 유지보수성을 높였습니다.
- Vite manualChunks를 통해 공통 라이브러리를 별도 청크로 분리하고 캐시를 활용하여, 라우팅 지연과 LCP를 효과적으로 개선했습니다.

그 결과, LCP는 4.6초 → 0.4초, 최상 경로 최대 지연 속도는 669ms → 162ms로 단축되어 사용자 체감 성능이 크게 향상되었습니다.
