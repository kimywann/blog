---
title: "Next.js Route Handler로 안전하게 외부 API 호출하기"
date: "2025-08-26"
description: "서버/클라이언트 경계에서 발생하는 API Key 보안 문제와 이를 해결한 Next.js Route Handler 활용 사례"
---

### 들어가며

이번 글에서는 Next.js에서 서버와 클라이언트 컴포넌트의 경계를 이해하고, 클라이언트에서 서버 환경 변수를 직접 호출할 때 발생하는 에러를 살펴봅니다. 이어서, 이를 Route Handler를 활용해 안전하게 처리한 사례를 중심으로 설명합니다.

### 1. 문제 인식

저는 다음과 같은 방식으로 무한 스크롤을 구현하고자 했습니다.

- 첫 진입 시: 서버에서 1페이지 데이터를 미리 가져와서 초기 렌더링을 빠르게 보여주기
- 스크롤 시: 클라이언트에서 이후 모든 페이지 데이터를 동적으로 불러와 무한 스크롤 제공

이를 위해 처음 작성한 코드는 아래와 같았습니다.

```tsx
// 서버 컴포넌트
export default async function HomePage() {
  const initialGames = await getNewAndTrendingGames(1);
  // 서버에서 첫 페이지를 미리 로드
  return <InfiniteScrollWrapper initialData={initialGames} type="trending" />;
}
```

<br />

```typescript
// 클라이언트 컴포넌트
"use client";

const InfiniteScrollWrapper = ({ initialData, type }) => {
  const { data, fetchNextPage } = useInfiniteQuery({
    initialData,
    queryFn: ({ pageParam }) => getNewAndTrendingGames(pageParam),
    // ❌ 클라이언트에서 서버 전용 함수 직접 호출
  });
};
```

이때, 개발 환경에서 다음과 같은 에러가 나타났습니다.\
`Error: RAWG API key is not defined`

### 1-1. 원인 분석

문제의 핵심은 서버와 클라이언트의 경계였습니다. getNewAndTrendingGames 함수는 서버 환경 변수(API Key)를 사용하기 때문에 서버 컴포넌트에서는 1페이지 데이터를 정상적으로 가져올 수 있었지만, 사용자가 스크롤을 내려 추가 데이터를 요청할 때 **클라이언트 컴포넌트에서 호출하면 브라우저에서는 서버 환경 변수에 접근할 수 없어 에러가 발생**했습니다.

### 1-2. 서버에서만 요청할 수 없었을까?

처음에는 “서버에서 데이터를 다 가져오면 안 될까?”라고 생각할 수 있습니다. 하지만 이 프로젝트는 무한 스크롤로 게임 데이터를 페칭하는 구조였기 때문에, 스크롤 이벤트 감지와 페이지 상태 추적 등의 작업이 필요했습니다. 이러한 작업은 클라이언트에서 처리할 수 있어, 클라이언트 컴포넌트에서 API를 호출할 수밖에 없었습니다.

### 1-3. 해결책 고민 — 어떤 방식을 택할 것인가

문제를 해결하기 위해 두 가지 대안을 검토했습니다.

API Key를 클라이언트에서 직접 사용하려면, 환경 변수에 `NEXT_PUBLIC`를 붙여 외부 API를 호출할 수 있습니다. 구현은 간단하지만, 브라우저에 API Key가 노출되어 보안상 위험이 크고, 제 프로젝트와 같이 사용량 제한이 있는 외부 API라면 악용될 수 있어 프로덕션 환경에는 적합하지 않다고 생각했습니다.

저는 이런 위험을 피하기 위해 Next.js `Route Handler`를 사용했습니다. 클라이언트 요청을 Route Handler(서버)가 받아 외부 API로 전달하는 구조로, 요청이 한 번 더 거쳐가므로 약간의 오버헤드가 있지만, 보안과 안정성을 고려하면 신뢰할 수 있는 방법이라 판단했습니다.

### 2. Route Handler로 클라이언트 요청 처리하기

```typescript
// /app/api/games/route.ts
export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const type = request.nextUrl.searchParams.get("type") || "trending";

  let data;
  switch (type) {
    case "trending":
      data = await getNewAndTrendingGames(page); // 서버에서 안전하게 실행
      break;
  }

  return NextResponse.json(data);
}
```

이렇게 Route Handler를 사용하면, 클라이언트의 GET 요청을 서버가 가로채서 처리하게 됩니다.

```typescript
const InfiniteScrollWrapper = ({ initialData, type }) => {
  const { data, fetchNextPage } = useInfiniteQuery({
    initialData,
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/games?page=${pageParam}&type=${type}`).then((res) =>
        res.json()
      ),
  });
};
```

클라이언트에서 직접 API를 호출하며 발생하던 에러는, 위와 같이 수정 후 서버(Route Handler)를 통해 요청을 처리하도록 바꾸면서 해결되었고, API Key는 브라우저에 노출되지 않으며 클라이언트는 데이터 요청과 처리만 담당합니다.

![데이터 통신 다이어그램](/images/posts/nextjs-api-key-security/route-handler.png)

### 마치며

즉, `Route Handler`는 클라이언트와 외부 API 사이의 안전한 프록시 역할을 하며, 클라이언트는 안전하게 데이터를 받아 무한 스크롤을 구현할 수 있습니다. 이번 경험은 단순히 API Key 보안 문제를 해결한 것에 그치지 않고, **서버/클라이언트 컴포넌트 설계와 데이터 흐름을 이해하는 학습 포인트**가 되었습니다.
