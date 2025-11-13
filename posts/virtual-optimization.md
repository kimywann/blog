---
title: "무한 스크롤의 메모리 누수, 가상화로 해결하기"
date: "2025-11-12"
description: "TanStack Virtual을 활용하여 리스트를 행 단위로 가상화하고, 렌더링을 최적화한 과정을 정리합니다."
---

### 들어가며

이전 GAME DB 프로젝트에서 무한 스크롤을 구현했습니다. 스크롤하면 데이터를 불러오는 방식이었습니다.

기능은 잘 작동했지만, 뭔가 찝찝했습니다. 계속 스크롤하면 괜찮을까?

그래서 크롬 개발자 도구의 **Memory 탭**에서 힙 스냅샷을 찍어보니 이상한 점을 발견했습니다.

- 스크롤을 내릴수록 메모리 사용량이 계속 증가
- Elements 탭을 열어보니 DOM 노드가 계속 누적되고 있었음

이 상태로 저사양 환경에서 수 천번 스크롤한다면 브라우저 성능 저하나 렌더링 지연이 발생할 수 있다는 점이 우려되었습니다.

### 기존 방식의 문제점

- 화면에 보이지 않는 데이터도 DOM에 계속 남아있음
- 스크롤이 길어질수록 렌더링 및 메모리 부담 증가
- 컴포넌트 수가 많을수록 리렌더링 비용 누적

### 실제로 필요한 건 뭘까?

사용자는 **현재 화면에 보이는 영역**만 볼 수 있습니다.
스크롤을 내려서 위쪽 항목이 화면 밖으로 사라졌다면,
그 DOM은 굳이 메모리에 남아있을 필요가 없겠죠.

### 해결 방법 - 가상화(Virtualization)란?

> "화면에 보이는 영역만 렌더링하고, 나머지는 빈 공간으로 대체하자"

**일반 무한 스크롤:**

```
[게임1] [게임2] [게임3] ... [게임500]
전부 DOM에 존재
```

**가상화:**

```
[빈공간] [게임48] [게임49] [게임50] [빈공간]
화면에 보이는 것만 DOM에 존재
```

스크롤하면

- 위로 사라진 게임 → DOM에서 제거
- 아래서 나타날 게임 → DOM에 추가

### 라이브러리 선택

이를 해결하기 위해 TanStack Virtual을 도입했습니다.
다른 가상화 라이브러리와 비교했을 때

• 꾸준한 업데이트
• 높은 사용률
• 기존에 사용 중이던 TanStack Query와의 궁합
• 가벼운 번들 사이즈

이 네 가지 이유로 선택했습니다.

<!-- ### 반응형 그리드 컬럼 계산

가상화 전, 제 프로젝트는 **그리드 레이아웃**이었습니다.
화면 크기에 따라 1~5개의 컬럼으로 변하는 반응형 디자인이죠.

이 경우 "행(row)" 단위로 가상화해야 합니다.

```tsx
function useColumns() {
  const [columns, setColumns] = useState(1);

  useLayoutEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1800) setColumns(5);
      else if (width >= 1536) setColumns(4);
      else if (width >= 1280) setColumns(3);
      else if (width >= 640) setColumns(2);
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}
```

이 훅은 단순하지만, 그리드형 가상화의 핵심입니다.
전체 데이터의 “행(row)” 개수를 계산하는 기준이 되기 때문이죠. -->

### useWindowVirtualizer 설정

이제 @tanstack/react-virtual의 useWindowVirtualizer를 이용해
실제로 화면에 보이는 “행(row)”만 렌더링해보자.

```tsx
import { useWindowVirtualizer } from "@tanstack/react-virtual";

const rowVirtualizer = useWindowVirtualizer({
  count: rowCount, // 총 행 수 (게임 수 / 컬럼 수)
  estimateSize: () => 380, // 각 행 높이
  overscan: 3, // 화면 밖에도 미리 렌더링할 행 개수 설정
});

// 화면에 실제 렌더링할 항목들
const virtualItems = rowVirtualizer.getVirtualItems();
```

virtualItems에는 현재 화면에 보여야 할 행의 정보만 들어있습니다.
row.start로 Y축 위치, row.size로 높이를 알 수 있어요.

### 행 단위 렌더링 구조

```tsx
<div
  style={{
    height: `${rowVirtualizer.getTotalSize()}px`, // 전체 스크롤 높이 확보
    position: "relative",
  }}
>
  {virtualItems.map((row) => {
    const startIndex = row.index * columns;
    const items = games.slice(startIndex, startIndex + columns);

    return (
      <div
        key={row.key}
        style={{
          position: "absolute",
          top: 0,
          transform: `translateY(${row.start}px)`,
          height: `${row.size}px`,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "1rem",
        }}
      >
        {items.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    );
  })}
</div>
```

각 “행”을 absolute로 배치하고, translateY로 스크롤 위치를 맞춘다.
이렇게 하면 브라우저는 실제로는 몇 십 개의 DOM만 유지하지만,
사용자 눈에는 전체 목록이 있는 것처럼 보인다.

### 무한 스크롤 트리거

- 마지막 행 근처에 도달했을 때 다음 데이터를 불러오기 위해 ref 사용

```tsx
const isNearEnd = virtualRow.index >= rowCount - 2;

// 끝에 다다르면 트리거
<div ref={isNearEnd ? triggerRef : undefined}>...</div>;
```

TanStack Query의 fetchNextPage() 등과 결합하면 자연스러운 무한 스크롤 완성
스크롤이 끝에 다다르면 다음 페이지를 불러옵니다.

## 마치며

GAME DB에서 무한 스크롤은 사용자 경험 측면에서 필수적이지만,
데이터 양이 많아질수록 브라우저 성능에 부담을 주는 구조입니다.

가상화를 적용하면
“렌더링은 필요한 만큼만, 데이터는 필요한 시점에만”
처리할 수 있어 성능과 유지보수성 모두 개선됩니다.
