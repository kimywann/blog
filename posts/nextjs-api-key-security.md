---
title: "Next.js Route Handler로 API Key 안전하게 관리하기"
date: "2025-08-26"
description: "서버/클라이언트 경계에서 발생하는 API Key 보안 문제와 이를 해결한 Next.js Route Handler 활용 사례"
---

> 서버와 클라이언트 컴포넌트 경계를 이해하고,
>
> Route Handler를 활용해 RAWG API 키 노출 문제를 해결한 경험

### 1. 문제 인식

무한 스크롤 기능을 구현했을 때, 초기에는 서버에서 첫 페이지 데이터를 미리 가져오고,
클라이언트에서 추가 페이지를 로드하는 방식으로 설계했습니다.

```tsx
// 초기 무한 스크롤 구현 시도
export default async function HomePage() {
  const initialGames = await getNewAndTrendingGames(1); // 서버에서 1페이지 먼저 로드

  return <InfiniteScrollWrapper initialData={initialGames} type="trending" />;
}
```

<br />

```typescript
"use client";

const InfiniteScrollWrapper = ({ initialData, type }) => {
  const { data, fetchNextPage } = useInfiniteQuery({
    initialData, // 서버에서 가져온 초기 데이터
    queryFn: ({ pageParam }) => getNewAndTrendingGames(pageParam), // ❌ 클라이언트에서 직접 호출
  });
};
```

이때 브라우저 콘솔에는 다음과 같은 에러가 나타났습니다.\
`Error: RAWG API key is not defined`

### 1-1. 원인 분석

**서버와 클라이언트의 경계 문제**

- 서버에서 1페이지를 미리 가져와서 빠른 첫 렌더링
- 사용자가 스크롤할 때마다 클라이언트에서 2페이지, 3페이지... 동적으로 가져오기

이 과정에서 같은 API 호출 함수를 서버와 클라이언트 양쪽에서 사용하게 되었고, 여기서 문제가 발생했습니다.\
즉, 클라이언트 컴포넌트에서 서버 전용 환경 변수를 사용한 것이 문제였습니다.

### 1-2. 해결책 고민

#### NEXT PUBLIC 접두사 붙이기

장점으로는 가장 간단하고 빠르게 해결 가능\
단점으로는 API 키가 브라우저를 통해 그대로 노출 → 보안 취약

#### Next.js Route Handlers 활용

장점으로는 서버에서 안전하게 API 키 관리 가능\
단점으로는 클라이언트 → 서버 → 외부 API 호출로 한 번 더 경유 → 약간의 오버헤드

저는 안정성을 고려하여 **Route Handlers**를 선택했습니다.

### 2. Route Handlers로 안전하게 구현

구조는 단순합니다.

![데이터 통신 다이어그램](/images/posts/nextjs-api-key-security/route-handler.png)

#### 1. 클라이언트 컴포넌트

API 요청만 보냄

#### 2. Next.js Route Handler (서버)

안전하게 저장된 API 키 사용

#### 3. 외부 API (RAWG) 호출

데이터를 클라이언트에 반환

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

```typescript
const useGetGames = (type) => {
  return useInfiniteQuery({
    queryFn: ({ pageParam }) =>
      fetch(`/api/games?page=${pageParam}&type=${type}`).then((res) =>
        res.json()
      ),
  });
};
```

이렇게 하면 API 키가 브라우저에 노출되지 않으면서, **클라이언트는 단순히 요청과 데이터 처리만 담당**하게 됩니다.

### 마치며

즉, `Route Handler`는 클라이언트와 외부 API 사이의 안전한 프록시 역할을 하며, 클라이언트는 안전하게 데이터를 받아 무한 스크롤을 구현할 수 있습니다. 이번 경험을 통해 단순히 API 키를 숨기는 문제를 해결한 것뿐 아니라, 서버/클라이언트 컴포넌트와 데이터 흐름을 이해할 수 있었던 경험이었습니다.
