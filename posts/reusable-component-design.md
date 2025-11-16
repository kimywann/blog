---
title: "재사용 가능한 컴포넌트 설계"
date: "2025-11-14"
description: "반복되는 배지 UI 패턴을 InfoBadge 컴포넌트로 추출하여 코드 중복 줄인 리팩토링 과정"
---

들어가며
팀원 모집 플랫폼 프로젝트를 진행하면서, 어느 순간 계속 같은 코드를 복사-붙여넣기하고 있는 저를 발견했습니다. ProfileCard를 만들 때도, PostCard를 만들 때도, "배지 + 텍스트"를 표시하는 패턴이 계속 반복되었죠. 처음에는 "빨리 기능만 구현하자"는 생각으로 넘어갔지만, 점점 문제가 보이기 시작했습니다. 스타일을 조금만 바꾸려 해도 여러 파일을 수정해야 했고, 실수로 한 곳만 빠뜨리면 디자인이 어긋나버렸습니다.

그래서 결심했습니다. "이 반복되는 패턴을 컴포넌트로 만들어보자!"
이 글에서는 실제 프로젝트에서 중복 코드를 재사용 가능한 InfoBadge 컴포넌트로 리팩토링한 과정과, 그 과정에서 배운 점들을 공유합니다.

### 문제 상황

```tsx
// ProfileCard.tsx - 개선 전
<div className="flex items-center gap-2">
  <Badge
    variant="outline"
    className="border-none bg-green-300/20 text-sm text-green-500"
  >
    희망 포지션
  </Badge>
  <p className="text-muted-foreground">{profile.position}</p>
</div>

<div className="flex items-center gap-2">
  <Badge
    variant="outline"
    className="border-none bg-blue-300/20 text-sm text-blue-500"
  >
    경력
  </Badge>
  <p className="text-muted-foreground">{profile.experience}</p>
</div>

<div className="flex items-center gap-2">
  <Badge
    variant="outline"
    className="border-none bg-red-300/20 text-sm text-red-500"
  >
    지역
  </Badge>
  <p className="text-muted-foreground">{profile.region}</p>
</div>
```

그리고 PostCard에서도 비슷하게 사용하고 있었습니다.

PostCard.tsx - 개선 전

```tsx
<div className="flex items-center gap-2">
  <Badge variant="outline" className="bg-gray-200 text-gray-700">
    진행 방식
  </Badge>
  <p className="text-muted-foreground">{props.progress_method}</p>
</div>

<div className="flex items-center gap-2">
  <Badge variant="outline" className="bg-gray-200 text-gray-700">
    활동 기간
  </Badge>
  <p className="text-muted-foreground">{props.duration}</p>
</div>
```

#### 문제점

같은 패턴이 3번, 4번, 5번... 계속 반복되고 있었습니다.
코드가 길어지면서 불필요하게 반복되는 것을 볼 수 있는데,
만약 디자이너가 "배지 간격을 2px 더 넓혀주세요"라고 요청하면 어떻게 될까요?

ProfileCard 열기 → 3곳 수정
PostCard 열기 → 2곳 수정

나중에 추가될 다른 카드들...?

한 군데만 빠뜨려도 UI가 들쑥날쑥해집니다. 그리고 그걸 발견하는 건 보통 배포 직전이죠.

다음에 배지를 쓰려고 할 때 또 복사-붙여넣기...

<div className="flex items-center gap-2">
  <Badge variant="outline" className="border-none bg-purple-300/20...">
    새로운 정보
  </Badge>
  <p className="text-muted-foreground">{someValue}</p>
</div>
"어... className 뭐였더라? 다른 거 복사해와야지..."

이런 식으로 개발하면 실수도 많아지고, 코드 리뷰할 때도 "또 이 패턴이네"라는 피드백만 반복됩니다.

### 해결 과정: InfoBadge 컴포넌트 만들기

1단계: 공통 패턴 파악하기
먼저 반복되는 부분을 분석했습니다:
[배지 - 라벨] + [값 텍스트]

공통점: 배지와 텍스트를 나란히 배치
차이점: 배지 색상, 라벨 텍스트, 표시할 값

"아, 이 차이점들을 props로 받으면 되겠네!"
2단계: 컴포넌트 인터페이스 설계

```tsx
interface InfoBadgeProps {
  label: string; // 배지에 들어갈 텍스트
  value: string;
  variant?: "default" | "green" | "blue" | "red" | "gray"; // 색상
  className?: string; // 혹시 모를 커스터마이징
}
```

**variant 시스템을 도입한 이유?**

매번 긴 className을 쓰는 게 번거로웠어요.
variant="green"만 써도 정해진 스타일이 적용되면 편할 것 같았습니다.

3단계: 구현하기

```tsx
// InfoBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InfoBadgeProps {
  label: string;
  value: string | React.ReactNode;
  variant?: "default" | "green" | "blue" | "red" | "gray";
  className?: string;
}

// 색상 스타일을 객체로 관리 - 나중에 추가/수정 쉽게!
const variantStyles = {
  default: "border-none bg-gray-200 text-gray-700",
  green: "border-none bg-green-300/20 text-sm text-green-500",
  blue: "border-none bg-blue-300/20 text-sm text-blue-500",
  red: "border-none bg-red-300/20 text-sm text-red-500",
  gray: "bg-gray-200 text-gray-700",
};

export function InfoBadge({
  label,
  value,
  variant = "default",
  className,
}: InfoBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(variantStyles[variant], className)}
      >
        {label}
      </Badge>
      <p className="text-muted-foreground">{value}</p>
    </div>
  );
}
```

#### 구현 포인트

