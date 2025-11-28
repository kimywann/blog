---
title: "Supabase 회원가입 401 Unauthorized 에러 해결기"
date: "2025-11-29"
description: "Next.js + Supabase 환경에서 회원가입 시 401 Unauthorized 문제를 해결한 경험 정리"
---

# Supabase 회원가입 401 Unauthorized 에러 해결기

Next.js + Supabase로 회원가입 기능을 만들다가 겪었던 문제와 해결 과정을 정리한다. 회원가입을 하면 `auth.users`에는 데이터가 잘 들어가는데, 내가 만든 `users` 테이블에는 값이 들어가지 않고 계속 401 Unauthorized 에러가 발생했다.

POST https://[프로젝트].supabase.co/rest/v1/users 401 (Unauthorized)

## 문제 상황

처음엔 코드 문제라고 생각했지만 원인은 전혀 다른 곳에 있었다.

- `auth.signUp()`은 정상 동작 → `auth.users` 테이블에는 유저가 생성됨
- 하지만 `users` 테이블로 insert 요청을 보내면 401 Unauthorized
- RLS 정책을 바꿔봐도 계속 실패
- `auth.uid()`를 찍어보면 `null`
- 즉, 인증되지 않은 상태로 DB에 접근하고 있었음

## 시도했던 방법들

### 1. RLS 정책을 의심했다

처음엔 RLS 설정 문제라고 생각하고 아래처럼 정책을 넣어봤다.

```sql
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);
```

하지만 결과는 동일했다.
그리고 콘솔에서 auth.uid()가 계속 null이 나오는 걸 보고 이상함을 느꼈다.

### 2. 원인은 “세션이 없다”는 것

Supabase 문서를 보다가 핵심 원인을 발견했다. Supabase는 회원가입 직후 이메일 인증을 완료하기 전까지 세션을 생성하지 않는다.

```typescript
const { data: { user, session } } = await supabase.auth.signUp({...});
console.log(session); // null이라고 출력됨
```

세션이 null → 인증된 사용자 아님 → RLS에 막힘 → 401 Unauthorized로 실패

#### 해결 방법

✔️ 방법 1

- 개발 중이라면 이메일 인증 끄기 (임시 해결)
- Supabase Dashboard → Authentication → Settings → Email Auth
  → Enable email confirmations 체크 해제

이렇게 하면 회원가입 직후 바로 세션이 생성되어 insert가 가능해진다.

✔️ 방법 2

- 권장 솔루션 — Database Trigger 사용 Supabase가 공식적으로 추천하는 방식이다.
- 회원이 생성되면 DB가 자동으로 users 테이블에 프로필을 생성하도록 트리거를 만든다.
- SQL (Supabase SQL Editor에 실행)

```sql
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.users (id, email, nickname)
VALUES (
NEW.id,
NEW.email,
NEW.raw_user_meta_data->>'nickname'
);
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 연결
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

이제 회원가입 시 users 테이블에 직접 insert할 필요 없다.
닉네임만 메타데이터로 담아서 보내면 된다.

```typescript
const handleSubmit = async (values: z.infer) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          nickname: values.nickname,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      return;
    }

    toast.success("회원가입 완료! 이메일을 확인해주세요.");
    router.push("/");
  } catch (error) {
    console.error("회원가입 오류:", error);
  }
};
```

### 트리거 방식의 장점

- 프론트엔드 코드가 훨씬 깔끔해짐
- RLS 문제에서 해방
- auth 생성 실패 시 users 테이블도 자동 일관성 유지
- OAuth(Google, Kakao 등) 추가해도 그대로 동작 → 확장성 최고

## 배운 점

- Supabase의 auth와 일반 테이블은 완전히 별개다.
- 회원가입 직후에는 세션이 없어서 insert가 막히는 게 정상 동작이다.
- Database Trigger는 강력하고 안정적인 백엔드 로직 처리 방식이다.
- 공식 문서를 꼼꼼히 읽는 게 시간을 아끼는 지름길이다.
- 401은 "권한 없음"이라는 뜻인데, 로직 문제라고 오해하고 한참 돌아갔다.
- 이번 경험 덕분에 Supabase 구조를 제대로 이해하게 되었고, 앞으로 OAuth 로그인 기능을 추가할 때도 같은 패턴을 그대로 활용할 수 있을 것 같다.
