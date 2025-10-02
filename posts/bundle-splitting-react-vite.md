---
title: "React 웹 성능 개선: 코드 스플리팅과 청크 분리 전략"
date: "2025-09-10"
description: "React와 Vite에서 커진 JS 번들을 코드 스플리팅과 청크 분리로 최적화해 LCP/FCP를 개선한 과정을 정리합니다"
---

### 들어가며

이번 글에서는 React와 Vite에서 번들 최적화가 필요한 이유를 살펴보고, 페이지 단위 코드 스플리팅과 manualChunks를 활용해 불필요한 리소스 다운로드를 줄이는 방법을 실제 사례를 중심으로 설명합니다.

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

이 문제를 해결하기위해 3가지 과정을 거치게 되었습니다.

### 1-1. React.lazy로 페이지 단위 코드 스플리팅

앞선 문제를 해결하기 위해, React의 lazy와 Suspense를 활용하여 페이지 단위 코드 스플리팅을 적용했습니다.

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

### 1-3. 빌드 단계에서의 청크 최적화

![네트워크 종속 항목 트리](/images/posts/bundle-splitting-react-vite/network-dependency-tree-before.png)

React.lazy로 페이지 단위 코드 스플리팅을 적용해 LCP와 FCP를 일부 개선했지만, Lighthouse 측정 결과 네트워크 종속 항목 트리 경고가 나타났습니다.

여러 페이지에서 공통으로 사용하는 react, react-dom 등과 같은 라이브러리가 각 페이지 청크에 중복으로 포함되면서 두 가지 문제가 발생했습니다.

- 같은 코드가 여러 파일에 번들링되어 전체 다운로드 용량이 불필요하게 증가했습니다.
- 중복으로 인해 커진 메인 JS 파일의 다운로드 과정이 외부 DB(supabase) 호출과 같은 요청들의 처리를 방해했습니다. 실제로 이로 인해 최대 지연 시간은 552ms를 기록했습니다.

React.lazy는 언제 파일을 가져올지를 분리했지만, 무엇을 가져올지는 여전히 비효율적이었습니다. 이 문제를 해결하기 위해 Vite의 manualChunks로 공통 라이브러리를 별도 청크로 분리했습니다.

```ts
// vite.config.ts

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 모든 페이지에서 공통으로 쓰이는 핵심 런타임
          vendor: ["react", "react-dom", "react-router-dom"],
          // 인증/데이터 요청에 필요한 Supabase SDK
          supabase: ["@supabase/supabase-js", "@supabase/auth-helpers-react"],
          query: ["@tanstack/react-query"],
          // 차트 라이브러리 (차트 페이지에서만 사용)
          chart: ["recharts"],
        },
      },
    },
  },
});
```

이렇게 하면 브라우저가 HTML 파싱 단계에서 필요한 파일들을 미리 발견하고 병렬로 다운로드할 수 있어, 체인의 깊이를 줄이고 전체 로딩 시간을 단축할 수 있었습니다.

### 1-4. 청크 분리 적용 결과

![네트워크 종속 항목 트리](/images/posts/bundle-splitting-react-vite/network-dependency-tree-after.png)

manualChunks를 통한 빌드 최적화 후, 복잡하게 얽혀있던 JS 청크 다운로드 체인이 CSS와 메인 JS 두 개로 단순화되면서 브라우저가 리소스를 병렬로 처리할 수 있게 되었습니다. 또한, 최대 지연 시간이 552ms에서 92ms로 460ms 이상 줄어들었습니다. 이는 불필요한 리소스의 다운로드 지연으로 인해 DB 요청이 더 빠르게 처리될 수 있도록 네트워크 환경이 개선되었음을 의미합니다.

### 2. 성능 지표 개선

최적화 후, 주요 성능 지표가 크게 개선되었습니다.

![번들 최적화 후](/images/posts/bundle-splitting-react-vite/bundle-after.png)

- LCP (Largest Contentful Paint) 4.6초 → 0.4초
- FCP(First Contentful Paint) 2.1초 → 0.4초

### 마치며

이번 최적화 경험을 통해 단순히 지표 개선에 그치지 않고, 앞으로는 프로젝트 초기 설계 단계에서부터 이런 번들 전략을 같이 고민해야겠다는 점이 가장 큰 배움이었습니다.