variantStyles 객체: 색상 스타일을 한 곳에서 관리하니 나중에 수정하기 쉬워요.
cn 유틸리티: 기본 스타일과 커스텀 className을 깔끔하게 병합해줍니다.
기본값 설정: variant = "default"로 props를 안 넘겨도 동작하게 했습니다.

4단계: 적용하기
이제 기존 코드를 바꿔봅시다!

```tsx
ProfileCard - Before (25줄)
tsx<div className="flex items-center gap-2">
<Badge className="border-none bg-green-300/20 text-sm text-green-500">
희망 포지션
</Badge>
  <p className="text-muted-foreground">{profile.position}</p>
</div>
// ... 2개 더 반복
```

```tsx
ProfileCard - After (6줄!)
tsx<div className="flex w-full flex-col gap-2">
  <InfoBadge label="희망 포지션" value={profile.position} variant="green" />
  <InfoBadge label="경력" value={profile.experience} variant="blue" />
  <InfoBadge label="지역" value={profile.region} variant="red" />
</div>
```

PostCard도 마찬가지로:

```tsx
<section className="flex w-full flex-col gap-3">
  <InfoBadge label="진행 방식" value={props.progress_method} variant="gray" />
  <InfoBadge label="활동 기간" value={props.duration} variant="gray" />
</section>
```

개선 효과: 숫자로 보는 변화
📊 코드 라인 감소
컴포넌트BeforeAfter감소율ProfileCard~25줄~6줄76% 감소PostCard~10줄~6줄40% 감소중복 코드3곳 이상0곳완전 제거
⚡ 개발 생산성 향상
새 정보 추가할 때:

Before: 7줄 작성 + className 찾아서 복사
After: <InfoBadge label="..." value="..." variant="..." /> 1줄!

스타일 수정할 때:

Before: 여러 파일 열어서 수정 → 놓치기 쉬움
After: InfoBadge.tsx 한 파일만 수정

🛡️ 유지보수성 개선

일관성 보장: 모든 곳에서 같은 컴포넌트 사용
버그 수정: 한 곳만 고치면 전체 적용
디자인 변경: variant 스타일만 수정하면 끝

배운 점: 실전에서 얻은 인사이트

1. "일단 되게 만들고, 리팩토링은 나중에"는 맞는 말이다
   처음부터 완벽한 컴포넌트를 설계하려고 하면 진도가 안 나갑니다. 저도 처음엔 복붙으로 빠르게 기능을 구현했어요.
   하지만 중요한 건, 그 "나중에"를 실제로 실행하는 것입니다.
   같은 패턴이 3번 반복되면 리팩토링 신호라고 생각하세요. 저는 3번째 복붙할 때 "이건 아니다" 싶어서 바로 작업했습니다.
2. 컴포넌트 설계는 "미래의 나"를 위한 친절이다
   tsx// ❌ 이렇게 만들면?
   <InfoBadge label="경력" value={profile.experience} color="blue" />

// ✅ 이게 더 명확하다
<InfoBadge label="경력" value={profile.experience} variant="blue" />
color보다 variant가 더 명확합니다. "단순히 색이 아니라, 정해진 스타일 변형 중 하나"라는 의미가 담겨있거든요.
좋은 Props 이름은 코드를 문서처럼 읽히게 만듭니다. 3. TypeScript는 리팩토링의 든든한 동료
tsxvariant?: "default" | "green" | "blue" | "red" | "gray";
이렇게 타입을 정의해두면, 존재하지 않는 variant를 쓰려고 하면 즉시 에러가 발생합니다.
tsx<InfoBadge variant="purple" /> // ❌ 타입 에러!
리팩토링 후 "어디서 잘못 썼나?" 찾아다닐 필요가 없어요. TypeScript가 다 알려줍니다. 4. 작은 컴포넌트부터 시작하자
처음부터 거창한 디자인 시스템을 만들려고 하면 부담스럽습니다. 저도 그냥 "이 반복되는 패턴 하나만 정리하자"고 시작했어요.
InfoBadge → 다른 Badge 컴포넌트 → 나중엔 전체 디자인 시스템으로
이렇게 점진적으로 확장하는 게 훨씬 현실적입니다. 5. 확장 가능성을 열어두되, 과도하게 추상화하지 말기
tsxvalue: string | React.ReactNode // ✅ 유연하지만 심플
처음엔 "나중에 아이콘도 넣을 수 있으면 좋겠다"는 생각에 이렇게 설계했습니다. 실제로 나중에 도움이 됐어요.
하지만 "모든 경우의 수를 다 대비해야지!" 하고 props를 20개 만들면 오히려 사용하기 복잡해집니다.
지금 필요한 것 + 가까운 미래에 필요할 것 정도만 고려하는 게 적당합니다. 6. 리팩토링은 "코드 리뷰 통과"의 지름길
중복 코드를 제거하니 PR 리뷰어가 남기는 코멘트가 확 줄었습니다.

좋은 코드는 리뷰하기도 쉬운 코드입니다.

마무리하며
처음 복붙할 땐 "빠르게 기능만 구현하자"였는데, 결국 리팩토링에 시간을 더 쓰게 됐습니다. 하지만 그 시간은 결코 낭비가 아니었어요.
InfoBadge 하나 만드는 데 1시간 걸렸지만:

이후 새 기능 추가는 5분이면 끝
디자인 수정은 1곳만 바꾸면 전체 적용
다른 팀원도 쉽게 사용 가능

"반복된다 = 기회다"
여러분의 코드에서도 같은 패턴이 계속 보인다면, 그게 바로 더 나은 코드로 성장할 기회입니다. 두려워하지 말고 리팩토링해보세요!
